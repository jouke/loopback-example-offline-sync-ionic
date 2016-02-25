var buildClientBundle = require('./build');

var done = function(err) {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  else {
    process.exit(0);
  }
}

buildClientBundle(process.env.NODE_ENV || 'development', done);
