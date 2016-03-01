'use strict';

var loopback = require('loopback');
var globalClient = null;
var ds           = null;

module.exports = createDataSource;

function createDataSource(client) {
  globalClient = client;
  if (window.cordova) {
    document.addEventListener("deviceready", onDeviceReady, false);
  }
}

function onDeviceReady() {
  var sqliteConnector    = require('loopback-connector-cordova-sqlite');

  ds = loopback.createDataSource({
    connector    : sqliteConnector,
    file_name    : 'todo.sqlite',
    debug        : false
  });

  ds.on('connected', onConnected);
}

function onConnected() {
  globalClient.models.LocalTodo.attachTo(ds);
  globalClient.models.LocalTodo.getChangeModel().attachTo(ds);
  createSchema(ds);
};

function createSchema(ds) {
  ds.autoupdate(null, function (error) {
    if (error) {
      console.error("Error in automigrate!");
      console.error(error);
    }

    var event = new Event('connector-cordova-sqlite-ready');
    document.dispatchEvent(event);
  });
}

