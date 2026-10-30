from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']);page=b.new_page(viewport={'width':1440,'height':1000},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:8080/Origami-Demo/');page.wait_for_function('origami.getSnapshot().patternId');assert not page.evaluate('origami.getSnapshot().running')
 for id in ['miura','twist','waterbomb']:
  page.evaluate('(id)=>origami.loadPattern(id)',id);page.locator('#play').click();page.wait_for_timeout(1500);page.locator('iframe').screenshot(path='/workspace/Origami-Demo/docs/'+id+'.png')
 page.evaluate('Promise.all([origami.loadPattern("twist"),origami.loadPattern("miura"),origami.loadPattern("waterbomb")])');assert page.evaluate('origami.getSnapshot().patternId')=='waterbomb';assert page.locator('iframe').count()==1
 for bad in [{},{'vertices_coords':[[float('inf'),0]]}]:
  assert page.evaluate('(d)=>{try{origami.validate(d);return false}catch(e){return true}}',bad)
 page.locator('#import').set_input_files({'name':'big.fold','mimeType':'application/json','buffer':b' '*524289});assert '512' in page.locator('#status').inner_text()
 page.locator('#fold').focus();page.keyboard.press('ArrowRight');assert page.locator('#fold').input_value()=='36'
 page.screenshot(path='/workspace/Origami-Demo/docs/desktop.png');page.set_viewport_size({'width':390,'height':844});page.screenshot(path='/workspace/Origami-Demo/docs/mobile.png',full_page=True);assert page.evaluate('document.documentElement.scrollWidth')==390
 print('PASS reduced motion, rapid switching, one live iframe, invalid/oversized input, keyboard, subpath, mobile; errors:',errors);b.close()
