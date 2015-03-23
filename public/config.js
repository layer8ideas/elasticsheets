
var prod_levels = ["Dev","Prod","Staging","Test", "UAT1","UAT2","UAT3"];

var ws_types = ["HTTP(S)","Internal VIP","DNS","Database Load Balancing","SSH / SFTP","SMTP"];
var rs_types = ["Linux DNS Server","Firewall","Cisco ASA","Network Device","F5","IDS Server","WhatsUp","ETL Server","MongoDB Server","Windows Web Server","Nagios Server","Sharepoint Server","Switch","Router","Windows Server","Log Server","Linux Server","MySQL Server","Dell SonicWALL","AAA Server","Exchange Server","Barracuda","Domain Controller","Cisco ACS","Abstract ETL Server","Load Balancer","MSSQL Server","Kiosk VM Linux Server","Dell Secure Remote Access","Tomcat/Apache Server","Cisco CSS","Amazon Linux Server","Access Point","Barracuda WAF"];

/*
 *  Once a column has been defined, it cannot be removed or have it's type changed unless you intend to "clean"
 */


(function(exports){

	exports.elasticsearch = {
			host: 'localhost:9200',
//			log: 'trace'
	};

	exports.index_id = "sheets";

	exports.max_filter_options = 25;

	exports.sheets = [
	                  { 
	                	
	                	  id: "rs",
	                	  header: "Servers", 
	                	  icon: "fa-building",
	                	  columns: [
	                	            labelColumn("label", "Label", {icon: "fa-building"}),
	                	            optionsColumn("IS_RS_TYPE", "Type", { options:rs_types } ),
	                	            textColumn("NETWORK_ADDRESS", "Hostname", {width:250}),
	                	            textColumn("DESCRIPTION", "Description"),
	                	            textColumn("NOTES_TEXT", "Notes"),
	                	            lookupColumn("IS_IN_ENVIRONMENT_out", "In Environment", "environment", { drop_down:true , lookup_id:"IS_IN_ENVIRONMENT_in"}),
	                	            lookupColumn("IS_IN_DATACENTRE_out", "Datacentre", "datacentre", { drop_down:true, lookup_id:"IS_IN_DATACENTRE_in" } ),
	                	            lookupColumn("IS_HOSTED_ON_REAL_SERVER_in", "Hosts", "ws", {lookup_multi:true, width:300, lookup_id:"IS_HOSTED_ON_REAL_SERVER_out"} ),
	                	            lookupColumn("IS_MONITORED_BY_NAGIOS_SERVER_out", "Nagios Server", "rs", { lookup_id:"IS_MONITORED_BY_NAGIOS_SERVER_in" } ),
	                	            lookupColumn("IS_MONITORED_BY_NAGIOS_SERVER_in", "Monitors", null, {lookup_multi:true, lookup_id:"IS_MONITORED_BY_NAGIOS_SERVER_out", hidden:true } ),

	                	            ],
	                	   contextmenu: ['Log', 'SSH', 'RDP'],
	                  	   contextmenuclicked: function(id, obj){
	                  		   if (id === 'Log') { 
	                  			   console.log(id, obj) 
	                  			   webix.message("Information about '" +obj.label+ "' has been logged to console")
	                  		   } else if (id === 'SSH'){
	                  			   window.location.assign("ssh://" + obj.NETWORK_ADDRESS)
	                  		   }  else if (id === 'RDP'){
	                  			   window.location.assign("rdp://" + obj.NETWORK_ADDRESS)
	                  			   
	                  		   }
	                  	   }
	                  },
	                  { 
	                	  id: "ws",
	                	  header: "Web Services", 
	                	  icon: "fa-sitemap",
	                	  columns: [  

	                	            labelColumn("label", "Label", {icon: "fa-sitemap"}),
	                	            optionsColumn("IS_WS_TYPE", "Type", { options:ws_types, drop_down:true, } ),
	                	            textColumn("_GLB_DNS_NAME", "External Hostname", {width:250}),
	                	            textColumn("NETWORK_ADDRESS", "Internal Hostname", {width:250}),
	                	            textColumn("PUBLIC_IP", "Public IP"),
	                	            lookupColumn("IS_IN_DATACENTRE_out", "Datacentre", "datacentre", { drop_down:true, lookup_id:"IS_IN_DATACENTRE_in" } ),
	                	            lookupColumn("IS_PART_OF_PRODUCT_out", "Product", "product", {  lookup_id:"IS_PART_OF_PRODUCT_in"} ),
	                	            optionsColumn("HAS_PROD_LEVEL", "Prod Level", { options:prod_levels, drop_down:true, } ),
	                	            lookupColumn("IS_IN_ENVIRONMENT_out", "In Environment", "environment", {drop_down:true, lookup_id:"IS_IN_ENVIRONMENT_in"}),
	                	            lookupColumn("IS_HOSTED_ON_REAL_SERVER_out", "Hosted On", "rs", {lookup_multi:true, width:300, lookup_id:"IS_HOSTED_ON_REAL_SERVER_in"} ),
	                	            lookupColumn("DEPEND_ON_OTHER_SERVICE_out", "Depends On Service", "ws", {lookup_multi:true,width:300, lookup_id:"DEPEND_ON_OTHER_SERVICE_in"} ),
	                	            lookupColumn("DEPEND_ON_OTHER_SERVICE_in", "Service Depends On Me", "ws", {lookup_multi:true,width:300, lookup_id:"DEPEND_ON_OTHER_SERVICE_out"} ),
	                	            textColumn("notes", "Notes"),
	                	            { id:"url", header: "URL", editor:"text", template:function(obj){ if(obj.url) return "<a  href='" + obj.url + "'>" + obj.url + "</a>"; else return ""; }, width:150 },

	                	            lookupColumn("IS_MONITORED_BY_NAGIOS_SERVER_out", "Nagios Server", "rs", { lookup_id:"IS_MONITORED_BY_NAGIOS_SERVER_in" } ),
	                	            ]

	                  },
	                  { 
	                	  id: "datacentre",
	                	  header: "Datacentres", 
	                	  icon: "fa-home",
	                	  columns: [  
	                	            labelColumn("label", "Label", {icon: "fa-home"}),
	                	            lookupColumn("IS_IN_DATACENTRE_in", "Has", null, {lookup_multi:true, lookup_id:"IS_IN_DATACENTRE_out", hidden:true } ),
	                	            textColumn("DESCRIPTION", "Description", {width:1000}),
	                	            ]

	                  },
	                  { 
	                	  id: "environment",
	                	  header: "Environments", 
	                	  icon: "fa-cloud",
	                	  columns: [  
	                	            labelColumn("label", "Label", {icon: "fa-cloud"}),
	                	            lookupColumn("IS_IN_ENVIRONMENT_in",  "Has", null, {lookup_multi:true, lookup_id:"IS_IN_ENVIRONMENT_out", hidden:true } ),
	                	            textColumn("DESCRIPTION", "Description", {width:1000}),
	                	            ]

	                  },
	                  { 
	                	  id: "product",
	                	  header: "Products", 
	                	  icon: "fa-pie-chart",
	                	  columns: [  
	                	            labelColumn("label", "Label", {icon: "fa-pie-chart"}),
	                	            lookupColumn("IS_PART_OF_PRODUCT_in",  "Services", null, {lookup_multi:true, width:500, lookup_id:"IS_PART_OF_PRODUCT_out" } ),
	                	            textColumn("DESCRIPTION", "Description", {width:500}),
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

		if (overrides.drop_down == true){
			options.header = [label, {content:"serverSelectFilter"}];
			options.options = "/options/" + exports.index_id + "/" + options.lookup_type;
		} else {
			overrides.drop_down = false;
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

