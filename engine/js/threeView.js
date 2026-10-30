/**
 * Created by ghassaei on 9/16/16.
 */

function initThreeView(globals) {

    var scene = new THREE.Scene();
    var modelWrapper = new THREE.Object3D();

    var camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 500);
    // var camera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, -10000, 10000);//-40, 40);
    var lowPower = matchMedia('(pointer: coarse)').matches || (navigator.deviceMemory && navigator.deviceMemory <= 4);
    var renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
    // var svgRenderer = new THREE.SVGRenderer();
    var controls;
    var animationId = null, disposed = false, renderRequested = true;

    init();

    function init() {

        var container = $("#threeContainer");
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPower ? 1 : 2));
        renderer.shadowMap.enabled = !lowPower;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.gammaOutput = true;
        renderer.toneMapping = THREE.ReinhardToneMapping;
        renderer.toneMappingExposure = 1.15;
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.append(renderer.domElement);

        scene.background = new THREE.Color(0xffffff);//new THREE.Color(0xe6e6e6);
        setBackgroundColor();
        scene.add(modelWrapper);
        // A broad warm key and cool skylight give folded paper readable depth.
        var key = new THREE.DirectionalLight(0xfff2dc, 1.25);
        key.position.set(-3, 7, 5);
        key.castShadow = true;
        key.shadow.mapSize.set(2048,2048);
        key.shadow.camera.left = key.shadow.camera.bottom = -1.8;
        key.shadow.camera.right = key.shadow.camera.top = 1.8;
        key.shadow.camera.near = 0.1; key.shadow.camera.far = 20;
        key.shadow.bias = -0.0003;
        key.shadow.radius = 3;
        scene.add(key);
        scene.add(new THREE.HemisphereLight(0xe8efff, 0xb8a78a, 0.8));
        var fill = new THREE.DirectionalLight(0xffffff, 0.25);
        fill.position.set(4,2,-4); scene.add(fill);

        scene.add(camera);

        resetCamera();

        controls = new THREE.TrackballControls(camera, renderer.domElement);
        controls.rotateSpeed = 4.0;
        controls.zoomSpeed = 15;
        controls.noPan = true;
        controls.staticMoving = true;
        controls.dynamicDampingFactor = 0.3;
        controls.minDistance = 1;
	    controls.maxDistance = 30;
        controls.addEventListener("change", requestRender);

        _render();//render before model loads

    }

    function resetCamera(){
        camera.zoom = 7*Math.min(1,window.innerWidth/window.innerHeight/1.5);
        camera.updateProjectionMatrix();
        camera.position.x = 5;
        camera.position.y = 5;
        camera.position.z = 5;
        if (controls) setCameraIso();
    }

    function setCameraX(sign){
        controls.reset(new THREE.Vector3(sign,0,0));
    }
    function setCameraY(sign){
        controls.reset(new THREE.Vector3(0,sign,0));
    }
    function setCameraZ(sign){
        controls.reset(new THREE.Vector3(0,0,sign));
    }
    function setCameraIso(){
        controls.reset(new THREE.Vector3(1,1,1));
    }

    function startAnimation(){
        console.log("starting animation");
        if (animationId !== null || disposed) return;
        function tick() {
            if (disposed) return;
            try { _loop(); } catch (error) {
                globals.simulationRunning = false;
                if (globals.onSimulationError) globals.onSimulationError(error);
                else { window.origamiEngineError = error.message || String(error); console.error(error); }
            }
            if (!disposed) animationId = requestAnimationFrame(tick);
        }
        animationId = requestAnimationFrame(tick);
    }

    function pauseSimulation(){
        globals.simulationRunning = false;
        console.log("pausing simulation");
    }

    function startSimulation(){
        console.log("starting simulation");
        globals.simulationRunning = true;
    }

    var captureStats = $("#stopRecord>span");
    function requestRender(){ renderRequested = true; }

    function _render(){
        renderRequested = false;
        if (globals.vrEnabled){
            globals.vive.render();
            return;
        }
        renderer.render(scene, camera);
        if (globals.capturer) {
            if (globals.capturer == "png"){
                var canvas = globals.threeView.renderer.domElement;
                canvas.toBlob(function(blob) {
                    saveAs(blob, globals.screenRecordFilename + ".png");
                }, "image/png");
                globals.capturer = null;
                globals.shouldScaleCanvas = false;
                globals.shouldAnimateFoldPercent = false;
                globals.threeView.onWindowResize();
                return;
            }
            captureStats.html("( " + ++globals.capturerFrames + " frames  at " + globals.currentFPS  + "fps )");
            globals.capturer.capture(renderer.domElement);
        }
    }

    function _loop(){
        if (globals.rotateModel !== null){
            requestRender();
            if (globals.rotateModel == "x") modelWrapper.rotateX(globals.rotationSpeed);
            if (globals.rotateModel == "y") modelWrapper.rotateY(globals.rotationSpeed);
            if (globals.rotateModel == "z") modelWrapper.rotateZ(globals.rotationSpeed);
        }
        if (globals.needsSync){
            globals.model.sync();
            requestRender();
        }
        if (globals.simNeedsSync){
            globals.model.syncSolver();
        }
        if (globals.beforeModelStep) globals.beforeModelStep();
        if (globals.simulationRunning) {
            globals.model.step();
            requestRender();
            if (globals.afterModelStep) globals.afterModelStep();
        }
        if (globals.vrEnabled){
            _render();
            return;
        }
        if (controls.enabled) controls.update();
        if(renderRequested || globals.capturer) _render();
    }

    function sceneAddModel(object){
        modelWrapper.add(object);
        requestRender();
    }

    function onWindowResize() {

        if (globals.vrEnabled){
            globals.warn("Can't resize window when in VR mode.");
            return;
        }

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.zoom = 7*Math.min(1,camera.aspect/1.5);
        // camera.left = -window.innerWidth / 2;
        // camera.right = window.innerWidth / 2;
        // camera.top = window.innerHeight / 2;
        // camera.bottom = -window.innerHeight / 2;
        camera.updateProjectionMatrix();

        var scale = 1;
        if (globals.shouldScaleCanvas) scale = globals.capturerScale;
        renderer.setSize(scale*window.innerWidth, scale*window.innerHeight);
        controls.handleResize();
        requestRender();
    }

    function enableControls(state){
        controls.enabled = state;
        controls.enableRotate = state;
    }

    // function saveSVG(){
    //     // svgRenderer.setClearColor(0xffffff);
    //     svgRenderer.setSize(window.innerWidth,window.innerHeight);
    //     svgRenderer.sortElements = true;
    //     svgRenderer.sortObjects = true;
    //     svgRenderer.setQuality('high');
    //     svgRenderer.render(scene,camera);
    //     //get svg source.
    //     var serializer = new XMLSerializer();
    //     var source = serializer.serializeToString(svgRenderer.domElement);
    //
    //     //add name spaces.
    //     if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
    //         source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    //     }
    //     if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
    //         source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    //     }
    //
    //     //add xml declaration
    //     source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
    //
    //     var svgBlob = new Blob([source], {type:"image/svg+xml;charset=utf-8"});
    //     var svgUrl = URL.createObjectURL(svgBlob);
    //     var downloadLink = document.createElement("a");
    //     downloadLink.href = svgUrl;
    //     downloadLink.download =  globals.filename + " : " + parseInt(globals.creasePercent*100) +  "PercentFolded.svg";
    //     document.body.appendChild(downloadLink);
    //     downloadLink.click();
    //     document.body.removeChild(downloadLink);
    // }

    function resetModel(){
        modelWrapper.rotation.set(0,0,0);
    }

    function setBackgroundColor(color){
        if (color === undefined) color = globals.backgroundColor;
        scene.background.setStyle( "#" + color);
        requestRender();
    }

    function dispose() {
        disposed = true;
        if (animationId !== null) cancelAnimationFrame(animationId);
        globals.simulationRunning = false;
        if (controls && controls.dispose) controls.dispose();
        var freed = new Set();
        scene.traverse(function(object) {
            if (object.geometry && !freed.has(object.geometry)) { freed.add(object.geometry); object.geometry.dispose(); }
            var materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.forEach(function(material) {
                if (!material || freed.has(material)) return;
                freed.add(material);
                ['map','bumpMap'].forEach(function(key) { if(material[key] && !freed.has(material[key])) {freed.add(material[key]);material[key].dispose();} });
                material.dispose();
            });
        });
        renderer.dispose(); renderer.forceContextLoss();
    }
    return {
        dispose: dispose,
        requestRender: requestRender,
        sceneAddModel: sceneAddModel,
        onWindowResize: onWindowResize,

        startAnimation: startAnimation,
        startSimulation: startSimulation,
        pauseSimulation: pauseSimulation,

        enableControls: enableControls,//user interaction
        scene: scene,
        camera: camera,//needed for user interaction
        renderer: renderer,//needed for VR
        modelWrapper:modelWrapper,

        // saveSVG: saveSVG,//svg screenshot

        setCameraX:setCameraX,
        setCameraY: setCameraY,
        setCameraZ: setCameraZ,
        setCameraIso: setCameraIso,

        resetModel: resetModel,//reset model orientation
        resetCamera:resetCamera,
        setBackgroundColor: setBackgroundColor
    }
}