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

exports.getVectors = function(votes, dimensions, causes, fn) {
  var result = [], dimensionRecords = [], voteRecords;

  votes.find().toArray().then(function(records) {
    voteRecords = records;
    return;
  }).then(function() {
    return dimensions.find().toArray();
  }).then(function(records) {
    dimensionRecords = records;
    return records.forEach(function(dimension) {
      result.push({
        dimension: dimension._id,
        causes: {}
      });
    });
  }).then(function() {
    return causes.find().toArray();
  }).then(function(records) {
    return result.forEach(function(dimension, i) {
      records.forEach(function(cause) {
        result[i].causes[cause._id] = {};

        records.forEach(function(nestedCause) {
          if(nestedCause._id !== cause._id) {
            // here we look it up within votes
            result[i].causes[cause._id][nestedCause._id] = 0;
          }
        });
      });
    });
  }).then(function() {
    fn(result);
  });
};

exports.getCauses = function(client, fn) {
  return client.find().toArray().then(fn);
};

exports.getDimensions = function(client, fn) {
  return client.find().toArray().then(fn);
}
