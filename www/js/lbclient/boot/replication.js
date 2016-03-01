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
      return this._isConnected;
    },
    set isConnected(value) {
      return this._isConnected = value;
    }
  };

  // setup model replication
  var since = { push: -1, pull: -1 };
  function sync(cb) {
    if (client.network.isConnected) {
      LocalTodo.replicate(
        since.push,
        RemoteTodo,
        function pushed(err, conflicts, cps) {
          err && console.error(JSON.stringify(err));
          since.push = cps;
          RemoteTodo.replicate(
            since.pull,
            LocalTodo,
            function pulled(err, conflicts, cps) {
              err && console.error(JSON.stringify(err));
              since.pull = cps;
              if (cb) cb();
            });
        });
    }
    else {
      console.warn('Cowardly refusing sync because we\`re not connected');
    }
  }

  // sync local changes if connected
  LocalTodo.observe('after save', function(ctx, next) {
    next();
    sync();
  });
  LocalTodo.observe('after delete', function(ctx, next) {
    next();
    sync();
  });

  client.sync = sync;

  client.getReadableModelId = function(modelId) {
    return proquint.encode(new Buffer(modelId.substring(0, 8), 'binary'));
  };
};
