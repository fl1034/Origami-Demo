from playwright.sync_api import sync_playwright
from pathlib import Path
root=Path('/workspace/Origami-Demo')
with sync_playwright() as p:
 b=p.chromium.launch(args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']);page=b.new_page(viewport={'width':1440,'height':1000});page.goto('http://127.0.0.1:8080/Origami-Demo/');page.wait_for_function('origami.getSnapshot().patternId')
 for pat in page.evaluate('origami.patterns'):
  page.evaluate('(id)=>origami.loadPattern(id)',pat['id']);page.locator('#fold').fill('100');page.locator('#fold').dispatch_event('input');page.wait_for_function('!origami.getSnapshot().running',timeout=30000)
  data=page.evaluate('origami.geometry()');assert len(data['vertices_coords'])>0
  print('FINITE 100%',pat['id'],len(data['vertices_coords']),flush=True)
  page.evaluate('''()=>{document.documentElement.style.setProperty('background','transparent','important');document.body.style.setProperty('background','transparent','important')}''')
  page.frames[1].evaluate('''()=>{document.documentElement.style.setProperty('background','transparent','important');document.body.style.setProperty('background','transparent','important');globals.threeView.scene.background=null;globals.threeView.renderer.setClearColor(0x000000,0)}''')
  rect=page.frames[1].evaluate('''()=>{const g=globals,T=THREE,r=g.threeView.renderer,c=g.threeView.camera;r.render(g.threeView.scene,c);const a=g.model.getPositionsArray(),mesh=g.model.getMesh()[0];let xs=[],ys=[];for(let i=0;i<a.length;i+=3){const v=new T.Vector3(a[i],a[i+1],a[i+2]);mesh.localToWorld(v);v.project(c);xs.push((v.x+1)*innerWidth/2);ys.push((1-v.y)*innerHeight/2)}const pad=22,x=Math.max(0,Math.min(...xs)-pad),y=Math.max(0,Math.min(...ys)-pad);return {x,y,width:Math.min(innerWidth,Math.max(...xs)+pad)-x,height:Math.min(innerHeight,Math.max(...ys)+pad)-y}}''')
  box=page.locator('iframe').bounding_box();rect['x']+=box['x'];rect['y']+=box['y'];assert rect['width']>0 and rect['height']>0
  page.screenshot(path=str(root/'docs/finished'/str(pat['id']+'.png')),clip=rect,omit_background=True);print('FRAMED',pat['id'],flush=True)
 b.close()
