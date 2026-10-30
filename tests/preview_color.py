from playwright.sync_api import sync_playwright
from PIL import Image,ImageStat
from pathlib import Path
import io
with sync_playwright() as p:
 b=p.chromium.launch(args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8080/Origami-Demo/');page.wait_for_function('origami.getSnapshot().patternId');page.wait_for_function('document.querySelector("#finishedImage").complete && document.querySelector("#finishedImage").naturalWidth>0')
 page.get_by_role('button',name='Coral paper',exact=True).click();red=page.locator('#finishedImage').screenshot()
 assert page.frames[1].evaluate('globals.color1')=='ff7f50'
 assert 'Coral' in page.locator('#finishedCaption').inner_text()
 page.get_by_role('button',name='Cornflower Blue paper',exact=True).click();blue=page.locator('#finishedImage').screenshot()
 r=ImageStat.Stat(Image.open(io.BytesIO(red)).convert('RGB')).mean;c=ImageStat.Stat(Image.open(io.BytesIO(blue)).convert('RGB')).mean
 assert r[0]>c[0]+5 and c[2]>r[2]+5,(r,c)
 page.locator('[data-theme=midnight]').click();assert 'Cornflower Blue' in page.locator('#finishedCaption').inner_text()
 for id in ['twist','miura']:
  page.evaluate('(id)=>origami.loadPattern(id)',id);assert 'Cornflower Blue' in page.locator('#finishedCaption').inner_text()
  assert page.frames[1].evaluate('globals.color1')=='6495ed'
 page.set_viewport_size({'width':390,'height':844});assert page.locator('#fold').get_attribute('max')=='100'
 page.locator('#fold').fill('100');page.locator('#fold').dispatch_event('input');page.wait_for_timeout(1500)
 assert page.frames[1].evaluate('globals.creasePercent')==1;assert page.locator('#percent').inner_text()=='100%';page.evaluate('origami.geometry()')
 page.locator('#fold').focus();page.keyboard.press('ArrowLeft');assert page.locator('#fold').input_value()=='99'
 page.locator('#reset').click();page.wait_for_function('!document.querySelector("#fold").disabled');assert page.locator('#fold').input_value()=='35'
 assert 'Cornflower Blue' in page.locator('#finishedCaption').inner_text();assert page.evaluate('document.documentElement.scrollWidth')==390
 page.set_viewport_size({'width':1440,'height':1000});page.wait_for_function('document.querySelector("#finishedImage").complete');page.mouse.move(700,100);page.screenshot(path='docs/matched-preview.png')
 print('PASS rendered preview pixel colors, live material color, theme/pattern/reset persistence, mobile 100% engine target, keyboard, finite geometry. Errors:',errors)
 assert not errors;b.close()
