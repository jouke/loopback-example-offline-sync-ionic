'use strict';

// TODO(bajtos) Move the bi-di replication to loopback core,
// add model settings to enable the replication.
// Example:
//  LocalTodo: { options: {
//    base: 'Todo',
//    replicate: {
//      target: 'Todo',
//      mode: 'push' | 'pull' | 'bidi'
//    }}}
var proquint = require('proquint');

module.exports = function(client) {
  var LocalTodo = client.models.LocalTodo;
  var RemoteTodo = client.models.RemoteTodo;

  client.network = {
    _isConnected: true,
    get isConnected() {
      console.log('isConnected?', this._isConnected);
      return this._isConnected;
    },
    set isConnected(value) {
      this._isConnected = value;
    }
  };

  // setup model replication
  var since = { push: -1, pull: -1 };
  function sync(cb) {
    console.log('syncing')
    LocalTodo.replicate(
      since.push,
      RemoteTodo,
      function pushed(err, conflicts, cps) {
        console.log(err, conflicts, cps);
        since.push = cps;
        RemoteTodo.replicate(
          since.pull,
          LocalTodo,
          function pulled(err, conflicts, cps) {
            console.log(err, conflicts, cps);
            since.pull = cps;
            if (cb) cb();
          });
      });
  }

  // sync local changes if connected
  LocalTodo.on('after save', function(ctx, next) {
    console.log('after save');
    next();
    console.log('syncing');
    sync();
    console.log('synced');
  });
  LocalTodo.on('after delete', function(ctx, next) {
    next();
    sync();
  });

  client.sync = sync;

  client.getReadableModelId = function(modelId) {
    return proquint.encode(new Buffer(modelId.substring(0, 8), 'binary'));
  };
};
