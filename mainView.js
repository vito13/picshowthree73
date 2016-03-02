/**
 * Created by Administrator on 2016/2/26 0026.
 */
var containerMain, containerCam, stats;
var camera, scene, renderer, rendererCam;
var splineHelperObjects = [],
    splineOutline;
var splinePointsLength = 4;
var positions = [];
var options;


var splineCamera;
var bPlay = false;
var splineindex = 0;
var num0 = 0;

var geometry = new THREE.BoxGeometry( 20, 20, 20 );

var ARC_SEGMENTS = 200;
var splineMesh;

var splines = {

};
var sceneData = {
    bRing: true,
    imgw: 200,
    imgh: 150,
    imgs: 7,
    distanceX: 20,
    distanceY: 20,
    materials: null,
    meshs: null
};

var viewSize = {
    mainWidth: 600,
    mainHeigth: 400,
    camWidth: 300,
    camHeigth: 200
};

init();
animate();
function init() {


    scene = new THREE.Scene();
    // 渲染器
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setClearColor( 0xf0f0f0 );
    renderer.setSize( viewSize.mainWidth, viewSize.mainHeigth );
    renderer.shadowMap.enabled = true;

    rendererCam = new THREE.WebGLRenderer( { antialias: true } );
    rendererCam.setClearColor( 0xf0f0f0 );
    rendererCam.setSize( viewSize.camWidth, viewSize.camHeigth);
    rendererCam.shadowMap.enabled = true;

    // div
    containerMain = document.getElementById('webgl');
    containerMain.appendChild( renderer.domElement );

    containerCam = document.getElementById('camera');
    containerCam.appendChild( rendererCam.domElement );

    // 主摄像机
    camera = new THREE.PerspectiveCamera( 70, viewSize.mainWidth / viewSize.mainHeigth, 1, 10000 );
    camera.position.z = 1000;
    scene.add( camera );
    // 轨道摄像机
    splineCamera = new THREE.PerspectiveCamera( 84, viewSize.camWidth / viewSize.camHeigth, 0.01, 1000 );
    scene.add( splineCamera );

    // 灯光z
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
    spotlight = light;

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




    // 页面上的ui
    var info = document.createElement( 'div' );
    info.style.position = 'absolute';
    info.style.top = '10px';
    info.style.width = '100%';
    info.style.textAlign = 'center';
    info.innerHTML = 'catmull-rom rom spline comparisions';
    options = document.createElement( 'div' );
    options.style.position = 'absolute';
    options.style.top = '30px';
    options.style.width = '100%';
    options.style.textAlign = 'center';

    options.innerHTML = 'Points: <input type="button" onclick="addPoint();" value="+" />\
					<input type="button" onclick="removePoint();" value="-" />\
					<input type="button" onclick="exportSpline();" value="Export" /><br />\
					<input type="checkbox" id="uniform" checked /> <label for="uniform">Uniform Catmull-rom</label>  <input type="range" id="tension" onchange="splines.uniform.tension = tension.value;updateSplineOutline();" min=0 max=1 step=0.01 value=0.5 /> <span id="tension_value" /></span> <br />\
					<input type="checkbox" id="centripetal" checked /> Centripetal Catmull-rom<br />\
					<input type="checkbox" id="chordal" checked /> Chordal Catmull-rom<br />\
					<input type="button" onclick="swapCam();" value="切换摄像机" />\
					<input type="button" onclick="play();" value="开始播放" />\
                    <input type="button" onclick="" value="..." />';


    containerMain.appendChild( info );
    containerMain.appendChild( options );

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    containerMain.appendChild( stats.domElement );


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
        updateSplineOutline();
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
    var dragcontrols = new THREE.DragControls( camera, splineHelperObjects, renderer.domElement ); //
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


    /*******
     * Curves
     *********/

    var i;
    // 添加最初的4个控制点
    for ( i = 0; i < splinePointsLength; i ++ ) {
        addSplineObject( positions[ i ] );
    }
    positions = [];
    // 记录控制点的位置
    for ( i = 0; i < splinePointsLength; i ++ ) {
        positions.push( splineHelperObjects[ i ].position );
    }
    // 创建空geo,放入200个空点
    var geometry = new THREE.Geometry();
    for ( var i = 0; i < ARC_SEGMENTS; i ++ ) {
        geometry.vertices.push( new THREE.Vector3() );
    }

    // 创建样条曲线,使用关键点构造,内部包含mesh
    var curve;
    curve = new THREE.CatmullRomCurve3( positions );
    curve.type = 'catmullrom';
    curve.mesh = new THREE.Line( geometry.clone(), new THREE.LineBasicMaterial( {
        color: 0xff0000,
        opacity: 0.35,
        linewidth: 2
    } ) );
    curve.mesh.castShadow = true;
    splines.uniform = curve;

    curve = new THREE.CatmullRomCurve3( positions );
    curve.type = 'centripetal';
    curve.mesh = new THREE.Line( geometry.clone(), new THREE.LineBasicMaterial( {
        color: 0x00ff00,
        opacity: 0.35,
        linewidth: 2
    } ) );
    curve.mesh.castShadow = true;
    splines.centripetal = curve;

    curve = new THREE.CatmullRomCurve3( positions );
    curve.type = 'chordal';
    curve.mesh = new THREE.Line( geometry.clone(), new THREE.LineBasicMaterial( {
        color: 0x0000ff,
        opacity: 0.35,
        linewidth: 2
    } ) );
    curve.mesh.castShadow = true;
    splines.chordal = curve;

    // 将样条加入scene
    for ( var k in splines ) {
        var spline = splines[ k ];
        scene.add( spline.mesh );
    }

    load( [ new THREE.Vector3( 289.76843686945404, 452.51481137238443, 56.10018915737797 ),
        new THREE.Vector3( -53.56300074753207, 171.49711742836848, -14.495472686253045 ),
        new THREE.Vector3( -91.40118730204415, 176.4306956436485, -6.958271935582161 ),
        new THREE.Vector3( -383.785318791128, 491.1365363371675, 47.869296953772746 ) ] );

    createPhoto();
    resetPos();


}

