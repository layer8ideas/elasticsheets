
var esService = require('../services/es_service');
var Q = require('q');
 
exports.search = function(req, res){
	
		in_ids = [];

	    Q(esService.createEdge(req.params.index_id, req.params.out_id, in_ids))
	    .then(function (data) {
	         res.send(data);       
	     }).fail(function(err) {
	    	 res.status(500).send(err);  
         }); 
	    
	};
	