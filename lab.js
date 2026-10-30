'use strict';
const $=s=>document.querySelector(s);
let frame,g,current,token=0,revision=0,running=false,mode='surface',source=null,motion=null,pendingLoad=null;
function status(s){$('#status').textContent=s}function lock(b){document.querySelectorAll('.studio button,.studio input,.notes button').forEach(e=>e.disabled=b)}
function finite(){let a=g.model.getPositionsArray();if(!a.length||!Array.from(a).every(Number.isFinite))throw Error('The solver geometry is unavailable. Reset to recover.');return a}
function setFold(n){if(!motion)return;motion.moveTo(n);revision++}
function setRunning(v){if(!motion)return;v?motion.moveTo(+$('#fold').value):motion.pause();revision++}
function motionState(engine, active, message, value){
 if(engine!==g)return;
 running=active;
 $('#fold').value=value;$('#percent').textContent=value+'%';
 iconButton($('#play'),active?'pause':'play',active?'Pause folding':'Resume folding');
 status(message);g.threeView.requestRender();
}
function setView(v){if(!g||!['surface','creases'].includes(v))return;mode=v;g.colorMode='color';g.meshVisible=v==='surface';g.edgesVisible=v==='creases';g.calcFaceStrain=false;g.model.setMeshMaterial();g.model.updateMeshVisibility();g.model.updateEdgeVisibility();g.threeView.requestRender();document.querySelectorAll('[data-view]').forEach(e=>e.setAttribute('aria-pressed',String(e.dataset.view===v)));revision++}
function disposeFrame(el){
 if(!el || el._disposed)return;
 el._disposed=true;
 const eg=el.contentWindow?.globals;
 for(const cleanup of [()=>el._motion?.dispose(),()=>eg?.threeView?.dispose(),()=>eg?.gpuMath?.dispose(),()=>{const ctx=el.contentDocument?.getElementById('gpuMathCanvas')?._origamiGL;if(ctx&&!ctx.isContextLost())ctx.getExtension('WEBGL_lose_context')?.loseContext()}]){
  try{cleanup()}catch(error){console.warn('Engine cleanup:',error)}
 }
 el.remove();
}
function waitForPaper(el, signal){
 return new Promise((resolve,reject)=>{
  const started=performance.now();
  const finish=(error,value)=>{clearInterval(timer);signal.removeEventListener('abort',aborted);error?reject(error):resolve(value)};
  const aborted=()=>finish(new DOMException('Superseded','AbortError'));
  const timer=setInterval(()=>{
   try{
    if(signal.aborted){aborted();return}
    if(el.contentWindow?.origamiEngineError)throw Error(el.contentWindow.origamiEngineError);
    const ng=el.contentWindow?.globals;
    if(ng?.gpuMath?.isContextLost() || ng?.threeView?.renderer.getContext().isContextLost())throw Error('Graphics could not load this model. Try resetting or another pattern.');
    // Hidden iframe animation frames may be throttled on mobile. Flush pending
    // model work explicitly instead of making readiness depend on animation.
    if(ng?.model && ng.needsSync)ng.model.sync();
    if(ng?.model && ng.simNeedsSync)ng.model.syncSolver();
    if(ng?.model?.getPositionsArray()?.length && !ng.needsSync && !ng.simNeedsSync){
     const a=ng.model.getPositionsArray();if(!Array.from(a).every(Number.isFinite))throw Error('This model did not produce valid paper geometry.');
     finish(null,ng);
    }else if(performance.now()-started>25000)throw Error('This model took too long to load. The previous paper is preserved.');
   }catch(error){finish(error)}
  },50);
  signal.addEventListener('abort',aborted,{once:true});
  if(signal.aborted)aborted();
 });
}
async function load(p,data=null){
 if(!p)return;
 const mine=++token;
 const previous={frame,g,motion,current,source,target:+$('#fold').value};
 if(pendingLoad){pendingLoad.abort.abort();disposeFrame(pendingLoad.frame)}
 motion?.pause();
 if(frame){frame.style.pointerEvents='none';g.threeView.enableControls(false)}
 lock(true);status('Loading '+p.name+'…');
 const next=document.createElement('iframe'),abort=new AbortController();
 next.title='Interactive origami simulation';next.style.visibility='hidden';next.style.pointerEvents='none';next.tabIndex=-1;
 next.src='engine/index.html?managed=1&v=20261030-stability&model='+p.file;
 pendingLoad={frame:next,abort};$('#viewport').append(next);
 try{
  const ng=await waitForPaper(next,abort.signal);
  if(data){ng.pattern.setFoldData(structuredClone(data),false);await waitForPaper(next,abort.signal)}
  applyAppearance(ng);ng.threeView.setCameraIso();
  const nextMotion=createMotionController(ng,(active,message,value)=>motionState(ng,active,message,value));
  next._motion=nextMotion;
  await nextMotion.prepare(35,abort.signal);
  if(mine!==token || abort.signal.aborted)throw new DOMException('Superseded','AbortError');
  ng.threeView.renderer.render(ng.threeView.scene,ng.threeView.camera);
  const old=frame;
  frame=next;g=ng;motion=nextMotion;current=p;source=data;
  frame.style.visibility='visible';frame.style.pointerEvents='';frame.tabIndex=0;g.threeView.enableControls(true);
  $('#title').textContent=p.name;$('#name').textContent=p.name;$('#description').textContent=p.description;$('#credit').textContent='Pattern · '+(p.credit||'Local file');
  document.querySelectorAll('nav button').forEach(e=>{e.classList.toggle('active',e.dataset.id===p.id);e.setAttribute('aria-pressed',String(e.dataset.id===p.id))});
  setView('surface');updateReference(p);motion.pause('Held at 35%');revision++;
  disposeFrame(old);
 }catch(error){
  if(mine===token && frame===next){
   frame=previous.frame;g=previous.g;motion=previous.motion;current=previous.current;source=previous.source;
   if(current){$('#title').textContent=current.name;$('#name').textContent=current.name;$('#description').textContent=current.description;$('#credit').textContent='Pattern · '+(current.credit||'Local file');$('#fold').value=previous.target;$('#percent').textContent=previous.target+'%';updateReference(current)}
  }
  disposeFrame(next);
  if(mine===token && error.name!=='AbortError')status(error.message);
 }finally{
  if(mine===token){pendingLoad=null;lock(false);if(frame?.isConnected){frame.style.pointerEvents='';g.threeView.enableControls(true)}}
 }
}
function validate(d){const fail=()=>{throw Error('Use a FOLD file with finite vertices, valid faces, edges and M/V/B/F assignments (maximum 1,000 vertices).')};if(!d||!Array.isArray(d.vertices_coords)||!d.vertices_coords.length||d.vertices_coords.length>1000||!Array.isArray(d.edges_vertices)||!Array.isArray(d.faces_vertices)||!d.faces_vertices.length||d.edges_vertices.length>3000||d.faces_vertices.length>2000)fail();let n=d.vertices_coords.length;for(const v of d.vertices_coords)if(!Array.isArray(v)||![2,3].includes(v.length)||!v.every(Number.isFinite))fail();for(const [arr,min,max] of [[d.edges_vertices,2,2],[d.faces_vertices,3,12]])for(const a of arr)if(!Array.isArray(a)||a.length<min||a.length>max||new Set(a).size!==a.length||!a.every(i=>Number.isInteger(i)&&i>=0&&i<n))fail();if(!Array.isArray(d.edges_assignment)||d.edges_assignment.length!==d.edges_vertices.length||!d.edges_assignment.every(a=>['M','V','B','F'].includes(a)))fail();if(d.edges_foldAngle&&(!Array.isArray(d.edges_foldAngle)||d.edges_foldAngle.length!==d.edges_vertices.length||!d.edges_foldAngle.every(a=>a===null||(Number.isFinite(a)&&Math.abs(a)<=180))))fail();return d}
function geometry(){const a=finite(),d=structuredClone(g.pattern.getFoldData(false));d.vertices_coords=Array.from({length:a.length/3},(_,i)=>Array.from(a.slice(i*3,i*3+3)));d.file_spec=1.1;d.frame_classes=['foldedForm'];return d}
function download(text,ext){const url=URL.createObjectURL(new Blob([text],{type:'application/octet-stream'}));const a=document.createElement('a');a.href=url;a.download='origami-lab.'+ext;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function renderCollection(){const q=$('#search').value.toLowerCase();$('nav').replaceChildren();patterns.filter(p=>(p.name+' '+p.group).toLowerCase().includes(q)).forEach(p=>{const b=document.createElement('button');b.dataset.id=p.id;b.className='pattern-icon'+(current?.id===p.id?' active':'');b.title=p.name;b.setAttribute('aria-label',p.name);b.setAttribute('aria-pressed',String(current?.id===p.id));b.dataset.tip=p.name;const img=new Image();img.src='docs/thumbs/'+p.id+'.png';img.alt='';img.onerror=()=>{img.remove();b.append(document.createTextNode('◇'))};b.append(img);b.onclick=()=>load(p);$('nav').append(b)});$('#count').textContent=patterns.length+' PAPER STUDIES'}
$('#search').oninput=renderCollection;renderCollection();
$('#fold').oninput=e=>setFold(+e.target.value);$('#play').onclick=()=>setRunning(!running);$('#reset').onclick=()=>load(current,source);$('#camera').onclick=()=>{g.threeView.resetCamera();g.threeView.setCameraIso()};document.querySelectorAll('[data-view]').forEach(e=>e.onclick=()=>setView(e.dataset.view));
$('#capture').onclick=()=>{try{finite();const r=g.threeView.renderer;r.render(g.threeView.scene,g.threeView.camera);r.domElement.toBlob(blob=>{if(!blob){status('Screenshot unavailable. Please try again.');return}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=current.id+'-'+$('#fold').value+'-percent.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('Screenshot saved')},'image/png')}catch(e){status(e.message)}};
$('#foldExport').onclick=()=>{try{download(JSON.stringify(geometry()),'fold')}catch(e){status(e.message)}};$('#meshExport').onclick=()=>{try{const d=geometry();download(d.vertices_coords.map(v=>'v '+v.join(' ')).concat(d.faces_vertices.map(f=>'f '+f.map(i=>i+1).join(' '))).join('\n'),'obj')}catch(e){status(e.message)}};
$('#import').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;if(f.size>512*1024)throw Error('Choose a FOLD file smaller than 512 KB.');const d=validate(JSON.parse(await f.text()));await load({...patterns[0],id:'custom',name:'Your paper study',description:'Imported local FOLD geometry.',challenge:'Compare two fold targets and inspect the silhouette.'},d)}catch(e){status(e instanceof SyntaxError?'This file is not valid JSON. Your current paper is preserved.':e.message)}finally{e.target.value=''}};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&g)setRunning(false)});
appearance.onChange=()=>{if(g)applyAppearance(g)};
window.origami={patterns,loadPattern:id=>load(patterns.find(p=>p.id===id)),validate,getSnapshot:()=>({schemaVersion:1,revision,patternId:current?.id,status:$('#fold').disabled?'loading':(running?'running':'paused'),foldTargetPercent:+$('#fold').value,running,viewMode:mode,theme:appearance.theme,paperColor:appearance.paper,metrics:null}),geometry};load(patterns[0]);

function updateReference(p){
 const img=$('#finishedImage');img.onerror=null;
 $('#finishedCaption').dataset.custom=String(p.id==='custom');
 if(p.id==='custom'){
   const view=g.threeView,background=view.scene.background,color1=g.color1,color2=g.color2;
   try{g.color1='fffff0';g.color2='d1d1c5';g.model.setMeshMaterial();view.scene.background=null;view.renderer.setClearColor(0,0);view.renderer.render(view.scene,view.camera);img.src=view.renderer.domElement.toDataURL('image/png');img.alt='Imported geometry'}
   finally{g.color1=color1;g.color2=color2;g.model.setMeshMaterial();view.scene.background=background;view.renderer.render(view.scene,view.camera)}
 }else{img.src='docs/finished/'+p.id+'.png';img.alt=p.name+' folded reference at 100% target'}
 updatePreviewColor();
}
