
var esService = require('../services/es_service');
var esGraph = require('../services/graph/es_graph');
var Q = require('q');
 
exports.search = function(req, res){

	Q(esService.search(req.params.index_id, req.params.type_id, req.query))
	    .then(function (data) {
	         res.send(data);       
	     }).fail(function(err) {
	    	 res.status(500).send(err);  
         }).done(); 
	    
	};
	
exports.options = function(req, res){

		Q(esService.options(req.params.index_id, req.params.type_id, req.query))
		    .then(function (data) {
		         res.send(data);       
		     }).fail(function(err) {
		    	 res.status(500).send(err);  
	         }).done(); 
		    
		};
	
exports.index = function(req, res){
	
	Q(esService.index(req.params.index_id, req.params.type_id, req.params.id, req.body))
		.then(esGraph.index(req.params.index_id, req.params.type_id, req.params.id, req.body))
	    .then(function (data) {
	         res.send(data);
	     }).fail(function(err) {
	    	 console.log(err.stack);
	    	 res.status(500).send(err);  
	     }).done();  
	    
	};
	
exports.del = function(req, res){
	console.log("del");	
	
		Q(esGraph.del(req.params.index_id, req.params.type_id, req.params.id, req.body))
			.then(esService.del(req.params.index_id, req.params.type_id, req.params.id, req.body))
		    .then(function (data) {
		         res.send(data);
		     }).fail(function(err) {
		    	 console.log(err.stack);
		    	 res.status(500).send(err);  
		     }).done();  
		    
		};



