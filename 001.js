var container, scene, camera, renderer, controls, stats;
var keyboard = new KeyboardState();
var clock = new THREE.Clock();
var rand = {};
rand.get = function (begin,end){
    return Math.floor(Math.random()*(end-begin))+begin;
};

var sceneData = {
    bRing: true,
    imgw: 150,
    imgh: 100,
    imgs: 7,
    distanceX: 20,
    distanceY: 20,
    materials: null,
    meshs: null
};

init();
animate();

// FUNCTIONS
function createScene(){
    createPhoto();
    resetPos();
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
    for(var m=0; m<count; ++m){
        var row = Math.floor(m / sceneData.imgs);
        var col = m % sceneData.imgs;
        sceneData.meshs[m]._row = row;
        sceneData.meshs[m]._col = col;
        sceneData.meshs[m].position.x = col * (sceneData.imgw + sceneData.distanceX);
        sceneData.meshs[m].position.y = row * (sceneData.imgh + sceneData.distanceY);
        scene.add(sceneData.meshs[m]);
    }
}

// 获取指定行的照片
function getHorizontalQueue(index){
    var arr = new Array();
    for(var m=0; m<sceneData.imgs * sceneData.imgs; ++m){
        if(sceneData.meshs[m]._row === index)
        {
            arr.push(sceneData.meshs[m]);
        }
    }
    return arr;
}

// 获取指定列的照片
function getVerticalQueue(index){
    var arr = new Array();
    for(var m=0; m<sceneData.imgs * sceneData.imgs; ++m){
        if(sceneData.meshs[m]._col === index)
        {
            arr.push(sceneData.meshs[m]);
        }
    }
    return arr;
}

// 移动
function handleMove(arr, tomax, bHorizontal, time, delay, que){
    if(checkMoving(arr))
    {
        return handleScript(que);
    }
    var completecount = 0;
    arr.forEach(function(item) {
        item._moving = true;
        var value = {};
        if(bHorizontal){
            value.t = item.position.x;
        }else{
            value.t = item.position.y;
        }
        var target = {};
        if(bHorizontal){
            if(tomax){
                target.t = item.position.x + sceneData.imgw + sceneData.distanceX;
            }else{
                target.t = item.position.x - sceneData.imgw - sceneData.distanceX;
            }
        }else{
            if(tomax){
                target.t = item.position.y + sceneData.imgh + sceneData.distanceY;
            }else{
                target.t = item.position.y - sceneData.imgh - sceneData.distanceY;
            }
        }

        var tween = new TWEEN.Tween(value).to(target, time);
        tween.onUpdate( function()
        {
            if(bHorizontal){
                item.position.x = value.t;
            }else{
                item.position.y = value.t;
            }
        });
        tween.delay(delay);
        tween.onComplete( function()
        {
            item._moving = false;
            if(++completecount === arr.length){
                updateRowCol(arr, tomax, bHorizontal);
                //console.log("2");
                return handleScript(que);
            }
        });
        tween.start();
    });
    //console.log("1");
}

// 检测当前队列中是否有正在移动的元素
function checkMoving(arr){
    return arr.some(function(item){
        return item._moving;
    });
}

// 更新行列序号
function updateRowCol(arr, tomax, bHorizontal){
    if(tomax){
        arr.forEach(function(item){
            if(bHorizontal){
                ++item._col;
            }else{
                ++item._row;
            }
        });
    }else{
        arr.forEach(function(item){
            if(bHorizontal){
                --item._col;
            }else{
                --item._row;
            }
        });
    }

    //arr.forEach(function(item){
    //    console.log(item._row + ", "+item._col);
    //});
    if(sceneData.bRing){
        ringHandle(arr, tomax, bHorizontal);
    }
}

// 获取需环形处理的元素
function getRingTarget(arr, tomax, bHorizontal){
    var index = 0;
    var result = null;
    if(bHorizontal){
        if(tomax){ // 取col最大
            var maxcol = arr[0]._col;
            for(var m=0; m<arr.length; ++m){
                if(arr[m]._col > maxcol){
                    index = m;
                    maxcol = arr[m]._col;
                }
            }
            result = arr[index];
        }else{
            var mincol = arr[0]._col;
            for(var m=0; m<arr.length; ++m){
                if(arr[m]._col < mincol){
                    index = m;
                    mincol = arr[m]._col;
                }
            }
            result = arr[index];
        }
    }else{
        if(tomax){ // 取row最大
            var maxrow = arr[0]._row;
            for(var m=0; m<arr.length; ++m){
                if(arr[m]._row > maxrow){
                    index = m;
                    maxrow = arr[m]._row;
                }
            }
            result = arr[index];
        }else{
            var minrow = arr[0]._row;
            for(var m=0; m<arr.length; ++m){
                if(arr[m]._row < minrow){
                    index = m;
                    minrow = arr[m]._row;
                }
            }
            result = arr[index];
        }
    }
    return result;
}

// 环形补位
function ringHandle(arr, tomax, bHorizontal){
   var target = getRingTarget(arr, tomax, bHorizontal);
   if(bHorizontal){
       if(tomax){
           target._col -= arr.length;
           target.position.x -= (sceneData.imgw + sceneData.distanceX) * arr.length;
       }else{
           target._col += arr.length;
           target.position.x += (sceneData.imgw + sceneData.distanceX) * arr.length;
       }
   }else{
       if(tomax){
           target._row -= arr.length;
           target.position.y -= (sceneData.imgh + sceneData.distanceY) * arr.length;
       }else{
           target._row += arr.length;
           target.position.y += (sceneData.imgh + sceneData.distanceY) * arr.length;
       }
   }
}

