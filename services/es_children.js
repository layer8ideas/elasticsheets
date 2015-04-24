/*
 * Serves children with regular search results
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

function index(index_id, type_id, document_id, document) {

        if (document.children) delete document.children;
	return Q(true);

}

function search(index_id, type_id, request_query, data) {

	if (!config.sheets_by_id[type_id].child_types) return Q(data);

        var parent_ids = [];
        var parents = {};
        for (var p=0;p<data.data.length;p++) {
          parent_ids.push(data.data[p].id);
          parents[data.data[p].id] = data.data[p];
        }

	var deferred = Q.defer();
	var child_queries = [];

	for (var c in config.sheets_by_id[type_id].child_types) { 
		var child_type = config.sheets_by_id[type_id].child_types[c];
		child_queries.push(tack(data, index_id, type_id, child_type, parent_ids, parents)); 
	}

	console.log("Doing Child Queries");
	Q.all(child_queries).then(function(){
		deferred.resolve(data);
	}).fail(function(error){
		deferred.reject(error);
	});


	return deferred.promise;
 

}


function tack(response, index_id, parent_type_id, child_type, parent_ids, parents){

        var deferred = Q.defer();
	var child_type_id = child_type.id;
	var only_use_fields = child_type.only_use_fields;

        console.log("Getting ready to Query " + parent_type_id + "/ count of parents=" + parent_ids.length);

        var search = { query: { has_parent: { parent_type: parent_type_id, query : { terms : { _id : parent_ids } } } } };
        search.size = 10000000;
	if (child_type._source) search._source = child_type._source;

        client.search({
                type: child_type_id,
                index: index_id,
                body: search,
		fields: ['_parent','_source']
        }).then(function (data) {

                console.log("Child search returned hits: " + data.hits.hits.length);

                var doc_hash = {};
                for (var i=0;i<data.hits.hits.length;i++){
		  var hit = data.hits.hits[i];
		  var parent = hit.fields._parent;
		  if (!parents[parent].children) parents[parent].children = {};
		  var key = child_type.key ? hit._source[child_type.key] : child_type_id;
		  if (!parents[parent].children[key]) parents[parent].children[key] = [];
                  parents[parent].children[key].push(hit._source);
                }


                deferred.resolve();


        }, function (error) {
                console.log("Error during explode", error);
                return deferred.reject(error);
        })

	return deferred.promise;

}

exports.search = search;
exports.index = index;

