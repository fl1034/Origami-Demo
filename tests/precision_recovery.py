from playwright.sync_api import sync_playwright
import math
with sync_playwright() as p:
 b=p.chromium.launch(args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=b.new_page(viewport={'width':1440,'height':900},has_touch=True,is_mobile=False,device_scale_factor=3);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8080/Origami-Demo/');page.wait_for_function('origami.getSnapshot().patternId',timeout=30000)
 for id in ['miura','waterbomb','sharp-miura','boxes']:
  page.evaluate('(id)=>origami.loadPattern(id)',id)
  for target in ['80','20','100','35']:
   page.locator('#fold').fill(target);page.locator('#fold').dispatch_event('input');page.wait_for_function('!origami.getSnapshot().running',timeout=30000)
   assert page.locator('#fold').input_value()==target
   assert 'Could not reach' not in page.locator('#status').inner_text()
   assert all(math.isfinite(v) for xyz in page.evaluate('origami.geometry().vertices_coords') for v in xyz)
  print('PASS desktop-mode touch folding',id,flush=True)
 f=page.frames[1]
 # Round-trip diverse float32 values through the actual GPU byte encoder.
 result=f.evaluate('''()=>{const gpu=globals.gpuMath,values=new Float32Array([0,.1,-.1234567,8388608,1e-12,-1e-12,123.456,-9876.543,1,2,3,4,.3333333,.00013,-.0000027,65536]);gpu.initTextureFromData('probe',2,2,'FLOAT',values,true);gpu.initTextureFromData('probeBytes',8,2,'UNSIGNED_BYTE',null,true);gpu.initFrameBufferForTexture('probeBytes',true);gpu.setProgram('packToBytes');gpu.setUniformForProgram('packToBytes','u_vectorLength',4,'1f');gpu.setUniformForProgram('packToBytes','u_floatTextureDim',[2,2],'2f');gpu.setSize(8,2);gpu.step('packToBytes',['probe'],'probeBytes');const bytes=new Uint8Array(64);gpu.readPixels(0,0,8,2,bytes);return {expected:Array.from(values),actual:Array.from(new Float32Array(bytes.buffer)),highp:document.getElementById('packToBytesShader').text.includes('precision highp float'),sampler:document.getElementById('packToBytesShader').text.includes('precision highp sampler2D')}}''')
 assert result['highp'] and result['sampler']
 assert f.evaluate("document.getElementById('gpuMathCanvas')._origamiGL.getError()")==0
 for a,e in zip(result['actual'],result['expected']):assert abs(a-e)<=max(abs(e)*1e-6,1e-20),(a,e)
 print('PASS GPU float32 encoder round trip',flush=True)
 previous=page.evaluate('origami.geometry().vertices_coords');target=page.locator('#fold').input_value()
 f.evaluate('globals.model.getPositionsArray()[0]=1e6');page.locator('#play').click();page.wait_for_function('!origami.getSnapshot().running')
 assert page.locator('#fold').input_value()==target and target!='0'
 assert page.evaluate('origami.geometry().vertices_coords')==previous
 assert 'Kept the last stable shape' in page.locator('#status').inner_text()
 page.locator('#fold').fill('25');page.locator('#fold').dispatch_event('input');page.wait_for_function('!origami.getSnapshot().running',timeout=30000)
 assert 'Could not reach' not in page.locator('#status').inner_text();assert page.locator('#fold').input_value()=='25'
 print('PASS failure restores GPU/visible pose, preserves requested target, and permits subsequent folding',flush=True)
 print('ERRORS',errors);assert not errors;b.close()
