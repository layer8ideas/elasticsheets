
var config = require('../public/config.js');
var esService = require('./es_service');
var configTest = require('./config_test');
var Q = require('q');

function init() {
	
	var configTestResult = configTest.init();
	if (configTestResult) return Q.reject(configTestResult);
	
	return esService.init();
}


exports.init = init;