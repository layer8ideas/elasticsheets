
var esService = require('../services/es_service');
var esChildren = require('../services/es_children');
var esGraph = require('../services/es_graph');
var Q = require('q');
 
exports.search = function(req, res){

	Q(esGraph.search(req.params.index_id, req.params.type_id, req.query))
	    .then(function (data) { 
		return esChildren.search(req.params.index_id, req.params.type_id, req.query, data) })
	    .then(function (data) {
	         res.send(data);       
	     }).catch(function(err) {
		 console.log(err.stack);
	    	 res.status(500).send(err);  
         }).done(); 
	    
	};

exports.view = function(req, res){

	Q(esGraph.search(req.params.index_id, req.params.type_id, req.query))
	    .then(function (data) {
	         res.render(req.params.view, data);       
	     }).catch(function(err) {
		 console.log(err.stack);
	    	 res.status(500).send(err);  
         }).done(); 
	    
	};
	
exports.options = function(req, res){

	Q(esService.options(req.params.index_id, req.params.type_id, req.query))
	    .then(function (data) {
		 res.send(data);       
	     }).catch(function(err) {
		 console.log(err.stack);
		 res.status(500).send(err);  
	 }).done(); 
	    
	};
	
exports.index = function(req, res){
	
       	Q(esChildren.index(req.params.index_id, req.params.type_id, req.params.id, req.body))
		.then(function(child_response){
			return esService.index(req.params.index_id, req.params.type_id, req.params.id, req.body);
		}).then(function(index_response){
			return esGraph.index(req.params.index_id, req.params.type_id, req.params.id, req.body)
		 	.then(function (graph_response) { res.send(index_response); });		
		}).catch(function(err) {
		 	console.log(err.stack);
			res.status(500).send(err);  
		}).done();  
	    
	};
	
exports.del = function(req, res){
	
	Q(esGraph.del(req.params.index_id, req.params.type_id, req.params.id, req.body))
	    .then(esService.del(req.params.index_id, req.params.type_id, req.params.id, req.body))
	    .then(function (data) {
		 res.send(data);
	     }).catch(function(err) {
		 console.log(err.stack);
		 res.status(500).send(err);  
	     }).done();  
	    
	};

