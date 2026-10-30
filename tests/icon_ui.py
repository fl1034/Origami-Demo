from playwright.sync_api import sync_playwright
import json
root='/workspace/Origami-Demo/'
with sync_playwright() as p:
 b=p.chromium.launch(args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:8080/Origami-Demo/');page.wait_for_function('origami.getSnapshot().patternId')
 assert page.locator('#patterns button').count()==25;assert page.locator('[data-view=strain]').count()==0
 page.locator('#search').fill('crane');assert page.locator('#patterns button').count()==2;page.locator('#search').fill('')
 page.locator('#camera').focus();assert page.locator('#control-tooltip').inner_text()=='Reset camera';page.keyboard.press('Enter');page.keyboard.press('Escape')
 page.locator('[data-view=creases]').click();assert page.frames[1].evaluate('globals.meshVisible===false && globals.edgesVisible===true')
 page.locator('[data-view=surface]').click();assert page.frames[1].evaluate('globals.meshVisible && !globals.edgesVisible')
 page.locator('#play').click();assert page.locator('#play').get_attribute('aria-label')=='Resume simulation';page.locator('#play').click()
 with page.expect_download() as shot:page.locator('#capture').click()
 assert open(shot.value.path(),'rb').read(8)==b'\x89PNG\r\n\x1a\n'
 page.locator('summary').click()
 for s in ['#foldExport','#meshExport']:
  with page.expect_download() as d:page.locator(s).click()
  text=open(d.value.path()).read();assert 'NaN' not in text
 page.evaluate('Promise.all([origami.loadPattern("twist"),origami.loadPattern("waterbomb"),origami.loadPattern("miura")])');assert page.locator('iframe').count()==1
 page.locator('#reset').click();page.wait_for_function('!document.querySelector("#fold").disabled');assert page.locator('#fold').input_value()=='35'
 page.wait_for_timeout(1000);page.mouse.move(900,100);page.screenshot(path=root+'docs/revised-desktop.png')
 page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(300);assert page.evaluate('document.documentElement.scrollWidth')==390
 page.locator('#camera').click();page.locator('#fold').fill('55');page.locator('#fold').dispatch_event('input');page.screenshot(path=root+'docs/revised-mobile.png',full_page=True)
 print('PASS search, icon tooltips/labels, keyboard, views, pause, snapshot, both exports, rapid switching, reset, mobile. Errors:',errors);b.close()
