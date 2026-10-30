from playwright.sync_api import sync_playwright
import json
with sync_playwright() as p:
 b=p.chromium.launch(args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--max-active-webgl-contexts=4'])
 page=b.new_page(viewport={'width':390,'height':844},has_touch=True,is_mobile=True);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8080/Origami-Demo/');page.wait_for_function('origami.getSnapshot().patternId',timeout=60000)
 for id in ['waterbomb','miura','waterbomb','miura','sharp-miura','boxes','waterbomb','miura']:
  page.locator('nav [data-id='+id+']').tap();page.wait_for_function('(id)=>origami.getSnapshot().patternId===id && !document.querySelector("#fold").disabled',arg=id,timeout=60000)
  assert not page.evaluate('origami.getSnapshot().running')
  a=page.evaluate('origami.geometry().vertices_coords');page.wait_for_timeout(250);assert a==page.evaluate('origami.geometry().vertices_coords')
  assert page.frames[1].evaluate('''()=>{const g=globals,a=g.model.getPositionsArray(),T=THREE,m=g.model.getMesh()[0],c=g.threeView.camera;let visible=0;for(let i=0;i<a.length;i+=3){let v=new T.Vector3(a[i],a[i+1],a[i+2]);m.localToWorld(v);v.project(c);if(Math.abs(v.x)<1&&Math.abs(v.y)<1&&v.z<1)visible++}return visible/(a.length/3)>.95}''')
  print('VISIBLE AND STILL',id,flush=True)
 # Freeze the previous paper while the next asset is delayed.
 pending=[];page.route('**/assets/Tessellations/huffmanWaterbomb.svg',lambda route:pending.append(route))
 page.evaluate('window.previousEngine=document.querySelector("iframe").contentWindow.globals; void origami.loadPattern("waterbomb")')
 page.wait_for_function('document.querySelectorAll("iframe").length===2');a=page.evaluate('origami.geometry().vertices_coords');page.wait_for_timeout(400);assert a==page.evaluate('origami.geometry().vertices_coords');assert not page.evaluate('previousEngine.simulationRunning')
 assert pending;pending.pop().continue_();page.wait_for_function('origami.getSnapshot().patternId==="waterbomb" && !document.querySelector("#fold").disabled',timeout=60000)
 assert page.evaluate('previousEngine.gpuMath.isContextLost() && previousEngine.threeView.renderer.getContext().isContextLost()')
 page.unroute('**/assets/Tessellations/huffmanWaterbomb.svg');print('PASS old frame frozen and both contexts released',flush=True)
 # Fail a staged load: current paper must survive.
 pending=[];page.route('**/assets/Tessellations/miura-ori.svg',lambda route:pending.append(route))
 page.evaluate('void origami.loadPattern("miura")');page.wait_for_function('Array.from(document.querySelectorAll("iframe")).some(f=>f.style.visibility==="hidden" && f.contentWindow.globals?.threeView)')
 page.evaluate('Array.from(document.querySelectorAll("iframe")).find(f=>f.style.visibility==="hidden").contentWindow.globals.threeView.renderer.forceContextLoss()')
 page.wait_for_function('!document.querySelector("#fold").disabled');assert page.evaluate('origami.getSnapshot().patternId')=='waterbomb';assert page.locator('iframe').count()==1;page.evaluate('origami.geometry()')
 for route in pending:
  try:route.abort()
  except Exception:pass
 pending.clear()
 page.unroute('**/assets/Tessellations/miura-ori.svg');print('PASS failed load preserves previous model',flush=True)
 page.evaluate('Promise.all(Array.from({length:16},(_,i)=>origami.loadPattern(i%2?"waterbomb":"miura")))');assert page.evaluate('origami.getSnapshot().patternId')=='waterbomb';assert page.locator('iframe').count()==1
 print('PASS rapid cancellation',flush=True)
 for target in ['100','5']:
  page.locator('#fold').fill(target);page.locator('#fold').dispatch_event('input');page.wait_for_function('!origami.getSnapshot().running',timeout=30000)
  assert page.locator('#fold').input_value()==target
  assert abs(page.frames[1].evaluate('globals.creasePercent')-int(target)/100)<1e-6
  a=page.evaluate('origami.geometry().vertices_coords');page.wait_for_timeout(400);assert a==page.evaluate('origami.geometry().vertices_coords')
 print('PASS bounded target changes and exact idle geometry',flush=True)
 page.frames[1].evaluate('globals.model.getPositionsArray()[0]=1e6');page.locator('#play').click();page.wait_for_function('!origami.getSnapshot().running');assert page.locator('#fold').input_value()=='5';assert page.evaluate('origami.geometry().vertices_coords')==a;assert 'Kept the last stable shape' in page.locator('#status').inner_text()
 print('PASS finite runaway detection and recovery',flush=True)
 page.locator('#reset').click();page.wait_for_function('!document.querySelector("#fold").disabled');assert page.locator('#fold').input_value()=='35';assert not page.evaluate('origami.getSnapshot().running')
 print('ERRORS',errors);assert not errors;b.close()
