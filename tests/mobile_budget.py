from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=b.new_page(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,device_scale_factor=3)
 page.goto('http://127.0.0.1:8080/Origami-Demo/');page.wait_for_function('origami.getSnapshot().patternId && !document.querySelector("#fold").disabled',timeout=30000)
 f=page.frames[1];assert f.evaluate('globals.threeView.renderer.getPixelRatio()')==1;assert not f.evaluate('globals.threeView.renderer.shadowMap.enabled')
 page.wait_for_timeout(200);f.evaluate('''()=>{window.renderCount=0;const r=globals.threeView.renderer,render=r.render.bind(r);r.render=(...args)=>{renderCount++;return render(...args)}}''')
 page.wait_for_timeout(600);assert f.evaluate('renderCount')==0
 page.get_by_role('button',name='Coral paper',exact=True).click();page.wait_for_timeout(100);assert f.evaluate('renderCount')>0
 page.locator('#fold').fill('100');page.locator('#fold').dispatch_event('input');page.wait_for_function('!origami.getSnapshot().running',timeout=30000)
 n=f.evaluate('renderCount');page.wait_for_timeout(600);assert f.evaluate('renderCount')==n
 page.locator('#camera').click();page.wait_for_timeout(150);assert f.evaluate('renderCount')>n
 print('PASS phone pixel ratio 1, shadows disabled, zero idle draws, color/camera redraw, bounded folding')
 unsupported=b.new_page();unsupported.add_init_script('''if(window!==window.top){const get=WebGLRenderingContext.prototype.getExtension;WebGLRenderingContext.prototype.getExtension=function(name){return name==='OES_texture_float'?null:get.call(this,name)}}''')
 unsupported.goto('http://127.0.0.1:8080/Origami-Demo/');unsupported.wait_for_function('document.querySelector("#status").textContent.includes("floating-point")',timeout=15000)
 assert unsupported.locator('iframe').count()==0
 print('PASS unsupported GPU reports a clear error and disposes failed frame');b.close()
