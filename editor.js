
var editor = {
    containerMain: null,
    containerCam: null,
    stats: null,
    mainCamera: null,
    viewCamera: null,
    scene: null,
    mainRenderer: null,
    viewRenderer: null,
    transformControl: null,

    reset: function(){
        this.scene = new THREE.Scene();

        // editor渲染器
        this.mainRenderer = new THREE.WebGLRenderer( { antialias: true } );
        this.mainRenderer.setClearColor( 0xf0f0f0 );
        this.mainRenderer.setSize( editorData.viewSize.mainWidth, editorData.viewSize.mainHeigth );
        this.mainRenderer.shadowMap.enabled = true;

        // 预览渲染器
        this.viewRenderer = new THREE.WebGLRenderer( { antialias: true } );
        this.viewRenderer.setClearColor( 0xf0f0f0 );
        this.viewRenderer.setSize( editorData.viewSize.camWidth, editorData.viewSize.camHeigth);
        this.viewRenderer.shadowMap.enabled = true;

        // edit div
        this.containerMain = document.getElementById('mainview');
        this.containerMain.appendChild( this.mainRenderer.domElement );
        // 预览div
        this.containerCam = document.getElementById('camera');
        this.containerCam.appendChild( this.viewRenderer.domElement );

        // 主摄像机
        this.mainCamera = new THREE.PerspectiveCamera( 45, editorData.viewSize.mainWidth / editorData.viewSize.mainHeigth, 1, 10000 );
        this.mainCamera.position.z = 1000;
        this.scene.add( this.mainCamera );

        // 轨道摄像机
        this.viewCamera = new THREE.PerspectiveCamera( 45, editorData.viewSize.camWidth / editorData.viewSize.camHeigth, 1, 10000 );
        this.viewCamera.position.z = 1000;
        this.scene.add( this.viewCamera );

        // 灯光
        this.scene.add( new THREE.AmbientLight( 0xf0f0f0 ) );
        var light = new THREE.SpotLight( 0xffffff, 1.5 );
        light.position.set( 0, 1500, 200 );
        light.castShadow = true;
        light.shadowCameraNear = 200;
        light.shadowCameraFar = this.mainCamera.far;
        light.shadowCameraFov = 70;
        light.shadowBias = -0.000222;
        light.shadowDarkness = 0.25;
        light.shadowMapWidth = 1024;
        light.shadowMapHeight = 1024;
        this.scene.add( light );

        // 地板,有阴影
        var planeGeometry = new THREE.PlaneGeometry( 2000, 2000 );
        planeGeometry.rotateX( - Math.PI / 2 );
        var planeMaterial = new THREE.MeshBasicMaterial( { color: 0xeeeeee } );
        var plane = new THREE.Mesh( planeGeometry, planeMaterial );
        plane.position.y = -200;
        plane.receiveShadow = true;
        this.scene.add( plane );

        // 表格,与地板y位置很近
        var helper = new THREE.GridHelper( 1000, 100 );
        helper.position.y = - 199;
        helper.material.opacity = 0.25;
        helper.material.transparent = true;
        this.scene.add( helper );

        // 坐标轴
        var axis = new THREE.AxisHelper(200);
        axis.position.set( 0, -200, 0 );
        this.scene.add( axis );

        // fps
        this.stats = new Stats();
        this.stats.domElement.style.position = 'absolute';
        this.stats.domElement.style.top = '0px';
        this.containerMain.appendChild( this.stats.domElement );


        var plane = new THREE.PlaneGeometry( 1500, 1000, 2, 2 );
        var texture = new THREE.TextureLoader().load("pic/004.jpg");
        var material = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture } );
        var mesh = new THREE.Mesh( plane,material);
        mesh.position.z = -500;
        mesh.position.y = 300;
        this.scene.add(mesh);

        editorData.resetData();

        // 变换控制器,用于操控轨迹点的回调处理
        var transformControl = new THREE.TransformControls( this.mainCamera, this.mainRenderer.domElement );
        transformControl.addEventListener( 'change', this.render );
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
            editor.updateViewCameraPosition(e.target.object.position);
            editor.updateViewCameraRotation(e.target.object.rotation);
        } );
        this.scene.add( transformControl );
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
        this.transformControl = transformControl;

        // 貌似是用于拖拽轨迹点
        var dragcontrols = new THREE.DragControls( this.mainCamera, editorData.controlPointArr, this.mainRenderer.domElement ); //
        dragcontrols.on( 'hoveron', function( e ) {
            transformControl.attach( e.object );
            cancelHideTransorm(); // *
        } );
        dragcontrols.on( 'hoveroff', function( e ) {
            if ( e ) delayHideTransform();
        } );

        // 轨道控制器,用于控制摄像机
        var controls = new THREE.OrbitControls( this.mainCamera, this.mainRenderer.domElement );
        controls.damping = 0.2;
        controls.addEventListener( 'change', this.render );
        controls.addEventListener( 'start', function() {
            cancelHideTransorm();
        } );
        controls.addEventListener( 'end', function() {
            delayHideTransform();
        } );
        this.controls = controls;

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
    },
    render: function() {
        if(this.mainRenderer) {
            this.mainRenderer.render(this.scene, this.mainCamera);
        }
        if(this.viewRenderer) {
            this.viewRenderer.render(this.scene, this.viewCamera);
        }
    },
    updateViewCameraPosition: function(position){
        this.viewCamera.position.copy( position );
    },
    updateViewCameraRotation: function(rotation){
        this.viewCamera.rotation.copy( rotation );
    }
};

init();
animate();
function init() {
    editor.reset();
}

function animate(){
    requestAnimationFrame( animate );
    editor.render();
    editor.stats.update();
    editor.controls.update();
    editor.transformControl.update();
    TWEEN.update();
}