// 执行脚本
function handleScript(que){
    if(que.length){
        //console.log(que.length);
        var src = que.shift();
        var getTimeMax = function(arr){
            var index = 0;
            var val = arr[0].time + arr[0].delay;
            for(var m=0; m<arr.length; ++m){
                if(arr[m].time + arr[m].delay > val){
                    index = m;
                    val = arr[m].time + arr[m].delay;
                }
            }
            return index;
        };
        if(Array.isArray(src) && src.length){
            var index = getTimeMax(src);
            for(var m=0; m<src.length; ++m){
                var arr = src[m].bHorizontal ? getHorizontalQueue(src[m].index) : getVerticalQueue(src[m].index);
                if(m === index){
                    handleMove(arr, src[m].tomax, src[m].bHorizontal, src[m].time, src[m].delay, []);
                }else{
                    handleMove(arr, src[m].tomax, src[m].bHorizontal, src[m].time, src[m].delay, que);
                }
            }
        }else{
            var arr = src.bHorizontal ? getHorizontalQueue(src.index) : getVerticalQueue(src.index);
            handleMove(arr, src.tomax, src.bHorizontal, src.time, src.delay, que);
        }
    }
}

function init()
{
    // SCENE
    scene = new THREE.Scene();
    // CAMERA
    var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
    var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
    camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
    scene.add(camera);
    camera.position.set(0,800,1500);
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
    //var light = new THREE.PointLight(0xffffff);
    //light.position.set(100,250,100);
    //scene.add(light);
    var light = new THREE.DirectionalLight( 0xffffff, 2 );
    light.position.set( 1, 1, 1 );
    scene.add( light );


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
    createScene();
}

function animate()
{
    requestAnimationFrame( animate );
    render();
    update();
}

function script(){
    var arr = [];
    var push1by1 = function(){
        var move1 = {
            index: 3,
            tomax: false,
            bHorizontal: true,
            time: 1000,
            delay: 0
        };
        var move2 = {
            index: 5,
            tomax: true,
            bHorizontal: false,
            time: 1000,
            delay: 0
        };
        arr.push(move1, move2);
    };

    var pushRandom = function(count){
       for(var m=0; m<count; ++m){
           var mov = {};
           mov.index = rand.get(0, sceneData.imgs);
           mov.tomax = Boolean(rand.get(0, 2));2
           mov.bHorizontal = Boolean(rand.get(0, 2));
           mov.time = 1000; //Math.random() * 1000;
           mov.delay = 0; //Math.random() * 500;
           var repeat = rand.get(1, 3);
           for(var n=0; n<repeat; ++n)
           {
               arr.push(mov);
           }
       }
    };

    var pushSync = function(){
        var move1 = {
            index: 3,
            tomax: false,
            bHorizontal: true,
            time: 1000,
            delay: 0
        };
        var move2 = {
            index: 5,
            tomax: true,
            bHorizontal: true,
            time: 1500,
            delay: 0
        };
        arr.push([move1, move2]);
    };

    var pushSyncRandom = function(count){
        var getRandomFromArr = function(arr){
            var index = rand.get(0, arr.length);
            var result = arr.splice(index, 1);
            return result[0];
        };

        for(var m=0; m<count; ++m){
            var synccount = rand.get(1, /*sceneData.imgs*/4);
            var bHorizontal = Boolean(rand.get(0, 2));

            var indexarr = [];
            for(var i=0; i<sceneData.imgs; ++i){
                indexarr[i] = i;
            }

            var movarr = [];
            for(var n=0; n<synccount; ++n){
                var mov = {};
                mov.bHorizontal = bHorizontal;
                mov.index = getRandomFromArr(indexarr);
                mov.tomax = Boolean(rand.get(0, 2));
                mov.time = 1000; //Math.random() * 1000;
                mov.delay = 0; //Math.random() * 500;
                movarr.push(mov);
            }

            arr.push(movarr);
        }
    };


    for(var x=0;x<100;++x){
        //push1by1();
        pushSyncRandom(2);
        pushRandom(2);
        //push1by1();
        pushSyncRandom(2);
        //pushSync();
    }




    handleScript(arr);
}

function update()
{
    keyboard.update();
    //var step = 100;
    //var moveDistance = step * clock.getDelta();

    if ( keyboard.pressed("2") ){
        var arr = getVerticalQueue(4);
        handleMove(arr, false, false, 1000, 0);
    }
    if ( keyboard.pressed("8") ){
        var arr = getVerticalQueue(4);
        handleMove(arr, true, false, 1000, 0);
    }
    if ( keyboard.pressed("4") ){
        var arr = getHorizontalQueue(4);
        handleMove(arr, false, true, 1000, 0);
    }
    if ( keyboard.pressed("6") ){
        var arr = getHorizontalQueue(4);
        handleMove(arr, true, true, 1000, 0);
    }

    if ( keyboard.pressed("5") ) {
        resetPos();
    }

    if ( keyboard.up("1") ) {
        sceneData.bRing = !sceneData.bRing;
    }
    if ( keyboard.up("0") ) {
        script();
    }
    controls.update();
    stats.update();
    TWEEN.update();
}

function render()
{
    renderer.render( scene, camera );
}