// 添加控制点
// 创建cube加入scene,加入管理数组
function addSplineObject( position ) {
    var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( {
        color: Math.random() * 0xffffff
    } ) );
    object.material.ambient = object.material.color;
    if ( position ) {

        object.position.copy( position );

    } else {

        object.position.x = Math.random() * 1000 - 500;
        object.position.y = Math.random() * 600;
        object.position.z = Math.random() * 800 - 400;

    }
    object.castShadow = true;
    object.receiveShadow = true;
    scene.add( object );
    splineHelperObjects.push( object );
    return object;
}

function addPoint() {
    splinePointsLength ++;
    positions.push( addSplineObject().position );
    updateSplineOutline();
}

function removePoint() {
    if ( splinePointsLength <= 4 ) {
        return;
    }
    splinePointsLength --;
    positions.pop();
    scene.remove( splineHelperObjects.pop() );
    updateSplineOutline();
}

// 更新样条曲线,没有这句就看不到曲线
function updateSplineOutline() {
    var p;
    for ( var k in splines ) {
        var spline = splines[ k ];
        splineMesh = spline.mesh;
        for ( var i = 0; i < ARC_SEGMENTS; i ++ ) {
            p = splineMesh.geometry.vertices[ i ];
            p.copy( spline.getPoint( i /  ( ARC_SEGMENTS - 1 ) ) );
        }
        splineMesh.geometry.verticesNeedUpdate = true;
    }
}

function exportSpline() {
    var p;
    var strplace = [];
    for ( i = 0; i < splinePointsLength; i ++ ) {
        p = splineHelperObjects[ i ].position;
        strplace.push( 'new THREE.Vector3({0}, {1}, {2})'.format( p.x, p.y, p.z ) )
    }
    console.log( strplace.join( ',\n' ) );
    var code = '[' + ( strplace.join( ',\n\t' ) ) + ']';
    prompt( 'copy and paste code', code );
}

function load( new_positions ) {
    while ( new_positions.length > positions.length ) {
        addPoint();
    }
    while ( new_positions.length < positions.length ) {
        removePoint();
    }
    for ( i = 0; i < positions.length; i ++ ) {
        positions[ i ].copy( new_positions[ i ] );
    }
    updateSplineOutline();
}

function animate() {

    requestAnimationFrame( animate );
    render();
    stats.update();
    controls.update();
    transformControl.update();
    TWEEN.update();
}

function render() {



    splines.uniform.mesh.visible = uniform.checked;
    splines.centripetal.mesh.visible = centripetal.checked;
    splines.chordal.mesh.visible = chordal.checked;
    renderer.render(scene, camera);
    //updateSplineCamera();
    if(bPlay){
        rendererCam.render(scene, splineCamera);
    }

}

