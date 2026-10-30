from playwright.sync_api import sync_playwright
import json
from pathlib import Path
root=Path('/workspace/Origami-Demo')
with sync_playwright() as p:
 b=p.chromium.launch(args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8080/Origami-Demo/');page.wait_for_function('origami.getSnapshot().patternId')
 assert page.locator('.challenge,#captures').count()==0
 assert page.locator('#views button').count()==3
 assert page.locator('input[type=color]').count()==0
 assert page.locator('#themes button').count()==5
 assert page.locator('#paperColors button').count()==48
 for name,hex in page.evaluate('paperSwatches'):
  assert page.evaluate('([name,hex])=>{const c=document.createElement("canvas").getContext("2d");c.fillStyle=name.replaceAll(" ","");return c.fillStyle.toLowerCase()==="#"+hex}',[name,hex]),name
 for t in page.evaluate('studioThemes'):
  page.locator('[data-theme='+t['id']+']').click()
  assert page.frames[1].evaluate('globals.threeView.scene.background.getHexString()')==t['bg'][1:]
  rgb=tuple(int(t['panel'][i:i+2],16) for i in (1,3,5))
  assert page.locator('.notes').evaluate('e=>getComputedStyle(e).backgroundColor')=='rgb(%d, %d, %d)'%rgb
  assert page.evaluate('origami.getSnapshot().paperColor')=='Ivory'
  assert page.evaluate('getComputedStyle(document.body).color')!=page.evaluate('getComputedStyle(document.body).backgroundColor')
 for name in ['Coral','Rebecca Purple','Sea Green','Black','Ivory']:
  page.get_by_role('button',name=name+' paper',exact=True).click()
  assert page.evaluate('origami.getSnapshot().theme')=='midnight'
  hex=page.evaluate('(name)=>paperSwatches.find(p=>p[0]===name)[1]',name)
  assert page.frames[1].evaluate('globals.color1')==hex
 page.locator('[data-view=creases]').click();page.get_by_role('button',name='Cornflower Blue paper',exact=True).click()
 assert page.frames[1].evaluate('globals.model.getMesh().every(m=>!m.visible)')
 page.locator('[data-theme=sage]').click();assert page.frames[1].evaluate('globals.model.getMesh().every(m=>!m.visible)')
 page.locator('[data-view=surface]').click();page.evaluate('origami.loadPattern("twist")')
 assert page.frames[1].evaluate('globals.color1')=='6495ed'
 assert page.frames[1].evaluate('globals.threeView.scene.background.getHexString()')=='edf2e8'
 page.wait_for_function('document.querySelector("#finishedImage").complete && document.querySelector("#finishedImage").naturalWidth>0')
 assert page.locator('#finishedImage').get_attribute('src').split('?')[0].endswith('twist.png')
 page.reload();page.wait_for_function('origami.getSnapshot().patternId')
 assert page.evaluate('origami.getSnapshot().theme')=='sage'
 assert page.frames[1].evaluate('globals.color1')=='6495ed'
 with page.expect_download() as dl:page.locator('#capture').click()
 data=Path(dl.value.path()).read_bytes();assert data[:8]==b'\x89PNG\r\n\x1a\n' and len(data)>5000
 page.wait_for_function('document.querySelector("#finishedImage").complete && document.querySelector("#finishedImage").naturalWidth>0')
 page.locator('[data-theme=midnight]').click();page.mouse.move(700,100);page.screenshot(path=str(root/'docs/theme-midnight.png'))
 page.locator('[data-theme=linen]').click();page.get_by_role('button',name='Ivory paper',exact=True).click();page.mouse.move(700,100);page.screenshot(path=str(root/'docs/themes-desktop.png'))
 page.set_viewport_size({'width':390,'height':844});page.locator('[data-theme=rose]').click();page.get_by_role('button',name='Sea Green paper',exact=True).click()
 assert page.evaluate('document.documentElement.scrollWidth')==390
 page.locator('#capture').focus();assert page.locator('#control-tooltip').inner_text()=='Save screenshot (PNG)';page.keyboard.press('Escape')
 page.screenshot(path=str(root/'docs/themes-mobile.png'),full_page=True)
 print('PASS: five themes, 48 standard named swatches, independent engine/UI colors, persistence, view preservation, folded reference, PNG screenshot, keyboard tooltip, mobile layout. Errors:',errors)
 assert not errors;b.close()
