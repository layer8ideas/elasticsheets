/*
 * Introduces/Ensures edge consistency on the indexed item & Adjacency
 */

var config = require('../public/config.js');
var esService = require('./es_service.js');
var graph = require('../public/lib/graph.js');
var elasticsearch = require('elasticsearch');
var Q = require('q');

var client = new elasticsearch.Client({
	host: config.elasticsearch.host,
	log: 'trace'//config.elasticsearch.log,
});

function search(index_id, type_id, request_query) {
	if (request_query.explode_columns) {

	  	var explodes = [];

        	var deferred = Q.defer();
	
          	Q(esService.search(index_id, type_id, request_query)).then(function (data) {

          		for (var column_id in request_query.explode_columns) { explodes.push(explode(data, index_id, type_id, column_id, request_query)); }
			console.log("Doing Explodes");

		 	Q.all(explodes).then(function(){
				deferred.resolve(data);
			}).fail(function(error){
				deferred.reject(error);
			});

         	})

		return deferred.promise;
 

	} else {
	  return esService.search(index_id, type_id, request_query);
	}
}

function explode(data, index_id, type_id, column_id, request_query){

        var deferred = Q.defer();

	var master = data.data;
	var adjacent_ids = [];

	console.log("Getting ready to Exploding " + type_id + "/" + column_id);
	for (var m=0;m<master.length;m++) { 
	  var master_doc = master[m];
	  if (!master_doc[column_id]) continue;
	  for (var i=0;i<master_doc[column_id].length;i++){
	    adjacent_ids.push(master_doc[column_id][i].id);
	  }
	}

	console.log("Exploding " + type_id + "/" + column_id);

	var config_column = config.columns_by_id[type_id][column_id];
        
        var search = { query : { terms : { _id : adjacent_ids } } };
	search.size = 10000000;

        client.search({
                type: [Object.keys(config.sheets_by_id)],
                index: index_id,
                body: search
        }).then(function (data) {

		var doc_hash = {};
		for (var i=0;i<data.hits.hits.length;i++){
		  var doc = data.hits.hits[i]._source;
		  doc_hash[doc.id] = doc;  
		}

		console.log("Ok, i have: " + Object.keys(doc_hash).length);

		for (var m=0;m<master.length;m++) { 
		  var master_doc = master[m];
		  if (!master_doc[column_id]) continue;
		  for (var i=0;i<master_doc[column_id].length;i++){
		    var search_id = master_doc[column_id][i].id
		    master_doc[column_id][i] = doc_hash[search_id];
		  }
		}

                deferred.resolve();


        }, function (error) {
		console.log("Error during explode", error);
                return deferred.reject(error);
        })


        return  deferred.promise;

}

function del(index_id, type_id, document_id, document){
	return index(index_id, type_id, document_id, {id:document.id, label:document.label});
}


function index(index_id, type_id, document_id, document) {
		
	if (!document_id) return Q(false);
	
	var checks = [];

	for (var field in config.columns_by_id[type_id]){ 

		var config_column = config.columns_by_id[type_id][field];

		if (!config_column){
			//console.log("Column is not configured - " + type_id + ":" + field);
			continue;
		}
		
		
		if (config_column.lookup){
			//console.log("Column is lookup type : " + config_column.id);

			if ( document[field] && document[field].length > 0 ) {
				
				//console.log("Column is lookup type and has Adjacency: " + config_column.id);
				
				var search = {};
				search.query = {};
				search.query.terms = {};
				search.query.terms._id = [];
				search.size = 10000;
				
				for (var i=0;i<document[field].length;i++){
					search.query.terms._id.push(document[field][i].id);
				}
				
				checks.push(checkKnownAdjacency(
					index_id,
					config_column,
					document,
					search
				));
			}

			var search = { query: { "term" : {} } };			
			search.query.term[config_column.opposingColumnId() + ".id"] = document_id;
			search.size = 10000;
			
			checks.push(checkUnknownAdjacency(
				index_id,
				config_column,
				document,
				search
			));
			

		}
		
	}
	
	return Q.all(checks);

}

function checkUnknownAdjacency(index_id, config_column, document, search){
		
	var deferred = Q.defer();

	var my_id = document.id;
	var my_label = document.label;


	//console.log("Searching for neighbors that have me in their stuff on column " + config_column.id);
	
	// this should be rewritten to be performed with 'scroll'
	//http://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html
	
	client.search({
		index: index_id,
		type: [Object.keys(config.sheets_by_id)],
		//scroll: '30s',
		body: search
	}).then(function (data) {

		var response = {};

		var updates = [];

		var results = [];
		var resultsArray = data.hits.hits;

		/* For each neighbor */
		for (var i = 0; i < resultsArray.length; i++) {

			var id = resultsArray[i]._id;
			var type = resultsArray[i]._type;
			var source = resultsArray[i]._source;
			var neighbor_edges = new graph.LookupColumnValue(source[config_column.opposingColumnId()]);
			var local_edges = new graph.LookupColumnValue(document[config_column.id]);

			if (!local_edges.has(id)){
				//console.log("My ("+document.label+") neighbor (" + source.label + ") has opposing column : " +config_column.opposingColumnId() + " but we don't have column: " + config_column.id );
				neighbor_edges.remove(my_id);
				source[config_column.opposingColumnId()] = neighbor_edges.toArray();
				updates.push(update(
					index_id,
					type,
					id,
					source
				))
			} else {
				//console.log("Edges are already correct for neighbor " + source.label + " on opposing column : " + config_column.opposingColumnId());				
			}

		}

		Q.all(updates).done(function () {
			deferred.resolve();
		});


	}, function (error) {
		return deferred.reject(error);
	})


	return  deferred.promise;
	
	
}

function checkKnownAdjacency(index_id, config_column, document, search){

	var deferred = Q.defer();

	var my_id = document.id;
	var my_label = document.label;

	client.search({
		index: index_id,
		body: search
	}).then(function (data) {

		var response = {};

		var updates = [];

		//if !(data.hits).contains(the ones we expect) {
		// what if the result wasn't found ?  Here is how we can have some eventual consistency for delete
			
		var results = [];
		var resultsArray = data.hits.hits;
		
		//console.log("Column has " + resultsArray.length + " neighbors: " + config_column.id );

		/* For each neighbor */
		for (var i = 0; i < resultsArray.length; i++) {

			var id = resultsArray[i]._id;
			var type = resultsArray[i]._type;
			var source = resultsArray[i]._source;
			var neighbor_edges = new graph.LookupColumnValue(source[config_column.opposingColumnId()]);

			if (!neighbor_edges.ensureCorrect(my_id, my_label)){
				//console.log("Edges are not correct for " + config_column.id + " on neighbor: " +id);
				source[config_column.opposingColumnId()] = neighbor_edges.toArray();
				updates.push(update(
					index_id,
					type,
					id,
					source
				))
			} else {
				//console.log("Edges are already correct for " + config_column.id);				
			}

		}

		Q.all(updates).done(function () {
			deferred.resolve();
		});


	}, function (error) {
		return deferred.reject(error);
	})


	return  deferred.promise;
}


function update(index_id, type_id, id, document){

	var deferred = Q.defer();
	var params = {
		index: index_id,
		type: type_id,
		id: id,
		body: document

	};
	
	client.index(params).then(function (data) {

		deferred.resolve(data);

	}, function (error) {
		return deferred.reject(error);
	})

	return  deferred.promise;

}


exports.search = search;
exports.index = index;
exports.del = del;


