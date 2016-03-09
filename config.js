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
    controlPointArr: null,
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
        this.nodeArr[2].mesh.rotation.x = 0.5 * Math.PI;
        timeline.setItems(items);
    },

    resetData: function (){

        //var ptarr = [
        //    new THREE.Vector3(0, 0, 0),
        //    new THREE.Vector3(200, 100, 0),
        //    new THREE.Vector3(300, 0, 0),
        //    new THREE.Vector3(500, 100, 0)
        //];
        //var curve = new THREE.CatmullRomCurve3(ptarr);
        //var templateLine = new THREE.Geometry();
        //for ( var i = 0; i < this.ARC_SEGMENTS; i ++ ) {
        //    templateLine.vertices.push( new THREE.Vector3() );
        //}
        //curve.mesh = new THREE.Line(this.templateLine, new THREE.LineBasicMaterial( {
        //    color: 0xff0000,
        //    opacity: 0.35,
        //    linewidth: 2
        //}));
        //var curveArr = curve.getPoints(this.ARC_SEGMENTS);
        //var curveLenArr = curve.getLengths(this.ARC_SEGMENTS);
        //var curveLenArr2 = curve.getLengths(4);



        //this.ptArr = new Array();
        //this.templateSphere = new THREE.SphereGeometry(2, 16, 8 );
        //for(var m=0; m<this.ARC_SEGMENTS; ++m){
        //    var pt = new THREE.Mesh(this.templateSphere.clone(), new THREE.MeshBasicMaterial({ color: 0xff0040, wireframe: true }));
        //    this.ptArr.push(pt);
        //    editor.scene.add(pt);
        //}

        // radiusAtTop, radiusAtBottom, height, segmentsAroundRadius, segmentsAlongHeight,
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
        this.addDefaultNode();
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
    // 添加节点
    addNode: function (item, callback) {
        item.content = '' + this.NODEINDEX++;
        // item.start = Date.now();
        if("number" !== typeof item.start){
            item.start = Date.parse(item.start);
        }

        var mesh = new THREE.Mesh(this.templateCube, new THREE.MeshLambertMaterial({
            color: Math.random() * 0xffffff, wireframe: false}));
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
    // 获取当前时间轴时间毫秒
    getCustomTime: function(){
        var time = timeline.getCustomTime(this.timebarid);
        var ms = time.getTime();
        return ms;
    },
    play2Right: function(){
        var date = this.getCustomTime();
        var pair = this.getKeyPoint(date);
        if(pair.right){
            this.stop();

            var value = {t: date};
            var target = {t: pair.right.start};
            this.cameraTween = new TWEEN.Tween(value).to(target, Math.abs(target.t - value.t));
            this.cameraTween.onUpdate(function(){
                editorData.setCustomTime(value.t);
            });
            this.cameraTween.delay(0);
            this.cameraTween.onComplete(function(){
                editorData.play2Right();
            });
            this.cameraTween.start();
        }
    },
    play2Left: function(){
        var date = this.getCustomTime();
        var canPlay = date > this.nodeArr[0].start;
        if(canPlay){
            this.stop();
            var value = {t: Date.parse(date)};
            var target = {t: this.nodeArr[0].start - this.playEndTimeLong};
            this.cameraTween = new TWEEN.Tween(value).to(target, Math.abs(target.t - value.t));
            this.cameraTween.onUpdate(function(){
                editorData.setCustomTime(value.t);
            });
            this.cameraTween.delay(0);
            this.cameraTween.onComplete(function(){
            });
            this.cameraTween.start();
        }
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
        if(date < this.nodeArr[0].start){
            pair.left = null;
            pair.right = this.nodeArr[0];
        } else if(date > this.nodeArr[this.nodeArr.length-1].start){
            pair.left = this.nodeArr[this.nodeArr.length-1];
            pair.right = null;
        } else {
            for (var m = 0; m < this.nodeArr.length - 1; ++m) {
                if(date == this.nodeArr[m].start ||
                    date > this.nodeArr[m].start && date < this.nodeArr[m+1].start){
                    pair.left = this.nodeArr[m];
                    pair.right = this.nodeArr[m+1];
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
           /*
            var timelong = this.nodeArr[this.nodeArr.length - 1].start - this.nodeArr[0].start;
            var timenow = date - this.nodeArr[0].start;
            var d = timenow / timelong;
            // 位置
            var pt = this.curve.getPoint(d);
            // 角度
            var rot = new THREE.Euler();
            var pair = this.getKeyPoint(date);

            var timelong = pair.right.start - pair.left.start;
            var timenow = date - pair.left.start;
            var d = timenow / timelong;

            var rotlongx = pair.right.mesh.rotation.x - pair.left.mesh.rotation.x;
            var rotlongy = pair.right.mesh.rotation.y - pair.left.mesh.rotation.y;
            var rotlongz = pair.right.mesh.rotation.z - pair.left.mesh.rotation.z;

            rot.set(pair.left.mesh.rotation.x + rotlongx * d,
                    pair.left.mesh.rotation.y + rotlongy * d,
                    pair.left.mesh.rotation.z + rotlongz * d,
                    "XYZ"
            );

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
*/
            //console.log(result.pos);
            editor.updateViewCameraPosition(result.pos);
            editor.updateViewCameraRotation(result.rot);
            this.updateTargetMesh(result.pos, result.rot);
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

    save: function(){
        for ( var i = 0; i < this.nodeArr.length; i ++ ) {

            p = splineHelperObjects[ i ].position;
            strplace.push( 'new THREE.Vector3({0}, {1}, {2})'.format( p.x, p.y, p.z ) )
        }
        console.log( strplace.join( ',\n' ) );
        var code = '[' + ( strplace.join( ',\n\t' ) ) + ']';
        prompt( 'copy and paste code', code );
    },

    load: function(){

    }
};

