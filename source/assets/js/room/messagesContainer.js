var h = require('virtual-dom/h');
var mediator = require('../shared/mediator');
var messageLimit;

module.exports = {
  initialize(limit) {
    messageLimit = limit;
    mediator.subscribe("DID_RENDER", () => {
      var elem = document.querySelector('.messages');
      elem.scrollTop = elem.scrollHeight;
    });
  },
  render(dimensions, messages, chatters) {
    return h('div.messages-container', {
      style: {
        height: (dimensions.containerHeight - (dimensions.roomInfoHeight + dimensions.createMessageHeight)) + "px"
      }
    }, h('ul.messages', {
      style: {
        maxHeight: (dimensions.containerHeight - (dimensions.roomInfoHeight + dimensions.createMessageHeight)) + "px"
      }
    }, messages.sort((a, b) => {
      if(a.createdAt < b.createdAt) {
        return -1;
      } else if(a.createdAt > b.createdAt) {
        return 1;
      }
      return 0;
    }).filter((d, i) => { return i >= (messages.length - messageLimit)}).map((msg) => {
      var avatarURL, author = chatters.filter(x => x._id === msg.user._id)[0];

      if(author) { avatarURL = author.avatarURL; }

      return h('li.message', 
        [h('div.avatar', {
          style: {
            backgroundImage: 'url(' + avatarURL + ')'
          }
        }),
        h('div.contents', [
          h('div.attribution', [
            h('div.creator', msg.user.name),
            h('div.createdAt', moment(msg.createdAt).format('MMM/DD'))
          ]),
          h('div.text', msg.message.msg)
        ])
      ]);
    })));
  }
};