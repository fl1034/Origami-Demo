from playwright.sync_api import sync_playwright
import json,math,time
root='/workspace/Origami-Demo/'
with sync_playwright() as p:
 b=p.chromium.launch(args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:8080/Origami-Demo/')
 page.wait_for_function('origami.getSnapshot().patternId',timeout=60000)
 results=[]
 for pat in page.evaluate('origami.patterns'):
  try:
   page.evaluate('(id)=>origami.loadPattern(id)',pat['id']);assert page.evaluate('origami.getSnapshot().patternId')==pat['id']
   page.wait_for_timeout(700);a=page.evaluate('origami.geometry().vertices_coords')
   page.locator('#fold').fill('100');page.locator('#fold').dispatch_event('input');page.wait_for_timeout(1000);d=page.evaluate('origami.geometry()')
   assert all(math.isfinite(c) for v in d['vertices_coords'] for c in v)
   assert max(abs(x-y) for v,w in zip(a,d['vertices_coords']) for x,y in zip(v,w))>1e-5
   assert all(0<=i<len(d['vertices_coords']) for f in d['faces_vertices'] for i in f)
   page.locator('#fold').fill('45');page.locator('#fold').dispatch_event('input');page.wait_for_timeout(500)
   page.locator('iframe').screenshot(path=root+'docs/thumbs/'+pat['id']+'.png')
   results.append({'id':pat['id'],'vertices':len(d['vertices_coords']),'passed':True})
   print('PASS',pat['id'],len(d['vertices_coords']),flush=True)
  except Exception as e:
   results.append({'id':pat['id'],'passed':False,'error':str(e)});print('FAIL',pat['id'],str(e),flush=True)
 open(root+'docs/collection-results.json','w').write(json.dumps({'patterns':results,'errors':errors},indent=2))
 page.reload();page.wait_for_function('origami.getSnapshot().patternId');page.wait_for_timeout(1500);page.screenshot(path=root+'docs/revised-desktop.png')
 page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(400);page.screenshot(path=root+'docs/revised-mobile.png',full_page=True);assert page.evaluate('document.documentElement.scrollWidth')==390
 print('ERRORS',errors,flush=True);b.close()
