var ObjectId = require('mongojs').ObjectId;

exports.createVote = function(req, res, client, cb) {
  var cause0id = req.body.causes[0].id;
  var cause1id = req.body.causes[1].id;
  var update = { $inc: {} };
  var query = { dimension: req.body.dimension };
  var entry = { 
    dimension: req.body.dimension,
    causes: {}
  };

  query['causes.' + cause0id] = {$exists: true};
  query['causes.' + cause1id] = {$exists: true};

  if(req.body.causes[0].won) {
    update['$inc']['causes.' + cause0id] = 1;
    entry.causes[cause0id] = 1;
  } else {
    entry.causes[cause0id] = 0;
  }

  if(req.body.causes[1].won) {
    update['$inc']['causes.' + cause1id] = 1;
    entry.causes[cause1id] = 1;
  } else {
    entry.causes[cause1id] = 0;
  }

  return client.update(query, update).then(function(status, arg) {
    if(status.n) { return; }
    return client.insert(entry);
  });
};

exports.getCauses = function(client, fn) {
  return client.find().toArray().then(fn);
};

exports.getDimensions = function(client, fn) {
  return client.find().toArray().then(fn);
}
