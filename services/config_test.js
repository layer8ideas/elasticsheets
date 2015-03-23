/**
 * Make sure the config looks right
 */

var config = require('../public/config.js');
var Q = require('q');

function init(){
	
	for (i=0;i<config.sheets.length;i++){
		
		var sheet = config.sheets[i].id;

		for (j=0;j<config.sheets[i].columns.length;j++){
			var column = config.sheets[i].columns[j];
			if (column.lookup_type && !config.columns_by_id[column.lookup_type]) {
				return "Sheet '" +  sheet + "', column '" + column.id + "' is configured as Lookup, so you must configure the matching specified sheet '" + column.lookup_type + "'";
			}
			if (column.lookup_type && !config.columns_by_id[column.lookup_type][column.opposingColumnId()]) {
				return "Sheet '" +  sheet + "', column '" + column.id + "' is configured as Lookup, so you must configure the matching column '"+column.opposingColumnId()+"' in sheet '" + column.lookup_type + "'";
			}
		}

	}
	
	return false;

}

exports.init = init;
