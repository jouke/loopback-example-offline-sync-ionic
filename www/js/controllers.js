angular.module('todo')
  .controller('TodoCtrl', function ($scope, $ionicModal, $stateParams, Todo, sync, network, getReadableModelId) {
    $scope.todos = [];
    $scope.editedTodo = null;
    $scope.showDeleteButtons = false;
    $scope.canSwipe = true;

    // sync the initial data
    sync(onChange);

    function onChange() {
      Todo.stats(function(err, stats) {
        if(err) return error(err);
        $scope.stats = stats;
      });
      Todo.find({
        where: $scope.statusFilter,
        sort: 'order DESC'
      }, function(err, todos) {
        $scope.todos = todos;
        $scope.$apply();
      });
    }

    function error(err) {
      console.error(err);
    }

    function errorCallback(err) {
      if(err) error(err);
    }

    Todo.observe('after save', function(ctx, next) {
      next();
      onChange();
      sync();
    });
    Todo.observe('after delete', function(ctx, next) {
      next();
      onChange();
      sync();
    });
    Todo.observe('after create', function(ctx, next) {
      next();
      sync();
    });


    $scope.editTodo = function (todo) {
      $scope.editedTodo = todo;
      $scope.todoModal.show();
    };

    $scope.saveTodoCompleted = function(todo) {
      todo.save();
    };

    $scope.doneEditing = function (todo) {
      $scope.editedTodo = null;
      todo.title = todo.title.trim();

      if (!todo.title) {
        $scope.removeTodo(todo);
      } else {
        todo.save();
      }
      $scope.todoModal.hide();
    };

    $scope.removeTodo = function (todo) {
      todo.remove(errorCallback);
    };

    // from the Angular demo app, not implemented (yet)
    //// Monitor the current route for changes and adjust the filter accordingly.
    //$scope.$on('$stateChangeSuccess', function () {
    //  var status = $scope.status = $stateParams.status || '';
    //  $scope.statusFilter = (status === 'active') ?
    //  { completed: false } : (status === 'completed') ?
    //  { completed: true } : {};
    //});
    //$scope.clearCompletedTodos = function () {
    //  Todo.destroyAll({completed: true}, onChange);
    //};
    //
    //$scope.markAll = function (completed) {
    //  Todo.find(function(err, todos) {
    //    if(err) return errorCallback(err);
    //    todos.forEach(function(todo) {
    //      todo.completed = completed;
    //      todo.save(errorCallback);
    //    });
    //  });
    //};
    //$scope.connected = function() {
    //  return network.isConnected;
    //};
    //
    //$scope.connect = function() {
    //  network.isConnected = true;
    //  sync();
    //};
    //
    //$scope.disconnect = function() {
    //  network.isConnected = false;
    //};

    $scope.sync = function() {
      sync();
    };


    Todo.on('conflicts', function(conflicts) {
      $scope.localConflicts = conflicts;

      conflicts.forEach(function(conflict) {
        conflict.type(function(err, type) {
          conflict.type = type;
          conflict.models(function(err, source, target) {
            conflict.source = source;
            conflict.target = target;
            conflict.manual = new conflict.SourceModel(source || target);
            $scope.$apply();
          });
          conflict.changes(function(err, source, target) {
            source.modelId = getReadableModelId(source.modelId);
            conflict.sourceChange = source;
            target.modelId = getReadableModelId(target.modelId);
            conflict.targetChange = target;
            $scope.$apply();
          });
        });
      });
    });

    $scope.resolveUsingSource = function(conflict) {
      conflict.resolveUsingSource(refreshConflicts);
    };

    $scope.resolveUsingTarget = function(conflict) {
      conflict.resolveUsingTarget(refreshConflicts);
    };

    $scope.resolveManually = function(conflict) {
      conflict.resolveManually(conflict.manual, refreshConflicts);
    };

    function refreshConflicts() {
      $scope.localConflicts = [];
      $scope.$apply();
      sync();
    }

    // Create and load the Modal
    $ionicModal.fromTemplateUrl('new-todo.html', function(modal) {
      $scope.todoModal = modal;
    }, {
      scope: $scope,
      animation: 'slide-in-up'
    });

    // Called when the form is submitted
    $scope.createTodo = function(todo) {
      Todo.create({title: todo.title})
        .then(function() {
          sync();
          $scope.$apply();
        });

      $scope.todoModal.hide();
      todo.title = "";
    };

    $scope.newTodo = function() {
      $scope.editedTodo = {title: ''};
      $scope.todoModal.show();
    };

    $scope.closeNewTodo = function() {
      $scope.todoModal.hide();
    };
  })
