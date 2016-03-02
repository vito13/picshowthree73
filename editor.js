var containerMain, containerCam, stats;
var camera, scene, renderer, rendererCam;
var splineHelperObjects = [],
    splineOutline;
var splinePointsLength = 4;
var positions = [];
var options;


init();
animate();
function init() {
    scene = new THREE.Scene();

    // editor渲染器
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setClearColor( 0xf0f0f0 );
    renderer.setSize( editorData.viewSize.mainWidth, editorData.viewSize.mainHeigth );
    renderer.shadowMap.enabled = true;

    // 预览渲染器
    rendererCam = new THREE.WebGLRenderer( { antialias: true } );
    rendererCam.setClearColor( 0xf0f0f0 );
    rendererCam.setSize( editorData.viewSize.camWidth, editorData.viewSize.camHeigth);
    rendererCam.shadowMap.enabled = true;

    // edit div
    containerMain = document.getElementById('webgl');
    containerMain.appendChild( renderer.domElement );
    // 预览div
    containerCam = document.getElementById('camera');
    containerCam.appendChild( rendererCam.domElement );

    // 主摄像机
    camera = new THREE.PerspectiveCamera( 70, editorData.viewSize.mainWidth / editorData.viewSize.mainHeigth, 1, 10000 );
    camera.position.z = 1000;
    scene.add( camera );

    // 灯光
    scene.add( new THREE.AmbientLight( 0xf0f0f0 ) );
    var light = new THREE.SpotLight( 0xffffff, 1.5 );
    light.position.set( 0, 1500, 200 );
    light.castShadow = true;
    light.shadowCameraNear = 200;
    light.shadowCameraFar = camera.far;
    light.shadowCameraFov = 70;
    light.shadowBias = -0.000222;
    light.shadowDarkness = 0.25;
    light.shadowMapWidth = 1024;
    light.shadowMapHeight = 1024;
    scene.add( light );

    // 地板,有阴影
    var planeGeometry = new THREE.PlaneGeometry( 2000, 2000 );
    planeGeometry.rotateX( - Math.PI / 2 );
    var planeMaterial = new THREE.MeshBasicMaterial( { color: 0xeeeeee } );
    var plane = new THREE.Mesh( planeGeometry, planeMaterial );
    plane.position.y = -200;
    plane.receiveShadow = true;
    scene.add( plane );

    // 表格,与地板y位置很近
    var helper = new THREE.GridHelper( 1000, 100 );
    helper.position.y = - 199;
    helper.material.opacity = 0.25;
    helper.material.transparent = true;
    scene.add( helper );

    // 坐标轴
    var axis = new THREE.AxisHelper(200);
    axis.position.set( 0, -200, 0 );
    scene.add( axis );

    // fps
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    containerMain.appendChild( stats.domElement );


    var plane = new THREE.PlaneGeometry( 1500, 1000, 2, 2 );
    var texture = new THREE.TextureLoader().load("pic/004.jpg");
    var material = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture } );
    var mesh = new THREE.Mesh( plane,material);
    mesh.position.z = -500;
    mesh.position.y = 300;
    scene.add(mesh);

    editorData.resetData(scene);

    // 变换控制器,用于操控轨迹点的回调处理
    transformControl = new THREE.TransformControls( camera, renderer.domElement );
    transformControl.addEventListener( 'change', render );
    transformControl.addEventListener( 'change', function( e ) {
        cancelHideTransorm();
    } );
    transformControl.addEventListener( 'mouseDown', function( e ) {
        cancelHideTransorm();
    } );
    transformControl.addEventListener( 'mouseUp', function( e ) {
        delayHideTransform();
    } );
    transformControl.addEventListener( 'objectChange', function( e ) {
        editorData.updateSplineOutline();
    } );
    scene.add( transformControl );
    window.addEventListener( 'keydown', function ( event ) {
        switch ( event.keyCode ) {
            case 81: // Q
                transformControl.setSpace( transformControl.space === "local" ? "world" : "local" );
                break;
            case 17: // Ctrl
                transformControl.setTranslationSnap( 100 );
                transformControl.setRotationSnap( THREE.Math.degToRad( 15 ) );
                break;
            case 87: // W
                transformControl.setMode( "translate" );
                break;
            case 69: // E
                transformControl.setMode( "rotate" );
                break;
            case 82: // R
                transformControl.setMode( "scale" );
                break;
            case 187:
            case 107: // +, =, num+
                transformControl.setSize( transformControl.size + 0.1 );
                break;
            case 189:
            case 109: // -, _, num-
                transformControl.setSize( Math.max( transformControl.size - 0.1, 0.1 ) );
                break;
        }
    });
    window.addEventListener( 'keyup', function ( event ) {
        switch ( event.keyCode ) {
            case 17: // Ctrl
                transformControl.setTranslationSnap( null );
                transformControl.setRotationSnap( null );
                break;
        }
    });


    // 貌似是用于拖拽轨迹点
    var dragcontrols = new THREE.DragControls( camera, editorData.controlPointArr, renderer.domElement ); //
    dragcontrols.on( 'hoveron', function( e ) {
        transformControl.attach( e.object );
        cancelHideTransorm(); // *
    } );
    dragcontrols.on( 'hoveroff', function( e ) {
        if ( e ) delayHideTransform();
    } );

    // 轨道控制器,用于控制摄像机
    controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.damping = 0.2;
    controls.addEventListener( 'change', render );
    controls.addEventListener( 'start', function() {
        cancelHideTransorm();
    } );
    controls.addEventListener( 'end', function() {
        delayHideTransform();
    } );

    var hiding;
    function delayHideTransform() {
        cancelHideTransorm();
        hideTransform();
    }
    function hideTransform() {
        hiding = setTimeout( function() {
            transformControl.detach( transformControl.object );
        }, 2500 )
    }
    function cancelHideTransorm() {
        if ( hiding ) clearTimeout( hiding );
    }


}

function animate(){
    requestAnimationFrame( animate );
    render();
    stats.update();
    controls.update();
    transformControl.update();
    TWEEN.update();
}

function render() {
    renderer.render(scene, camera);
}