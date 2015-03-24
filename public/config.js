
var prod_levels = ["Dev","Test","UAT","Staging","Prod"];

var ws_types = ["HTTP(S)","DNS","Database VIP","FTP","SMTP"];
var rs_types = ["Linux","Firewall","F5","Database","Switch","Router"];

/*
 *  Once a column has been defined, it cannot be removed or have it's type changed unless you intend to "clean"
 */

(function(exports){

	exports.elasticsearch = {
			host: 'localhost:9200',
			log: 'trace'
	};

	exports.index_id = "elasticsheets";

	exports.max_filter_options = 25;

	exports.sheets = [
	                  { 

	                	  id: "rs",
	                	  header: "Servers", 
	                	  icon: "fa-building",
	                	  columns: [
	                	            labelColumn("label", "Label", {icon: "fa-building"}),
	                	            optionsColumn("type", "Type", { options:rs_types } ),
	                	            textColumn("hostname", "Hostname", {width:250}),
	                	            textColumn("description", "Description"),
	                	            lookupColumn("datacentre", "Datacentre", "datacentre", { drop_down:true } ),
	                	            lookupColumn("hosts", "Hosts", "ws", {lookup_multi:true, width:300} ),

	                	            ],


	                	            contextmenu: ['Dump'],
	                	            contextmenuclicked: function(id, obj){
	                	            	console.log(obj);
	                	            }

	                  },
	                  { 
	                	  id: "ws",
	                	  header: "Web Services", 
	                	  icon: "fa-sitemap",
	                	  columns: [  
	                	            labelColumn("label", "Label", {icon: "fa-sitemap"}),
	                	            textColumn("url", "URL", {template:function(obj){ if(obj.url) return "<a  href='" + obj.url + "'>" + obj.url + "</a>"; else return ""; }, width:250}),
	                	            optionsColumn("type", "Type", { options:ws_types, drop_down:true, } ),
	                	            textColumn("ihostname", "Internal Hostname", {width:250}),
	                	            textColumn("ehostname", "External Hostname"),
	                	            lookupColumn("product", "Product", "product"),
	                	            optionsColumn("prodlevel", "Prod Level", { options:prod_levels, drop_down:true, } ),
	                	            lookupColumn("hosts", "Hosted On", "rs", {lookup_multi:true, width:300} ),
	                	            lookupColumn("depends_on_other", "Depends On Service", "ws", {lookup_multi:true,width:300, lookup_id:"other_depends_on_me"} ),
	                	            lookupColumn("other_depends_on_me", "Service Depends On Me", "ws", {lookup_multi:true,width:300, lookup_id:"depends_on_other"} ),
	                	            textColumn("desc", "Description"),
	                	            textColumn("notes", "Notes")
	                	            ]

	                  },
	                  { 
	                	  id: "datacentre",
	                	  header: "Datacentres", 
	                	  icon: "fa-home",
	                	  columns: [  
	                	            labelColumn("label", "Label", {icon: "fa-home"}),
	                	            lookupColumn("datacentre", "Has", null, {lookup_multi:true, hidden:true } ),
	                	            textColumn("desc", "Description", {width:1000}),
	                	            ],
	                	            contextmenu: ['Dump'],
	                	            contextmenuclicked: function(id, obj){
	                	            	console.log(obj);
	                	            }

	                  },
	                  { 
	                	  id: "product",
	                	  header: "Products", 
	                	  icon: "fa-pie-chart",
	                	  columns: [  
	                	            labelColumn("label", "Label", {icon: "fa-pie-chart"}),
	                	            lookupColumn("product",  "Services", null, {lookup_multi:true, width:500 } ),
	                	            textColumn("desc", "Description", {width:500}),
	                	            ]

	                  },

	                  ];


	/*
	 * No Need to Edit Below Here
	 */

	function labelColumn(id, label, overrides){

		var options = {width:250};
		options.template = function(obj){  
			return "<span class='webix_icon "+options.icon+"'></span><b>"+obj[id] + "</b>";
		}

		for (var key in overrides) {
			options[key] = overrides[key];
		}

		return textColumn(id, label, options);


	}

	function textColumn(id, label, overrides){

		var mapping = {
				"type": "string",
				"fields": {
					"raw":   { "type": "string", "index": "not_analyzed" },
					"lk":   { "type": "string", "analyzer": "lower_keyword" }
				}
		}

		var options = {id: id, header: [label, {content:"serverFilter"}] , editor:"text", mapping: mapping, width:150, sort:"server"};
		for (var key in overrides) {
			options[key] = overrides[key];
		}

		return options;

	}

	function optionsColumn(id, label, overrides){

		var mapping = {
				"type": "string",
				"fields": {
					"raw":   { "type": "string", "index": "not_analyzed" },
					"lk":   { "type": "string", "analyzer": "lower_keyword" }
				}
		}

		var options = {id: id, header: [label, {content:"serverFilter"}] , editor:"richselect", mapping: mapping, width:150, sort:"server"};
		for (var key in overrides) {
			options[key] = overrides[key];
		}

		return options;

	}


	function lookupColumn(id, label, type, overrides){

		var mapping = {
				"type" : "object",
				"properties": {
					"id" : {"type": "string", "index": "not_analyzed" },
					"label"  : {
						"type": "string",
						"fields": {
							"raw":   { "type": "string", "index": "not_analyzed" },
							"lk":   { "type": "string", "analyzer": "lower_keyword" }
						}
					}
				}
		}

		var options = {id: id, lookup:true, lookup_type:type, width:200, mapping: mapping, parseJSONStringValue:true, sort:"server"};

		if (overrides && overrides.drop_down == true){
			options.header = [label, {content:"serverSelectFilter"}];
			options.options = "/options/" + exports.index_id + "/" + options.lookup_type;
		} else {
			options.drop_down = false;
			options.header = [label, {content:"serverFilter"}];
		}

		options.opposingColumnId = function(){
			if (this.lookup_id) return this.lookup_id;
			else return this.id;
		}

		options.template = function(obj){  
			var display = "";
			if (obj[id] && obj[id].length > 0) {
				if (type && exports.sheets_by_id[type].icon){
					display += "<span style='color:#268fd5;' class='webix_icon "+exports.sheets_by_id[type].icon+"'></span>"; 
				}
				for (var i=0; i<obj[id].length; i++) {

					display += "<b>" + obj[id][i].label + "</b>"; 
					if (obj[id].length > i+1) display += ", ";

				}
				return display;
			}  else {
				return "";
			}
		}
		for (var key in overrides) {
			options[key] = overrides[key];
		}

		return options;

	}

	exports.columns_by_id = {};
	exports.sheets_by_id = {};

	for (i=0;i<exports.sheets.length;i++){

		var id = exports.sheets[i].id;

		exports.sheets_by_id[id] = exports.sheets[i];
		exports.sheets_by_id[id].index = i;

		exports.columns_by_id[id] = {};

		for (j=0;j<exports.sheets[i].columns.length;j++){
			var column = exports.sheets[i].columns[j];
			exports.columns_by_id[id][column.id] = column;
		}

	}




})(typeof exports === 'undefined'? this['config']={}: exports);

