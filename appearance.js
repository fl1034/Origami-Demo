'use strict';
// Paper swatches use CSS named colors from W3C CSS Color 4.
// Theme palettes are curated separately; changing one never changes the other.
const studioThemes = [
  {id:'linen',name:'Linen',bg:'#faf0e6',ink:'#3b332d',muted:'#75665b',panel:'#eee2d5',line:'#cdbfae',accent:'#5e674c',onAccent:'#ffffff'},
  {id:'sage',name:'Sage',bg:'#edf2e8',ink:'#293d32',muted:'#5a6d5f',panel:'#dce6d5',line:'#b3c5ad',accent:'#42624d',onAccent:'#ffffff'},
  {id:'rose',name:'Rose',bg:'#fff0f5',ink:'#4b3041',muted:'#806476',panel:'#f0dfe8',line:'#d7bbc9',accent:'#825169',onAccent:'#ffffff'},
  {id:'slate',name:'Slate',bg:'#2f4f4f',ink:'#f1f5ef',muted:'#c0d2ca',panel:'#3a5b5b',line:'#72908b',accent:'#dce9d7',onAccent:'#233d35'},
  {id:'midnight',name:'Midnight',bg:'#171d2b',ink:'#ecedf5',muted:'#b2bbce',panel:'#242e40',line:'#53617a',accent:'#c5d0ed',onAccent:'#202b42'}
];
const paperSwatches = [
  ['Ivory','fffff0'],['Old Lace','fdf5e6'],['Linen','faf0e6'],['Wheat','f5deb3'],['Burly Wood','deb887'],['Tan','d2b48c'],
  ['Goldenrod','daa520'],['Gold','ffd700'],['Khaki','f0e68c'],['Peach Puff','ffdab9'],['Sandy Brown','f4a460'],['Dark Orange','ff8c00'],
  ['Coral','ff7f50'],['Salmon','fa8072'],['Light Coral','f08080'],['Indian Red','cd5c5c'],['Firebrick','b22222'],['Maroon','800000'],
  ['Light Pink','ffb6c1'],['Pale Violet Red','db7093'],['Plum','dda0dd'],['Thistle','d8bfd8'],['Medium Purple','9370db'],['Rebecca Purple','663399'],
  ['Lavender','e6e6fa'],['Light Steel Blue','b0c4de'],['Sky Blue','87ceeb'],['Cornflower Blue','6495ed'],['Steel Blue','4682b4'],['Midnight Blue','191970'],
  ['Pale Turquoise','afeeee'],['Turquoise','40e0d0'],['Cadet Blue','5f9ea0'],['Teal','008080'],['Aquamarine','7fffd4'],['Sea Green','2e8b57'],
  ['Honeydew','f0fff0'],['Dark Sea Green','8fbc8f'],['Yellow Green','9acd32'],['Olive','808000'],['Sienna','a0522d'],['Chocolate','d2691e'],
  ['White Smoke','f5f5f5'],['Silver','c0c0c0'],['Slate Gray','708090'],['Dim Gray','696969'],['Dark Slate Gray','2f4f4f'],['Black','000000']
];
const appearance={theme:'linen',paper:'Ivory',onChange:null};
try{const saved=JSON.parse(localStorage.getItem('origami-appearance')||'{}');if(studioThemes.some(t=>t.id===saved.theme))appearance.theme=saved.theme;if(paperSwatches.some(p=>p[0]===saved.paper))appearance.paper=saved.paper}catch(e){}
function saveAppearance(){try{localStorage.setItem('origami-appearance',JSON.stringify({theme:appearance.theme,paper:appearance.paper}))}catch(e){}}
function renderAppearance(){
  const theme=studioThemes.find(t=>t.id===appearance.theme);
  for(const key of ['bg','ink','muted','panel','line','accent','onAccent'])document.documentElement.style.setProperty('--'+key,theme[key]);
  document.documentElement.style.colorScheme=['slate','midnight'].includes(theme.id)?'dark':'light';
  document.querySelector('#themeName').textContent=theme.name;
  document.querySelector('#paperName').textContent=appearance.paper;
  document.querySelectorAll('[data-theme]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.theme===appearance.theme)));
  document.querySelectorAll('[data-paper]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.paper===appearance.paper)));
  updatePreviewColor();saveAppearance();if(appearance.onChange)appearance.onChange();
}
function applyAppearance(engine){
  const theme=studioThemes.find(t=>t.id===appearance.theme),hex=paperSwatches.find(p=>p[0]===appearance.paper)[1];
  engine.threeView.setBackgroundColor(theme.bg.slice(1));
  engine.color1=hex;
  // Same pigment on the reverse, slightly darker to make turned edges legible.
  engine.color2=hex.match(/../g).map(h=>Math.round(parseInt(h,16)*0.82).toString(16).padStart(2,'0')).join('');
  engine.model.setMeshMaterial();
  engine.model.updateMeshVisibility();
  engine.model.updateEdgeVisibility();
  engine.threeView.requestRender();
  engine.threeView.modelWrapper.traverse(obj=>{if(obj.isLineSegments&&obj.material?.color)obj.material.color.set(theme.muted)});
}
for(const t of studioThemes){const b=document.createElement('button');b.className='theme-swatch';b.dataset.theme=t.id;b.dataset.tip=t.name+' theme';b.title=t.name+' theme';b.setAttribute('aria-label',t.name+' theme');b.style.background=t.bg;b.style.color=t.ink;b.innerHTML='<span aria-hidden="true">Aa</span>';b.onclick=()=>{appearance.theme=t.id;renderAppearance()};document.querySelector('#themes').append(b)}
for(const [name,hex] of paperSwatches){const b=document.createElement('button');b.className='paper-swatch';b.dataset.paper=name;b.dataset.tip=name;b.title=name;b.setAttribute('aria-label',name+' paper');b.style.setProperty('--swatch','#'+hex);b.onclick=()=>{appearance.paper=name;renderAppearance()};document.querySelector('#paperColors').append(b)}
renderAppearance();

// Recolor the neutral render while preserving its shading and transparent alpha.
// Invert/reapply the engine's Reinhard tone map and gamma-2 output per channel.
function updatePreviewColor(){
  const hex=paperSwatches.find(p=>p[0]===appearance.paper)[1];
  const pigment=hex.match(/../g).map(h=>parseInt(h,16)/255),neutral=[1,1,240/255];
  ['R','G','B'].forEach((channel,k)=>{
    const values=Array.from({length:256},(_,i)=>{
      const linear=Math.pow(i/255,2);
      if(linear===1)return pigment[k]===0?'0':'1';
      const radiance=linear/(1-linear)*pigment[k]/neutral[k];
      return Math.sqrt(radiance/(1+radiance)).toFixed(6);
    });
    document.getElementById('paperTint'+channel).setAttribute('tableValues',values.join(' '));
  });
  const caption=document.getElementById('finishedCaption');
  caption.textContent=caption.dataset.custom==='true'?'Imported form · '+appearance.paper:'Folded reference · '+appearance.paper+' · 100% target';
}
