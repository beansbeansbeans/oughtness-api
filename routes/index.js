var express = require('express');
var path = require('path');
var utils = require('../utils');
var cookie = require('cookie');
var moment = require('moment');

module.exports = Routes;

function Routes (app, ee) {
  var config = app.get('config');
  var client = app.get('mongoClient');
  var scenariosDB = client.collection('scenarios');
  var causesDB = client.collection('causes');
  var dimensionsDB = client.collection('dimensions');
  var votesDB = client.collection('votes');

  app.use(function (req, res, next) {
    console.log("hi", moment(Date.now(), 'x').format('MM-DD-YYYY h:m a'));
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin", "X-Requested-With, Content-Type", "Accept");
    next();
  });

  app.post('/vote', function(req, res) {
    utils.createVote(req, res, votesDB);
    res.sendStatus(200);
  });

  app.get('/vectors', function(req, res) {
    utils.getVectors(votesDB, dimensionsDB, causesDB, function(vectors) {
      res.json(vectors);
    });
  });

  app.get('/causes', function(req, res) {
    utils.getCauses(causesDB, function(causes) {
      res.json(causes);
    });
  });

  app.get('/dimensions', function(req, res) {
    utils.getDimensions(dimensionsDB, function(dimensions) {
      res.json(dimensions);
    });
  });
}