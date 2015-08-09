var Jmat = require('./jmat');
var ObjectId = require('mongojs').ObjectId;
var _ = require('underscore');

// CORRECT RESULT: https://en.wikipedia.org/wiki/Analytic_hierarchy_process_%E2%80%93_leader_example (by experience)
// console.log(Jmat.eig(Jmat.Matrix([[1, 0.25, 4], [4, 1, 9], [0.25, 0.11, 1]])).v.e);

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
  var result = [], 
    dimensionRecords = [], 
    voteRecords;

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
        causes: [],
        results: []
      });
    });
  }).then(function() {
    return causes.find().toArray();
  }).then(function(records) {
    return result.forEach(function(dimension, i) {
      var votesForDimension = voteRecords.filter(function(d) {
        return d.dimension == dimensionRecords[i]._id;
      });

      records.forEach(function(_, causeIndex) {
        var row = new Array(records.length);
        row[causeIndex] = 1;
        result[i].causes.push(row);
      });

      records.forEach(function(cause, causeIndex) {
        records.forEach(function(nestedCause, nestedCauseIndex) {
          if(typeof result[i].causes[causeIndex][nestedCauseIndex] !== 'undefined') { return; }

          var matchingVote = _.find(votesForDimension, function(vote) {
            return typeof vote.causes[cause._id] !== 'undefined' && typeof vote.causes[nestedCause._id] !== 'undefined';
          });

          result[i].causes[causeIndex][nestedCauseIndex] = 0;
          result[i].causes[nestedCauseIndex][causeIndex] = 0;

          if(matchingVote) {
            sum = matchingVote.causes[cause._id] + matchingVote.causes[nestedCause._id];
            if(sum !== 0) {
              result[i].causes[causeIndex][nestedCause] = matchingVote.causes[cause._id] / sum;
              result[i].causes[nestedCauseIndex][causeIndex] = matchingVote.causes[nestedCause._id] / sum;
            }
          }
        });
      });

      var eigenVectors = Jmat.eig(Jmat.Matrix(result[i].causes)).v.e;
      eigenVectors.forEach(function(_, columnIndex) {
        result[i].results.push(eigenVectors[columnIndex][0].re);
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
