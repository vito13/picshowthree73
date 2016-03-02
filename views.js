/**
 * Created by Administrator on 2016/3/1 0001.
 */


if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container, stats;

var views, scene, renderer;

var mesh, group1, group2, group3, light;

var mouseX = 0, mouseY = 0;
var mesh;
var windowWidth, windowHeight;
var views = [
    {
        left: 0,
        bottom: 0.4,
        width: 1,
        height: 0.6,
        background: new THREE.Color().setRGB( 0.5, 0.5, 0.7 ),
        eye: [ 0, 0, 180 ],
        up: [ 0, 1, 0 ],
        fov: 45,
        updateCamera: function ( camera, scene ) {
            //camera.position.x += mouseX * 0.05;
            //camera.position.x = Math.max( Math.min( camera.position.x, 2000 ), -2000 );
            camera.lookAt( scene.position );
        }
    },
    {
        left: 0,
        bottom: 0,
        width: 0.5,
        height: 0.4,
        background: new THREE.Color().setRGB( 0.7, 0.5, 0.5 ),
        eye: [ 0, 0, 90 ],
        up: [ 0, 0 , -1 ],
        fov: 45,
        updateCamera: function ( camera, scene  ) {
            //camera.position.x -= mouseX * 0.05;
            //camera.position.x = Math.max( Math.min( camera.position.x, 2000 ), -2000 );
            camera.lookAt( scene.position );
        }
    }

];
init();
animate();
function init() {
    scene = new THREE.Scene();
    container = document.getElementById( 'ThreeJS' );
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );

    for (var ii =  0; ii < views.length; ++ii ) {

        var view = views[ii];
        camera = new THREE.PerspectiveCamera( view.fov, window.innerWidth / window.innerHeight, 1, 10000 );
        camera.position.x = view.eye[ 0 ];
        camera.position.y = view.eye[ 1 ];
        camera.position.z = view.eye[ 2 ];
        camera.up.x = view.up[ 0 ];
        camera.up.y = view.up[ 1 ];
        camera.up.z = view.up[ 2 ];
        view.camera = camera;
    }

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    container.appendChild( stats.domElement );




    // LIGHT
    var light = new THREE.PointLight(0xffffff);
    light.position.set(0,250,0);
    scene.add(light);

    var darkMaterial = new THREE.MeshBasicMaterial( { color: 0xffffcc } );
    var wireframeMaterial = new THREE.MeshBasicMaterial( { color: 0x000000, wireframe: true, transparent: true } );
    var multiMaterial = [ darkMaterial, wireframeMaterial ];


    var shape = THREE.SceneUtils.createMultiMaterialObject(
        new THREE.CubeGeometry(50, 50, 50, 1, 1, 1),
        multiMaterial );
    shape.position.set(0, 0, 0);
    scene.add( shape );
    mesh = shape;

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    container.appendChild( stats.domElement );

}

function updateSize() {

    if ( windowWidth != window.innerWidth || windowHeight != window.innerHeight ) {

        windowWidth  = window.innerWidth;
        windowHeight = window.innerHeight;

        renderer.setSize ( windowWidth, windowHeight );

    }

}

function animate() {

    render();
    stats.update();

    requestAnimationFrame( animate );
}

function render() {

    updateSize();

    mesh.rotation.x += 0.01;
    for ( var ii = 0; ii < views.length; ++ii ) {

        view = views[ii];
        camera = view.camera;

        //view.updateCamera( camera, scene );

        var left   = Math.floor( windowWidth  * view.left );
        var bottom = Math.floor( windowHeight * view.bottom );
        var width  = Math.floor( windowWidth  * view.width );
        var height = Math.floor( windowHeight * view.height );
        renderer.setViewport( left, bottom, width, height );
        renderer.setScissor( left, bottom, width, height );
        renderer.enableScissorTest ( true );
        renderer.setClearColor( view.background );

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.render( scene, camera );
    }

}