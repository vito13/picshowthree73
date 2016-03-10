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
    ARC_SEGMENTS: 200, // 由n个点连接来描绘的曲线,但非曲线的控制点数量
    NODEINDEX: 0,
    nodeArr: null,
    controlPointArr: null, // 用于编辑器操作的所有关键点容器
    curvePoints: null,
    curve: null,
    selTargetMesh: null,
    timebar: null, // 时间轴上的时间线
    timebarid: "timebar",
    cameraTween: null, // 摄像机缓动
    playEndTimeLong: 1000, // 播放时最后一帧的持续时间毫秒

    ptArr: null, // 临时测试用于描绘曲线的点
    templateSphere: null, // 对应于上面用的mesh
    indexArr: null, // 用于保存每次曲线更新后所有关键点的index
    defaultDir: 0, // 默认节点朝向(面对影视墙)
    nodeJsonArr: [], // 用于保存脚本数据

    resetNode: function(){
        var items = new vis.DataSet();
        if(this.nodeJsonArr.length){
            for (var m=0; m<this.nodeJsonArr.length; ++m){
                var item = {
                    id: this.nodeJsonArr[m].id,
                    start: this.nodeJsonArr[m].start
                };
                var nodeData = {
                    position: this.nodeJsonArr[m].position,
                    rotation: this.nodeJsonArr[m].rotation,
                    id: this.nodeJsonArr[m].id,
                    start: this.nodeJsonArr[m].start
                };
                this.addNode(item, null, nodeData);
                items.add(item);
            }
        }else{
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
            this.nodeArr[2].mesh.rotation.x = 0.5 * Math.PI;
        }

        timeline.setItems(items);
    },

    resetData: function (){
        this.templateCube = new THREE.CylinderGeometry( 0, 20, 50, 10, 4 );
        this.templateLine = new THREE.Geometry();
        for ( var i = 0; i < this.ARC_SEGMENTS; i ++ ) {
            this.templateLine.vertices.push( new THREE.Vector3() );
        }
        this.NODEINDEX = 0;
        this.nodeArr = new Array();
        this.curvePoints = new Array();
        this.controlPointArr = new Array();
        this.selTargetMesh = new THREE.Mesh(new THREE.CylinderGeometry( 0, 40, 70, 10, 4 ),
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
        this.resetNode();
        this.indexArr = new Array();
        this.updateSplineOutline();

        timeline.addCustomTime(this.nodeArr[0].start, this.timebarid);
    },

    // 更新曲线的轨迹点位置
    updateCurvePoint: function(){
        var pts = this.curve.getPoints(this.ARC_SEGMENTS);
        for(var m=0; m<pts.length-1; ++m){
            var pt = this.ptArr[m];
            pt.position.x = pts[m].x;
            pt.position.y = pts[m].y;
            pt.position.z = pts[m].z;
            pt.scale.x = 1;
            pt.scale.y = 1;
            pt.scale.z = 1;
        }
    },

    createEmptyNode: function(item){
        var mesh = new THREE.Mesh(this.templateCube, new THREE.MeshLambertMaterial({
            color: Math.random() * 0xffffff, wireframe: false}));
        mesh.material.ambient = mesh.material.color;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.name = item.id;

        var object = new Object();
        object.id = item.id;
        if("number" !== typeof item.start){
            item.start = Date.parse(item.start);
        }
        object.start = item.start;
        object.mesh = mesh;
        return object;
    },

    // 添加节点
    /* 重要属性
     mesh的name用于remove, name与时间轴上的id一致
     时间轴item属性:
     content:    时间轴上的节点内容
     id:         唯一值,即key,双击生成的id为一个类似guid的字符串
     start:      时间
     自定义node属性:  貌似根上面的一部分一样啊...能合一起麽?待优化吧
     mesh        模型
     id          同时间轴
     start       同时间轴
     */
    addNode: function (item, callback, nodeData) {
        var node = this.createEmptyNode(item);
        if(nodeData){
            node.mesh.position.copy(nodeData.position);
            node.mesh.rotation.copy(nodeData.rotation);
            node.id = nodeData.id;
            node.start = nodeData.start;
        } else {
            node.mesh.position.x = Math.random() * 1000 - 500;
            node.mesh.position.y = Math.random() * 600;
            node.mesh.position.z = Math.random() * 800 - 400;
        }
        item.content = "";// + node.id;

        this.nodeArr.push(node);
        editor.scene.add(node.mesh);
        this.controlPointArr.push(node.mesh);

        this.curvePoints.push(node.mesh.position);
        this.resort();
        if(callback){
            callback(item);
        }
        return node;
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
        return false;
    },

    removeNode: function(item, callback){
        if(this.nodeArr.length > this.MINNODES){
            var node = this.getNode(item);
            if (node) {
                if(this.removeCurvePoint(node.value.mesh.position)){
                    this.updateSplineOutline();
                    var mesh = editor.scene.getChildByName(node.value.id);
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
            var ms = item.start.getTime();
            node.value.start = ms;
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
                p = this.curve.mesh.geometry.vertices[i];
                // 根据关键点取curve在百分比下的插值结果重新赋值
                var d = i / (this.ARC_SEGMENTS - 1);
                p.copy(this.curve.getPoint(d));
            }
            this.curve.mesh.geometry.verticesNeedUpdate = true;
            //this.updateCurvePoint();
            //
            this.indexArr = this.getIndexInCurve();
            //for(var m=0; m<this.indexArr.length; ++m){
            //    var index = this.indexArr[m];
            //    var pt = this.ptArr[index];
            //    pt.scale.x = 3;
            //    pt.scale.y = 3;
            //    pt.scale.z = 3;
            //}
        }
    },

    // help fun
    printNodeData: function(){
        console.log("===================");
        for(var m=0; m<this.nodeArr.length; ++m){
            var s = "(" + m + ") id: " + this.nodeArr[m].id + ", start: " + this.nodeArr[m].start;
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
    // 获取当前时间轴时间毫秒
    getCustomTime: function(){
        var time = timeline.getCustomTime(this.timebarid);
        var ms = time.getTime();
        return ms;
    },
    play2Right: function(){
        var p2r = function p2r(host){
            var date = host.getCustomTime();
            var pair = host.getKeyPoint(date);
            if(pair.right){
                this.stop();
                var value = {t: date};
                var target = {t: pair.right.start};
                var timelong = Math.abs(date - pair.right.start);
                host.cameraTween = new TWEEN.Tween(value).to(target, timelong);
                host.cameraTween.onUpdate(function(){
                    editorData.setCustomTime(value.t);
                });
                host.cameraTween.delay(0);
                host.cameraTween.onComplete(function(){
                    p2r(host);
                });
                host.cameraTween.start();
            }
        };
        p2r(this);
    },
    play2Left: function(){
        var p2l = function p2l(host){
            var date = host.getCustomTime();
            var pair = host.getKeyPoint(date);
            if(pair.left){
                this.stop();
                var value = {t: date};
                var target = {t: pair.left.start};
                var timelong = Math.abs(date - pair.left.start);
                host.cameraTween = new TWEEN.Tween(value).to(target, timelong);
                host.cameraTween.onUpdate(function(){
                    editorData.setCustomTime(value.t);
                });
                host.cameraTween.delay(0);
                host.cameraTween.onComplete(function(){
                    p2l(host);
                });
                host.cameraTween.start();
            }
        };
        p2l(this);
    },
    stop: function(){
        if(this.cameraTween){
            this.cameraTween.stop();
            this.cameraTween = null;
        }
    },

    // 根据时间取得关键点
    getKeyPoint: function(date){
        var pair = {};
        if(date < this.nodeArr[0].start) { // <mix
            pair.left = null;
            pair.right = this.nodeArr[0];
        } else if(date > this.nodeArr[this.nodeArr.length-1].start){ // >max
            pair.left = this.nodeArr[this.nodeArr.length-1];
            pair.right = null;
        } else {
            for (var m = 0; m < this.nodeArr.length; ++m) {
                if(date == this.nodeArr[m].start){ // at node
                    pair.current = this.nodeArr[m];
                    if(m){
                        pair.left = this.nodeArr[m-1];
                    }
                    if(m!=this.nodeArr.length-1){
                        pair.right = this.nodeArr[m+1];
                    }
                    break;
                } else if (date > this.nodeArr[m].start && date < this.nodeArr[m + 1].start) { // in range
                    pair.left = this.nodeArr[m];
                    pair.right = this.nodeArr[m + 1];
                    pair.index = m;
                    break;
                }
            }
        }
        return pair;
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

    setCustomTime: function(t){
        timeline.setCustomTime(t, editorData.timebarid);
        editorData.interpolation();
    },

    interpolationInRange: function(date){
        var result = {};
        var pair = this.getKeyPoint(date);
        if(pair.current){
            return pair;
        }
        // 在当前时间段内的占比
        var d = (date - pair.left.start) / (pair.right.start - pair.left.start);
        var start = this.indexArr[pair.index];
        var end = this.indexArr[pair.index+1];
        // 在当前曲线上的占比
        var d2 = ((end - start) * d + start) / this.ARC_SEGMENTS;
        var pt = this.curve.getPoint(d2);
        result.pos = pt;

        var rot = new THREE.Euler();
        var rotlongx = pair.right.mesh.rotation.x - pair.left.mesh.rotation.x;
        var rotlongy = pair.right.mesh.rotation.y - pair.left.mesh.rotation.y;
        var rotlongz = pair.right.mesh.rotation.z - pair.left.mesh.rotation.z;
        rot.set(
            pair.left.mesh.rotation.x + rotlongx * d,
            pair.left.mesh.rotation.y + rotlongy * d,
            pair.left.mesh.rotation.z + rotlongz * d,
            "XYZ"
        );
        result.rot = rot;
        return result;
    },

    // 根据时间线插值摄像机位置与角度
    interpolation: function(){
        var date = this.getCustomTime();

        if(date < this.nodeArr[0].start || // <=min
            date == this.nodeArr[0].start){
            this.setSelect(this.nodeArr[0].id);
        } else if(date > this.nodeArr[this.nodeArr.length - 1].start || // >=max
            date == this.nodeArr[this.nodeArr.length - 1].start){
            this.setSelect(this.nodeArr[this.nodeArr.length - 1].id);
        } else { // 在range之内
            var result = this.interpolationInRange(date);
            if(result.current){
                this.setSelect(result.current.id);
            }else{
                editor.updateViewCameraPosition(result.pos);
                editor.updateViewCameraRotation(result.rot);
                this.updateTargetMesh(result.pos, result.rot);
            }
        }
    },

    // 获取关键点在曲线上的索引
    getIndexInCurve: function(){
        var indexArr = new Array();
        indexArr.push(0);
        var pts = this.curve.getPoints(this.ARC_SEGMENTS);
        var index = 1;

        for (var m = 1; m < this.curvePoints.length-1; ++m) {
            var dis = this.curvePoints[m].distanceTo(pts[index]);
            for (var n = index + 1; n < pts.length; ++n) {
                var d = this.curvePoints[m].distanceTo(pts[n]);
                if (d < dis) {
                    dis = d;
                    index = n;
                }
            }
            indexArr.push(index);
        }
        indexArr.push(this.ARC_SEGMENTS-1);
        return indexArr;
    },

    // 保存为json
    save: function(){
        var arr = new Array();
        for(var m=0; m<this.nodeArr.length; ++m){
            var obj = {};
            //obj.index = this.nodeArr[m].index;
            obj.id = this.nodeArr[m].id;
            obj.start = this.nodeArr[m].start;
            obj.position = this.nodeArr[m].mesh.position;
            obj.rotation = this.nodeArr[m].mesh.rotation;
            var jsonText = JSON.stringify(obj, null, 4);
            arr.push(jsonText);
        }
        var str = arr.join(",");
        str = "[" + str + "]";
        var blob = new Blob([str], {type: "text/plain;charset=utf-8"});
        saveAs(blob, "picshow.json");
    },

    // 拖拽脚本
    handleDrop: function(event){
        var info = "", files, i, len;
        EventUtil.preventDefault(event);
        if (event.type == "drop"){
            files = event.dataTransfer.files;
            i = 0;
            len = files.length;

            while (i < len){
                var reader = new FileReader();
                reader.readAsText(files[i]);
                reader.onerror = function(){
                    console.log("Could not read file, error code is " + reader.error.code);
                };

                reader.onprogress = function(event){
                    if (event.lengthComputable){
                        console.log(event.loaded + "/" + event.total);
                    }
                };

                reader.onload = function(){
                    var str = reader.result;
                    var jsonData = JSON.parse(str);
                    editorData.load(jsonData);
                };
                break;
            }
        }
    },

    // 加载json数组
    load: function(jsonArr){
        this.nodeJsonArr = jsonArr;
        timeline.removeCustomTime(this.timebarid);
        editor.reset();
        this.fouceFirst();
    }
};

