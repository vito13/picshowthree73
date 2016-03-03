
var container = document.getElementById('timeline');
var options = {
    editable: true,
    type: 'point',

    onAdd: function (item, callback) {
        editorData.addNode(item, callback);
        // editorData.test();
        //camNodeMgr.pushNode(item);
        //console.log(node);

        //prettyPrompt('Add item', 'Enter text content for new item:', item.content, function (value) {
        //    if (value) {
        //        item.content = value;
        //item.start = node.start;
        //callback(item); // send back adjusted new item
        //    }
        //    else {
        //        callback(null); // cancel item creation
        //    }
        //});
    },

    onMove: function (item, callback) {
        editorData.updateTime(item, callback);
        //console.log('onMove', item);
        //camNodeMgr.updateTime(item);
        //camNodeMgr.resort();
        //var title = 'Do you really want to move the item to\n' +
        //    'start: ' + item.start + '\n' +
        //    'end: ' + item.end + '?';
        //
        //prettyConfirm('Move item', title, function (ok) {
        //    if (ok) {
        //        callback(item); // send back item as confirmation (can be changed)
        //    }
        //    else {
        //        callback(null); // cancel editing item
        //    }
        //});
    },

    onMoving: function (item, callback) {
        editorData.updateTime(item, callback);
        //if (item.start < min) item.start = min;
        //if (item.start > max) item.start = max;
        //if (item.end   > max) item.end   = max;

        //callback(item); // send back the (possibly) changed item
    },

    onUpdate: function (item, callback) {
        //prettyPrompt('Update item', 'Edit items text:', item.content, function (value) {
        //    if (value) {
        //        item.content = value;
                callback(item); // send back adjusted item
        //    }
        //    else {
        //        callback(null); // cancel updating the item
        //    }
        //});
    },

    onRemove: function (item, callback) {
        editorData.removeNode(item, callback);
        //prettyConfirm('Remove item', 'Do you really want to remove item ' + item.content + '?', function (ok) {
        //    if (ok) {
        //        callback(item); // confirm deletion
        //    }
        //    else {
        //        callback(null); // cancel deletion
        //    }
        //});
    },
};

var timeline = new vis.Timeline(container);
timeline.setOptions(options);

timeline.on('select', function (properties) {

    //console.log('select', properties);
    if(properties.items.length){
        editorData.setSelect(properties.items[0])
    }
});

//items.on('*', function (event, properties) {
//    logEvent(event, properties);
//});

function logEvent(event, properties) {
    var log = document.getElementById('log');
    var msg = document.createElement('div');
    msg.innerHTML = 'event=' + JSON.stringify(event) + ', ' +
    'properties=' + JSON.stringify(properties);
    log.firstChild ? log.insertBefore(msg, log.firstChild) : log.appendChild(msg);
}

function prettyConfirm(title, text, callback) {
    swal({
        title: title,
        text: text,
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: "#DD6B55"
    }, callback);
}

function prettyPrompt(title, text, inputValue, callback) {
    swal({
        title: title,
        text: text,
        type: 'input',
        showCancelButton: true,
        inputValue: inputValue
    }, callback);
}