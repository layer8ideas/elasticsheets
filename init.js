var Q = require('q');

var initializer = require('./services/initializer');

Q(initializer.init()).then(function (data) {
	console.log('ElasticSheets Initialization Complete');
	process.exit(1);
}).fail(function(err) {
	console.log('ElasticSheets Initialization Failed : ', err);
	process.exit(1);
}).done(); 

