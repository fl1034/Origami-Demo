from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=b.new_page(viewport={'width':390,'height':844})
 page.add_init_script('if(window!==window.top){window.requestAnimationFrame=()=>0;window.cancelAnimationFrame=()=>{}}')
 page.goto('http://127.0.0.1:8080/Origami-Demo/')
 page.wait_for_function('origami.getSnapshot().patternId==="miura"',timeout=30000)
 for id in ['waterbomb','miura']:
  page.evaluate('(id)=>origami.loadPattern(id)',id)
  assert page.evaluate('origami.getSnapshot().patternId')==id
  assert page.evaluate('origami.geometry().vertices_coords.length')>0
  assert not page.evaluate('origami.getSnapshot().running')
 print('PASS 1↔3 loads and prepares even with iframe animation frames disabled')
 b.close()