// 创建出所有的照片
function createPhoto(){
    var plane = new THREE.PlaneGeometry( sceneData.imgw, sceneData.imgh, 2, 2 );
    sceneData.materials = new Array();
    // 加载纹理
    for(var m=0; m<sceneData.imgs; ++m)
    {
        var fname = "pic/00" + m + ".jpg";
        var texture = new THREE.TextureLoader().load(fname);
        var material = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture } );
        sceneData.materials[m] = material;
    }

    var count = sceneData.imgs * sceneData.imgs;
    sceneData.meshs = new Array(count);
    for(var m=0; m<count; ++m){
        sceneData.meshs[m] = new THREE.Mesh( plane.clone(), sceneData.materials[m % sceneData.imgs].clone());
    }
}

// 设置初始位置
function resetPos(){
    var count = sceneData.imgs * sceneData.imgs;
    var startx = (sceneData.imgs * sceneData.imgw ) * -0.5;
    for(var m=0; m<count; ++m){
        var row = Math.floor(m / sceneData.imgs);
        var col = m % sceneData.imgs;
        sceneData.meshs[m]._row = row;
        sceneData.meshs[m]._col = col;
        sceneData.meshs[m].position.x = startx + col * (sceneData.imgw + sceneData.distanceX);
        sceneData.meshs[m].position.y = row * (sceneData.imgh + sceneData.distanceY);
        sceneData.meshs[m].position.z = -500;
        scene.add(sceneData.meshs[m]);
    }
}

function swapCam(){
    bPlay = !bPlay;
    if(bPlay){
        resetPlayData2();
    }
}

// 取样条曲线所有点
function getTrackPoints(geo){
    var pts = [];
    var step = 1;
    for(var m=0; m<geo.vertices.length; m+=step){
        var vec3 = new THREE.Vector3();
        vec3.copy(geo.vertices[m]);
        pts.push(vec3);
    }
    return pts;
}

// 构造缓动
function makeTweenQueue(que){
    if(que.length <= 2){
        return;
    }
    var start = que.shift();
    var value = {x: start.x, y: start.y, z: start.z};
    var target = {x: que[0].x, y: que[0].y, z: que[0].z};
    var tween = new TWEEN.Tween(value).to(target, 50);
    tween.onUpdate(function(){
        splineCamera.position.x = value.x;
        splineCamera.position.y = value.y;
        splineCamera.position.z = value.z;
        //splineCamera.lookAt(new THREE.Vector3(500, 300, 100));

    });
    tween.delay(0);
    tween.onComplete(function(){
        makeTweenQueue(que);
    });
    tween.start();
}

function resetPlayData2(){
    var arr;
    for ( var k in splines ) {
        var arr = getTrackPoints(splines[k].mesh.geometry);
        makeTweenQueue(arr);
        return;
    }

    //
    //var tweenarr = [];
    //var value = {};
    //var target = {};
    //for(var m=0; m<arr.length; ++m){
    //    if(m + 1 >= arr.length){
    //        continue;
    //    }
    //    value.x = arr[m].x;
    //    value.y = arr[m].y;
    //    value.z = arr[m].z;
    //    target.x = arr[m + 1].x;
    //    target.y = arr[m + 1].y;
    //    target.z = arr[m + 1].z;
    //    var tween = new TWEEN.Tween(value).to(target, 500);
    //    //console.log(value.x +","+value.y+","+value.z+"->"+target.x+","+target.y+","+target.z);
    //    tween.onUpdate( function()
    //    {
    //        splineCamera.position.x = value.x;
    //        splineCamera.position.y = value.y;
    //        splineCamera.position.z = value.z;
    //    });
    //    tween.delay(0);
    //    tween.onComplete( function()
    //    {
    //
    //    });
    //    tweenarr.push(tween);
    //}
    //
    //for(var m=0; m<tweenarr.length; ++m){
    //    if(m + 1 >= tweenarr.length){
    //        continue;
    //    }
    //    tweenarr[m].chain(tweenarr[m+1]);
    //}
    //tweenarr[0].start();
}


function resetPlayData(){
    var p;
    var spline;
    for ( var k in splines ) {
        spline = splines[ k ];
        break;
    }
    splineMesh = spline.mesh;
    // for ( var i = 0; i < ARC_SEGMENTS; i ++ ) {
    p = splineMesh.geometry.vertices[ 0 ];
    //    console.log(p.x + "," + p.y + "," + p.z);
    //}
    splineCamera.position.copy( p );
    splineindex = 0;
}

function updateSplineCamera(){
    if(!bPlay) return;
    var p;
    var spline;
    for ( var k in splines ) {
        spline = splines[ k ];
        break;
    }
    splineMesh = spline.mesh;
    if(++splineindex > ARC_SEGMENTS){
        swapCam();
        return;
    }
    p = splineMesh.geometry.vertices[splineindex];

    splineCamera.position.copy( p );
}
function play(){

}