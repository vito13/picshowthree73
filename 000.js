//var scene = new THREE.Scene();
//var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
//
//var renderer = new THREE.WebGLRenderer();
//renderer.setSize( window.innerWidth, window.innerHeight );
//document.body.appendChild( renderer.domElement );
//
//var geometry = new THREE.BoxGeometry( 1, 1, 1 );
//var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
//var cube = new THREE.Mesh( geometry, material );
//scene.add( cube );
//
//camera.position.z = 5;
//
//var render = function () {
//    requestAnimationFrame( render );
//
//    cube.rotation.x += 0.1;
//    cube.rotation.y += 0.1;
//
//    renderer.render(scene, camera);
//};
//
//render();


// standard global variables
var container, scene, camera, renderer, controls, stats;
var keyboard = new KeyboardState();
var clock = new THREE.Clock();

// custom global variables
var meshPhoto, meshTextTitle, meshTextDetail;
var meshRed, mashWrite;

init();
animate();

// FUNCTIONS
function init()
{
    // SCENE
    scene = new THREE.Scene();
    // CAMERA
    var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
    var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
    camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
    scene.add(camera);
    camera.position.set(0,150,400);
    camera.lookAt(scene.position);
    // RENDERER
    if ( Detector.webgl )
        renderer = new THREE.WebGLRenderer( {antialias:true} );
    else
        renderer = new THREE.CanvasRenderer();
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    container = document.getElementById( 'ThreeJS' );
    container.appendChild( renderer.domElement );
    // EVENTS
    THREEx.WindowResize(renderer, camera);
    THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });
    // CONTROLS
    controls = new THREE.OrbitControls( camera, renderer.domElement );
    // STATS
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.bottom = '0px';
    stats.domElement.style.zIndex = 100;
    container.appendChild( stats.domElement );
    // LIGHT
    var light = new THREE.PointLight(0xffffff);
    light.position.set(100,250,100);
    scene.add(light);
    // FLOOR
    var floorTexture = new THREE.ImageUtils.loadTexture( 'images/checkerboard.jpg' );
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set( 10, 10 );
    var floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture, side: THREE.DoubleSide } );
    var floorGeometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.5;
    floor.rotation.x = Math.PI / 2;
    scene.add(floor);
    // SKYBOX
    var skyBoxGeometry = new THREE.CubeGeometry( 10000, 10000, 10000 );
    var skyBoxMaterial = new THREE.MeshBasicMaterial( { color: 0x9999ff, side: THREE.BackSide } );
    var skyBox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial );
    scene.add(skyBox);

    ////////////
    // CUSTOM //
    ////////////






    var geo = new THREE.PlaneGeometry( 160, 10, 2, 2 );
    var mat = new THREE.MeshBasicMaterial( { color: 0x880000} );
    meshRed = new THREE.Mesh( geo, mat);
    meshRed.position.set(0,20,5);
    // meshRed.rotation.z = 2.5;
    // scene.add(meshRed);

    var geowrite = new THREE.PlaneGeometry( 160, 10, 2, 2 );
    var matwrite = new THREE.MeshBasicMaterial( { color: 0x888888} );
    meshWrite = new THREE.Mesh( geowrite, matwrite);
    meshWrite.position.set(10,20,10);
    //   meshWrite.rotation.z = 2.5;
    //   scene.add(meshWrite);


    AddPhoto();
    //AddTitle();
    //AddDetail();
}

function animate()
{
    requestAnimationFrame( animate );
    render();
    update();
}

function update()
{
    keyboard.update();
    var step = 100;
    var moveDistance = step * clock.getDelta();

    if ( keyboard.pressed("A") ){
        meshRed.translateX( -moveDistance );
        meshWrite.translateX( -moveDistance );
    }

    if ( keyboard.pressed("D") ) {
        meshRed.translateX(moveDistance);
        meshWrite.translateX(moveDistance);
    }


    //mesh2.rotation.z += 0.01;

    controls.update();
    stats.update();
}

function render()
{
    renderer.render( scene, camera );
}

function AddPhoto(){
    var geometry = new THREE.PlaneGeometry( 160, 100, 4, 4 );
    var moonTexture = THREE.ImageUtils.loadTexture( 'pic/004.jpg' );
    var material = new THREE.MeshLambertMaterial( { map: moonTexture } );
    var wireframeMaterial = new THREE.MeshBasicMaterial( { color: 0x000000, wireframe: true, transparent: true } );
    var multiMaterial = [ material, wireframeMaterial ];
    meshPhoto = THREE.SceneUtils.createMultiMaterialObject(
        geometry,
        multiMaterial );
    meshPhoto.position.set(0,100,0);
    scene.add(meshPhoto);
}

function AddTitle(){
    // create a canvas element
    var canvas1 = document.createElement('canvas');
    var context1 = canvas1.getContext('2d');
    context1.font = "Bold 20px Arial";
    context1.fillStyle = "rgba(255,0,0,0.95)";
    context1.fillText('这是标题', 0, 50);

    // canvas contents will be used for a texture
    var texture1 = new THREE.Texture(canvas1)
    texture1.needsUpdate = true;

    var material1 = new THREE.MeshBasicMaterial( {map: texture1, side:THREE.DoubleSide } );
    material1.transparent = true;

    meshTextTitle = new THREE.Mesh(
        new THREE.PlaneGeometry(canvas1.width, canvas1.height),
        material1
    );
    meshTextTitle.position.set(50,50,0);
    scene.add( meshTextTitle );
}

function AddDetail(){
    // create a canvas element

    var canvas1 = document.createElement('canvas');
    var context1 = canvas1.getContext('2d');
    context1.font = "Bold 12px Arial";
    context1.fillStyle = "rgba(255,0,0,0.95)";
    context1.fillText('这是细节,细节.细节,,,', 0, 50);

    // canvas contents will be used for a texture
    var texture1 = new THREE.Texture(canvas1)
    texture1.needsUpdate = true;

    var material1 = new THREE.MeshBasicMaterial( {map: texture1, side:THREE.DoubleSide } );
    material1.transparent = true;

    meshTextDetail = new THREE.Mesh(
        new THREE.PlaneGeometry(canvas1.width, canvas1.height),
        material1
    );
    meshTextDetail.position.set(50,10,0);
    scene.add( meshTextDetail );
}