from playwright.sync_api import sync_playwright
import json
with sync_playwright() as p:
 b=p.chromium.launch(args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8080/Origami-Demo/');page.wait_for_function('origami.getSnapshot().patternId === "miura"',timeout=60000)
 for id in ['miura','twist','waterbomb']:
  if id!='miura':page.evaluate('(id)=>origami.loadPattern(id)',id)
  page.wait_for_timeout(1500)
  a=page.evaluate('origami.geometry().vertices_coords')
  page.locator('#fold').fill('65');page.locator('#fold').dispatch_event('input');page.wait_for_timeout(2500)
  d=page.evaluate('origami.geometry()');assert a!=d['vertices_coords'];assert len(d['faces_vertices'])>0
  page.locator('[data-view=creases]').click();page.locator('[data-view=surface]').click()
  with page.expect_download() as shot:page.locator('#capture').click()
  assert open(shot.value.path(),'rb').read(8)==b'\x89PNG\r\n\x1a\n'
  page.locator('#play').click()
  page.locator("details").evaluate("e=>e.open=true")
  for sel in ['#foldExport','#meshExport']:
   with page.expect_download() as dl:page.locator(sel).click()
   path=dl.value.path();text=open(path).read();assert 'NaN' not in text
   if sel=='#foldExport': exported=text
  page.locator('#reset').click();page.wait_for_function('(id)=>origami.getSnapshot().patternId===id && document.querySelector("#fold").value==35',arg=id)
  print('PASS',id,len(d['vertices_coords']),flush=True)
 page.locator('#import').set_input_files({'name':'saved.fold','mimeType':'application/json','buffer':exported.encode()});page.wait_for_function('origami.getSnapshot().patternId==="custom"');print('PASS reimport',flush=True)
 page.locator('#import').set_input_files({'name':'bad.fold','mimeType':'application/json','buffer':b'{}'});page.wait_for_function('document.querySelector("#status").textContent.includes("Use a FOLD")')
 page.evaluate('origami.loadPattern("miura")');page.wait_for_timeout(1500);page.screenshot(path='/workspace/Origami-Demo/docs/desktop.png')
 page.set_viewport_size({'width':390,'height':844});page.screenshot(path='/workspace/Origami-Demo/docs/mobile.png',full_page=True);assert page.evaluate('document.documentElement.scrollWidth')==390
 print('ERRORS',errors);b.close()
