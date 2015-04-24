/**
 * ElasticSearch
 */

var config = require('../public/config.js');
var elasticsearch = require('elasticsearch');
var Q = require('q');

var client = new elasticsearch.Client({
	host: config.elasticsearch.host,
	log: config.elasticsearch.log,
});

var mappings = {};

var default_dynamic_templates = [ {
	  "string_fields" : {
	    "match" : "*",
	    "match_mapping_type" : "string",
	    "mapping" : {
	      "type" : "string", "index" : "analyzed", "omit_norms" : true,
	      "fields" : {
		"raw" : {"type": "string", "index" : "not_analyzed"}
	      }
	    }
	  }
	} ];


for (i=0;i<config.sheets.length;i++){

	var sheet = config.sheets[i];

	mappings[sheet.id] = {};
	mappings[sheet.id].dynamic_templates = default_dynamic_templates;
	mappings[sheet.id].properties = {};

	for (j=0;j<sheet.columns.length;j++){
		var column = sheet.columns[j];
		// setting a mapping to null manually prevents it from being created
		if (column.mapping) mappings[sheet.id].properties[column.id] = column.mapping;
	}

	// This INIT should (somehow) probably be moved to the child module
	if (sheet.child_types) {
	  for (c=0;c<sheet.child_types.length;c++){
		var child = sheet.child_types[c];
		mappings[child.id] = ( child.mapping ? cloneJSON(child.mapping) : { "dynamic_templates" : default_dynamic_templates } );
		mappings[child.id]["_parent"] = { "type" : sheet.id };
		
	  }

	}

	
}

var index_settings = {

		settings: {
			"number_of_shards": 5, 
			"analysis": {
				"analyzer": {
					"lower_keyword": {
						"type": "custom",
						"tokenizer": "keyword",
						"filter": "lowercase"
					}
				}

			}
		},

		mappings: mappings

}



function init() {

	var deferred = Q.defer();

	client.indices.exists({index : config.index_id}).then( function (exists) {

		if (!exists) {

			Q(createIndex()).then(function (body){
				deferred.resolve();
			}).fail(function(err) {
				return deferred.reject(err);
			})

		} else { 


			var remappings = [];
			for (var s=0;s<config.sheets.length;s++){
				remappings.push(putMappingForType(config.sheets[s].id));
				if (config.sheets[s].child_types) {
				 for (c=0;c<config.sheets[s].child_types.length;c++){
					var child = config.sheets[s].child_types[c];
				   	remappings.push(putMappingForType(child.id));	
				 }
				}
			}

			console.log("Index Exists - RaMapping...! [" + remappings.length + "]");

			// is there a better way to do this?
			Q.all(remappings).then(function (body){
				deferred.resolve();
			}).fail(function(err) {
				return deferred.reject(err);
			})

		}

	}, function (error) {
		return deferred.reject(error);
	});

	return  deferred.promise;

}


function createIndex() {

	var deferred = Q.defer();

	console.log("Index Does Not Exist.  Creating...",JSON.stringify(index_settings));

	client.indices.create({index: config.index_id, body: index_settings}).then(function (exists) {
		deferred.resolve();
	}, function (error) {
		return deferred.reject(error);
	});

	return  deferred.promise;


}


function putMappingForType(type) {

	var deferred = Q.defer();

	client.indices.putMapping({index: config.index_id, type: type, body: mappings[type]}).then(function (data) {

		console.log("..." + type);
		deferred.resolve();

	}, function (error) {
		console.log("Error ReMapping: " + type + "," + error);
		return deferred.reject(error);
	})

	return  deferred.promise;


}

