from playwright.sync_api import sync_playwright
import json
with sync_playwright() as p:
 b=p.chromium.launch(args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--max-active-webgl-contexts=4']);page=b.new_page(viewport={'width':390,'height':844});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:8080/Origami-Demo/');page.wait_for_function('origami.getSnapshot().patternId',timeout=60000)
 results=[]
 for pat in page.evaluate('origami.patterns'):
  page.evaluate('(id)=>origami.loadPattern(id)',pat['id']);s=page.evaluate('origami.getSnapshot()');assert s['patternId']==pat['id'] and not s['running'],s
  a=page.evaluate('origami.geometry().vertices_coords');page.wait_for_timeout(100);assert a==page.evaluate('origami.geometry().vertices_coords')
  assert page.frames[1].evaluate('''()=>{const g=globals,a=g.model.getPositionsArray(),T=THREE,m=g.model.getMesh()[0],c=g.threeView.camera;let visible=0;for(let i=0;i<a.length;i+=3){let v=new T.Vector3(a[i],a[i+1],a[i+2]);m.localToWorld(v);v.project(c);if(Math.abs(v.x)<1&&Math.abs(v.y)<1&&v.z<1)visible++}return visible/(a.length/3)>.95}''')
  assert page.locator('iframe').count()==1;results.append({'id':pat['id'],'held':True,'visible':True,'vertices':len(a)});print('READY',pat['id'],flush=True)
 open('docs/readiness-results.json','w').write(json.dumps({'patterns':results,'errors':errors},indent=2));assert not errors;b.close()
