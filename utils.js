var ObjectId = require('mongojs').ObjectId;

exports.createScenario = function(req, res, client) {
  return client.insert({
    identifier: req.body.identifier,
    text: req.body.text
  });
};

exports.createVote = function(req, res, client, cb) {
  return client.insert({
    dimension: req.body.dimension,
    causes: [
      {
        cause: req.body.causes[0].id,
        won: req.body.causes[0].won
      },
      {
        cause: req.body.causes[1].id,
        won: req.body.causes[1].won
      }
    ]
  }).then(cb);
};

exports.getCauses = function(client, fn) {
  return client.find().toArray().then(fn);
};

exports.getDimensions = function(client, fn) {
  return client.find().toArray().then(fn);
}

// FOR REFERENCE ONLY

exports.getRoomInfo = function(req, res, client, fn) { 
  return client.findOne({key: req.params.id}).then(fn)
    .catch(console.log.bind(console));
};

exports.getPublicRoomsInfo = function(client, fn) {
  return client.find().toArray().then(fn);
};

exports.findOrCreateUser = function(req, client) {
  return client.findOne({ facebookId: req.id }).then(function(user) {
    if(user) {
      return user;
    } else {
      var user = {
        facebookId: req.id,
        name: req.name
      };

      return client.insert(user);
    }
  });
};
