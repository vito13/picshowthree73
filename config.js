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

    addDefaultNode: function(){
        var items = new vis.DataSet();
        for (var m=0; m<4; ++m){
            var item = {
                id: m,
                start: Date.now()
            };
            this.addNode(item);
            items.add(item);
        }
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
            this.selTargetMesh.position.copy(node.value.mesh.position);
            this.selTargetMesh.rotation.copy(node.value.mesh.rotation);
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
                p.copy( this.curve.getPoint( i /  ( this.ARC_SEGMENTS - 1 ) ) );
            }
            this.curve.mesh.geometry.verticesNeedUpdate = true;
        }
    }
};