function search(index_id, type_id, request_query) {

	console.log("Request handler 'search' was called.", index_id, type_id, request_query);

	var deferred = Q.defer();
	var search = {}

	search.sort = { };

	var position = 0;

	if (request_query.sort){
		for (var key in request_query.sort) {
			var config_column = config.columns_by_id[type_id][key];
			if (!config_column.id) continue;

			var property = key;

			if (config_column.lookup_type){
				property = key + ".label";
			}

			search.sort[property + ".raw"] = { "order": request_query.sort[key] }

		}
	}

	if (!search.sort.hasOwnProperty("label.raw")){
	 search.sort["label.raw"] = { "order": "asc" };
	}

	if (request_query.filter) {

		search.query = {};
		search.query.bool = {};
		search.query.bool.must = [];

		for (var key in request_query.filter) {

			var config_column = config.columns_by_id[type_id][key];
			if (!config_column.id) continue;

			if (request_query.filter[key] && request_query.filter[key] !== "") {

				var property = key;

				if (config_column.lookup_type){
					property = key + ".label";
				}

				if (config.columns_by_id[type_id][key].drop_down){

					var phrase = {};
					phrase['term'] = {};
					phrase['term'][property + ".raw"] = {}
					phrase['term'][property + ".raw"].value = request_query.filter[key];
					search.query.bool.must.push(phrase);

				} else {

					// This is of course where we could really take advantage of elasticsearch.. but how best to do it ??
					var phrase = {};
					phrase['wildcard'] = {};
					phrase['wildcard'][property + ".lk"] = {}
					phrase['wildcard'][property + ".lk"].value = "*" + request_query.filter[key].toLowerCase() + "*";
					search.query.bool.must.push(phrase);

				}

			}

		}

	}

	// Type Terms - Should be below the UI Filters ?
	//search.query.bool.must.push({ term : { _type : type_id } });

	if (request_query.start) {
		position = request_query.start;
		search.from = request_query.start;
	}

	if (request_query.count) {
		search.size = request_query.count;
	}

	client.search({
		type: type_id,
		index: index_id,
		version: true,
		body: search
	}).then(function (data) {

		var response = {};

		if (data.hits) {

			var results = [];
			var resultsArray = data.hits.hits;
			for (var i = 0; i < resultsArray.length; i++) {
				results[i] = resultsArray[i]._source ;
				results[i].id = resultsArray[i]._id;
				results[i].version = resultsArray[i]._version;
			}

			response.total_count = data.hits.total;
			response.data = results;

		} else {
			response.total_count = 0;
			response.data = [];
		}

		response.pos=position;

		deferred.resolve(response);


	}, function (error) {
		return deferred.reject(error);
	})


	return  deferred.promise;
}


function index(index_id, type_id, id, document) {

	console.log("Request handler 'index' was called.");

	var deferred = Q.defer();

	var type="update";


	if (!id){
		type="insert";
		id = generateUUID();	
	}

	for (var field in document){ 

		var config_column = config.columns_by_id[type_id][field];

		try {
			if (document[field].indexOf("[") === 0){
				document[field] = JSON.parse(document[field]);
			}
		} catch (e){

		}

	}

	console.log("Indexing " + JSON.stringify(document), index_id, type_id, id);

	client.index({

		index: index_id,
		type: type_id,
		id: id,
		version: document.version,
		body: document

	}).then(function (data) {

		var response;

		if (data.created) {
			
			response = {
				status: "success",
				newid: data._id,
				id: document.sid
			};
			console.log("Created", response);

		} else {
			
			response = document;
			response.version = data._version;
			console.log("Update", response);

		}

		deferred.resolve(response);

	}, function (error) {
		return deferred.reject(error);
	})

	return  deferred.promise;


}	

function del(index_id, type_id, id, document) {

	console.log("Request handler 'del' was called.");

	var deferred = Q.defer();

	client.delete({
		index: index_id,
		type: type_id,
		id: id,

	}, function (error) {
		return deferred.reject(error);
	})

	return  deferred.promise;


}

function bulk(request) {

	console.log("Request handler 'bulk' was called.");

	var deferred = Q.defer();

	client.bulk(request).then(function (data) {

		deferred.resolve({ status: "success" });

	}, function (error) {
		return deferred.reject(error);
	})

	return  deferred.promise;


}

function options(index_id, type_id, request_query) {

	console.log("Request handler 'options' was called.");

	var deferred = Q.defer();
	var search = {}

	search.sort = { 
			"label.raw": { "order": "asc" } ,
	};

	var search =  {
			"aggs" : {
				"options" : {
					"terms" : { "field" : "label.raw", "size": config.max_filter_options }
				}
			}
	};


	client.search({
		type: type_id,
		searchType:  "count",
		index: index_id,
		body: search
	}).then(function (data) {

		var results = [];

		if (data.aggregations && data.aggregations.options && data.aggregations.options.buckets) {

			var resultsArray = data.aggregations.options.buckets;
			for (var i = 0; i < resultsArray.length; i++) {
				results.push(resultsArray[i].key);
			}

		}


		deferred.resolve(results);


	}, function (error) {
		return deferred.reject(error);
	})


	return  deferred.promise;
}

function cloneJSON(obj){
  return JSON.parse(JSON.stringify(obj)); 
}

function generateUUID(){
	var d = new Date().getTime();
	var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = (d + Math.random()*16)%16 | 0;
		d = Math.floor(d/16);
		return (c=='x' ? r : (r&0x3|0x8)).toString(16);
	});
	return uuid;
};


exports.search = search;
exports.options = options;
exports.index = index;
exports.del = del;
exports.init = init;

