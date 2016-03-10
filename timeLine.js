
var container = document.getElementById('timeline');
var options = {
    editable: true,
    type: 'point',

    onAdd: function (item, callback) {
        editorData.addNode(item, callback);
    },

    onMove: function (item, callback) {
        editorData.updateTime(item, callback);
    },

    onMoving: function (item, callback) {
        editorData.updateTime(item, callback);
    },

    onUpdate: function (item, callback) {
        callback(item);
    },

    onRemove: function (item, callback) {
        editorData.removeNode(item, callback);
    }
};

var timeline = new vis.Timeline(container);
timeline.setOptions(options);

timeline.on('select', function (properties) {
    if(properties.items.length){
        editorData.setSelect(properties.items[0])
    }
});
timeline.on('timechange', function (properties) {
    editorData.interpolation();
});
timeline.on('timechanged', function (properties) {
});
container.onclick = function (event) {
};
