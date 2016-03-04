/**
 * Created by Administrator on 2016/3/2 0002.
 */

var editorData = {
    MINNODES: 4,
    templateCube: null,
    templateLine: null,
    viewSize: {
        mainWidth: 512,
        mainHeigth: 384,
        camWidth: 128,
        camHeigth: 96
    },
    ARC_SEGMENTS: 200,
    NODEINDEX: 0,
    nodeArr: null,
    controlPointArr: null,
    curvePoints: null,
    curve: null,
    selTargetMesh: null,
    timebar: null, // 时间轴上的时间线
    timebarid: "timebar",

    addDefaultNode: function(){
        var now = Date.now();
        var step = 2000;
        // 4个关键帧, 每个间隔2秒
        var items = new vis.DataSet();
        for (var m=0; m<4; ++m){
            var item = {
                id: m,
                start: now + m * step
            };
            this.addNode(item);
            items.add(item);
        }
        this.nodeArr[1].mesh.rotation.x = -0.5 * Math.PI;
        timeline.setItems(items);
    },

    resetData: function (){
        this.templateCube = new THREE.BoxGeometry(20, 20, 20);
        this.templateLine = new THREE.Geometry();
        for ( var i = 0; i < this.ARC_SEGMENTS; i ++ ) {
            this.templateLine.vertices.push( new THREE.Vector3() );
        }
        this.NODEINDEX = 0;
        this.nodeArr = new Array();
        this.curvePoints = new Array();
        this.controlPointArr = new Array();
        this.selTargetMesh = new THREE.Mesh(new THREE.BoxGeometry(50, 50, 50),
            new THREE.MeshLambertMaterial({color: 0x7777ff, wireframe: true}));
        editor.scene.add(this.selTargetMesh);


        this.curve = new THREE.CatmullRomCurve3(this.curvePoints);
        this.curve.mesh = new THREE.Line(this.templateLine, new THREE.LineBasicMaterial( {
            color: 0xff0000,
            opacity: 0.35,
            linewidth: 2
        } ) );
        this.curve.mesh.castShadow = true;
        editor.scene.add(this.curve.mesh);
        this.addDefaultNode();
        this.updateSplineOutline();


        timeline.addCustomTime(this.nodeArr[0].start, this.timebarid);
        timeline.on('timechange', function (properties) {
            document.getElementById('timechangeBar').innerHTML = properties.id;
            document.getElementById('timechangeEvent').innerHTML = properties.time;
            editorData.interpolation();
        });
        timeline.on('timechanged', function (properties) {
            document.getElementById('timechangedBar').innerHTML = properties.id;
            document.getElementById('timechangedEvent').innerHTML = properties.time;
        });
    },
    // 添加节点
    addNode: function (item, callback) {
        item.content = '' + this.NODEINDEX++;
        //item.start = Date.now();

        var mesh = new THREE.Mesh(this.templateCube, new THREE.MeshLambertMaterial({
            color: Math.random() * 0xffffff
        }));
        mesh.material.ambient = mesh.material.color;
        mesh.position.x = Math.random() * 1000 - 500;
        mesh.position.y = Math.random() * 600;
        mesh.position.z = Math.random() * 800 - 400;

        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.name = item.content;

        var object = new Object();
        object.index = item.content;
        object.id = item.id;
        object.start = item.start;
        object.mesh = mesh;
        this.nodeArr.push(object);
        editor.scene.add(mesh);
        this.controlPointArr.push(mesh);

        this.curvePoints.push(mesh.position);
        this.resort();
        if(callback){
            callback(item);
        }
        return object;
    },

    setSelect: function(id){
        var node = this.getNode(id);
        if(node){
            this.updateTargetMesh(node.value.mesh.position, node.value.mesh.rotation);
            editor.updateViewCameraPosition(node.value.mesh.position);
            editor.updateViewCameraRotation(node.value.mesh.rotation);
        }
    },

    removeCurvePoint: function(vec3){
        for(var m=0; m<this.curvePoints.length; ++m){
            if(this.curvePoints[m].equals(vec3)){
                this.curvePoints.splice(m, 1);
                return true;
            }
        }
        return false;    },

    removeNode: function(item, callback){
        if(this.nodeArr.length > this.MINNODES){
            var node = this.getNode(item);
            if (node) {
                if(this.removeCurvePoint(node.value.mesh.position)){
                    this.updateSplineOutline();
                    var mesh = editor.scene.getChildByName(node.value.index);
                    if(mesh){
                        editor.scene.remove(mesh);
                        this.nodeArr.splice(node.index, 1);
                        callback(item);
                    }
                }
            }
        }
    },

    // 获取节点
    getNode: function (item) {
        if(item.id){
            for(var m=0; m<this.nodeArr.length; ++m) {
                if (this.nodeArr[m].id === item.id) {
                    return {value: this.nodeArr[m], index: m};
                }
            }
        } else {
            for(var m=0; m<this.nodeArr.length; ++m) {
                if (this.nodeArr[m].id === item) {
                    return {value: this.nodeArr[m], index: m};
                }
            }
        }
        return null;
    },
    // 更新节点时间
    updateTime: function (item, callback) {
        var node = this.getNode(item);
        if (node) {
            node.value.start = item.start;
            this.resort();
            if(callback){
                callback(item);
            }
        }
    },
    // 根据时间轴节点顺序重新对数组排序
    resort: function () {
        if(this.nodeArr.length > this.MINNODES - 1){
            function comparebystart(v1, v2) {
                if (v1.start > v2.start) {
                    return 1;
                } else if (v1.start < v2.start) {
                    return -1;
                } else {
                    return 0;
                }
            }
            this.nodeArr.sort(comparebystart);
            for(var m=0; m<this.nodeArr.length; ++m){
                this.curvePoints[m] = this.nodeArr[m].mesh.position;
            }
            this.updateSplineOutline();
        }

    },

    // 更新样条曲线,没有这句就看不到曲线
    updateSplineOutline: function() {
        if(this.nodeArr.length > this.MINNODES - 1){
            var p;
            for ( var i = 0; i < this.ARC_SEGMENTS; i ++ ) {
                p = this.curve.mesh.geometry.vertices[ i ];
                // 根据关键点取curve在百分比下的插值结果重新赋值
                p.copy( this.curve.getPoint( i /  ( this.ARC_SEGMENTS - 1 ) ) );
            }
            this.curve.mesh.geometry.verticesNeedUpdate = true;
        }
    },

    // help fun
    printNodeData: function(){
        console.log("===================");
        for(var m=0; m<this.nodeArr.length; ++m){
            var s = "(" + m + ") index: " + this.nodeArr[m].index + ", id: " + this.nodeArr[m].id + ", start: " + this.nodeArr[m].start;
            console.log(s);
            var d = Date.parse(this.nodeArr[m].start);
            console.log(d);
        }
    },

    // 选中时间轴上的最左一个
    fouceFirst: function(){
        timeline.setSelection(this.nodeArr[0].id);
        editorData.setSelect(this.nodeArr[0].id);
        timeline.fit();
        timeline.setCustomTime(this.nodeArr[0].start, this.timebarid);
    },
    // 选中时间轴上的最右一个
    fouceLast: function(){
        timeline.setSelection(this.nodeArr[this.nodeArr.length - 1].id);
        editorData.setSelect(this.nodeArr[this.nodeArr.length - 1].id);
        timeline.fit();
        timeline.setCustomTime(this.nodeArr[this.nodeArr.length - 1].start, this.timebarid);
    },
    play: function(){

    },

    // 根据时间取得关键点
    getKeyPoint: function(date){
        var r = new Array();
        if(date < this.nodeArr[0].start || date > this.nodeArr[this.nodeArr.length-1].start){
            return r;
        }
        for(var m=0; m<this.nodeArr.length-1; ++m){
            if(this.nodeArr[m].start == date){
                r.push(this.nodeArr[m]);
                break;
            } else if(date > this.nodeArr[m].start && date < this.nodeArr[m+1].start){
                r.push(this.nodeArr[m], this.nodeArr[m+1]);
                break;
            }
        }
        return r;
    },

    // 更新预览摄像机空间位置与角度
    updateTargetMesh: function(pos, rot){
        this.selTargetMesh.position.copy(pos);
        if(rot){
            if(this.selTargetMesh.rotation) {
                this.selTargetMesh.rotation.copy(rot);
            }
        }
    },

    interpolation: function(){
        var date = timeline.getCustomTime(this.timebarid);

        if(date < this.nodeArr[0].start || // 小于min
            date == this.nodeArr[0].start){
            this.setSelect(this.nodeArr[0].id);
        } else if(date > this.nodeArr[this.nodeArr.length - 1].start || // 大于max
            date == this.nodeArr[this.nodeArr.length - 1].start){
            this.setSelect(this.nodeArr[this.nodeArr.length - 1].id);
        } else { // 在range之内
            // 取在时间轴上的比例
            var timelong = this.nodeArr[this.nodeArr.length - 1].start - this.nodeArr[0].start;
            var timenow = date - this.nodeArr[0].start;
            var d = timenow / timelong;
            // 位置
            var pt = this.curve.getPoint(d);
            // 角度
            var rot = new THREE.Euler();
            var arr = this.getKeyPoint(date);
            if(arr.length == 1){ // 落在关键点上
                rot.copy(arr[0].mesh.rotation);
            } else if (arr.length == 2) { // 在两个关键点之间
                var timelong = arr[1].start - arr[0].start;
                var timenow = date - arr[0].start;
                var d = timenow / timelong;

                var rotlongx = arr[1].mesh.rotation.x - arr[0].mesh.rotation.x;
                var rotlongy = arr[1].mesh.rotation.y - arr[0].mesh.rotation.y;
                var rotlongz = arr[1].mesh.rotation.z - arr[0].mesh.rotation.z;

                rot.set(arr[0].mesh.rotation.x + rotlongx * d,
                        arr[0].mesh.rotation.y + rotlongy * d,
                        arr[0].mesh.rotation.z + rotlongz * d,
                        "XYZ"
                );
            } else { // 小于min或大于max
                // 暂时什么多不做
            }

            editor.updateViewCameraPosition(pt);
            editor.updateViewCameraRotation(rot);
            this.updateTargetMesh(pt, rot);
        }
    }
};

