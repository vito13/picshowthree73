/**
 * Created by Administrator on 2016/3/1 0001.
 */

var NODEINDEX = 0;
var STARTTIME = Date.now();

var camNodeMgr = {
    camNodeArr: [],
    // 添加节点
    pushNode: function(item){
        var r = new Object();
        r.index = NODEINDEX++;
        r.id = item.id;
        r.pos = new THREE.Vector3();
        r.look = new THREE.Vector3();
        r.start = item.start;
        this.camNodeArr.push(r);
    },

    // 获取节点
    getNode: function(item){
        for(k in this.camNodeArr){
            if(this.camNodeArr[k].id === item.id){
                return this.camNodeArr[k];
            }
        }
        return null;
    },
    // 从时间轴定位到编辑器
    focus2edit: function(id){

    },
    // 从编辑器定位到时间轴
    focus2time: function(){

    },
    // 更新节点时间
    updateTime: function(item){
        var node = this.getNode(item);
        if(node){
            node.start = item.start;
        }
    },
    // 根据时间轴节点顺序重新对数组排序
    resort: function(){
        function comparebystart(v1, v2){
            if(v1.start > v2.start){
                return 1;
            } else if(v1.start < v2.start){
                return -1;
            } else{
                return 0;
            }
        }
        this.camNodeArr.sort(comparebystart);
        //this.camNodeArr.forEach(function(item){
        //    console.log(item.start);
        //})
    }


};
