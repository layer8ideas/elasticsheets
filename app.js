
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes/index');
var rest = require('./routes/rest');
var http = require('http');
var path = require('path');
var Q = require('q');

var app = express();

var initializer = require('./services/initializer');

//	all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}

app.get('/', routes.index);

app.post('/index/:index_id/:type_id/', rest.index);
app.put('/index/:index_id/:type_id/:id', rest.index);
app.del('/index/:index_id/:type_id/:id', rest.del);

app.get('/search/:index_id/:type_id', rest.search);
app.get('/options/:index_id/:type_id', rest.options);


Q(initializer.init()).then(function (data) {
	
	http.createServer(app).listen(app.get('port'), function(){
		console.log('ElasticSheets server listening on port ' + app.get('port'));
	});
	
}).fail(function(err) {
	console.log('ElasticSheets server could not start: ', err);
}).done(); 

