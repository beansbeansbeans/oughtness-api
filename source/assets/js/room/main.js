var util = require('../shared/util');
var sw = require('../socket');
var auth = require('../shared/auth');
var messages = require('./messages');
var Immutable = require('immutable');
var chatters = Immutable.List();
var sharedStorage = require('../shared/sharedStorage');
var h = require('virtual-dom/h');
var diff = require('virtual-dom/diff');
var patch = require('virtual-dom/patch');
var createElement = require('virtual-dom/create-element');

var getMsgHTML = function(msg) {
  return util.processTemplate({ 
    contents: msg.msg,
    user: msg.user.name
  }, 'message_partial');
};

var getUser = function() {
  var user = {name: "anonymous"};

  if(typeof sharedStorage.get("user") !== "undefined") {
    user = sharedStorage.get("user");
  }

  return user;
};

var sendMsg = function() {
  var msg = d.gbID("create-message-text").value;

  sw.socket.emit('my msg', {
    msg: msg,
    user: getUser()
  });

  d.gbID("create-message-text").value = "";
};

module.exports.initialize = function() {

  var msgList = d.qs('.messages-list');

  function render() {
    return h('ul.users', {
      style: {
        textAlign: 'center'
      }
    }, chatters.toJS().map(function(chatter) {
      return h('li.user', chatter.name);
    }));
  }

  var tree = render();
  var rootNode = createElement(tree);
  document.body.appendChild(rootNode); 

  sw.socket.on('user update', function(data) {
    chatters = chatters.merge(data);

    // update tree
    var newTree = render();
    var patches = diff(tree, newTree);
    rootNode = patch(rootNode, patches);
    tree = newTree;

    // update chatters with images
    chatters.toJS().forEach(function(chatter, chatterIndex) {
      if(chatter.facebookId && !chatter.url) {
        auth.getAvatar(chatter.facebookId, function(result) {
          chatters = chatters.update(chatterIndex, x => x.set('url', result));
        });
      }
    });
  });

  sw.socket.on('new msg', function(msg) {
    msgList.innerHTML += getMsgHTML(msg);
  });

  sw.socket.on('seed messages', function(msgs) {
    if(msgs.length) {
      var html = "";
      msgs.forEach(function(item) {
        html += getMsgHTML(item.message);
      });
      msgList.innerHTML += html;
    }
  });

  d.gbID("send-message-button").addEventListener("click", sendMsg);
};