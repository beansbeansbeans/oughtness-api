var express = require('express');
var path = require('path');
var utils = require('../utils');
var cookie = require('cookie');

module.exports = Routes;

function Routes (app, ee) {
  var config = app.get('config');
  var client = app.get('mongoClient');
  var scenariosDB = client.collection('scenarios');
  var causesDB = client.collection('causes');
  var votesDB = client.collection('votes');

  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type");
    next();
  });

  app.post('/vote', function(req, res) {
    utils.validateScenarioExists(req, res, scenariosDB, function(record) {
      if(record) {
        utils.createVote(req, res, votesDB, function() {
          res.sendStatus(200);
        });
      } else {
        res.sendStatus(500);
      }
    });
  });

  app.get('/causes', function(req, res) {
    utils.getCauses(causesDB, function(causes) {
      res.json(causes);
    });
  });
}