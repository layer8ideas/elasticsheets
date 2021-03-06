webix.ready(function(){

	sheetsArray = [];

	for (var i=0;i<config.sheets.length;i++){
		sheetsArray[i] = createSheet(i);
	}

	webix.ui({
		cols:[ 
		      {rows:[
		             //{ type:"header", template:"My Header" },
		             {
		            	 id: "thetabs",
		            	 view: "tabview",
		            	 cells: sheetsArray,
		            	 tabbar:{
		            		 on:{
		            			 onChange:function(id,id2,id3,id4){
		            				// might be nice to reload the tab's data
		            				// console.log(this.getValue());
		            			 }
		            		 }
		            	 }
		             }

		             ]
		      },
		      //{view:"resizer"},
		      //{width:150 id:mySideBar}
		      ]

	});


	for (var i=0;i<config.sheets.length;i++){
		configureSheet(i);	
	}




});


function createSheet(i){

	var staticColumns = [{ id:"rowsel", header:"", width:30}];
	var theseColumns = staticColumns.concat(config.sheets[i].columns);

	var header = config.sheets[i].header;
	if (config.sheets[i].icon) header = "<span class='webix_icon "+config.sheets[i].icon+"'></span>" + config.sheets[i].header;

/*
webix.proxy.es = {
    $proxy:true,
    load:function(url, call, arguments){
	var ajax = webix.AtomDataLoader.load.apply(this, arguments);

		//prepare data feed for dyn. loading
		if (!this.data.url)
			this.data.url = url;

		return ajax;
    },
    save:function(view, update, dp, callback){
        //your saving pattern
        webix.ajax().post(url, data, callback);
    }
};
*/

	var datatable_config = {
		  datafetch:50,
		  //datathrottle:500,
		  loadahead:50,
		  id:"sheet_" + i,
		  resizeColumn:true,
		  view:"datatable",
		  save:  {
			  url: "rest->/index/" + config.index_id + "/" + config.sheets[i].id,
			  updateFromResponse:true
		  },	
		  url: "/search/" + config.index_id + "/" + config.sheets[i].id,

		  columns:theseColumns,			
		  updateFromResponse:true, 
		  editable:true,
		  editaction:"custom",
		  navigation:true,
		  leftSplit:2,
		  select:"cell",
		  multiselect:true,
		  onContext:{},
		  on:{
			onBeforeLoad:function(){
			    //this.showOverlay("Loading...");
			},
			onAfterLoad:function(){
			    //this.hideOverlay();
			}
		    },
	      };

	if (config.sheets[i].datatable_config){
        	for (var key in config.sheets[i].datatable_config) {
		   datatable_config[key] = config.sheets[i].datatable_config[key];	
		}
	}

	return {

		id: "sheet_tab_" + i,
		value: i,
		header:header,
		width:200,
		body: {

			rows:[
			      {
			    	  height:40,
			    	  cols:[
			    	        { view: "button", type: "iconButton", icon: "plus", label: "Add", width: 100, click: function(){

			    	        	addRecord(i);

			    	        }},
			    	        { view: "button", type: "iconButton", icon: "remove", label: "Delete", width: 100, click: function(){
					
						webix.confirm({
						    ok:"Yes", 
						    cancel:"No",
						    text:"Are you sure you want to delete the selected rows or fields?",
						    callback:function(confirmed){ //setting callback
							if (confirmed) doDelete(i);
						   }
						});	

			    	        }},
			    	        { view: "button", type: "iconButton", icon: "refresh", label: "Refresh", width: 100, click: function(){

			    	        	doRefresh(i)

			    	        }},
			    	        { view: "button", type: "iconButton", icon: "file-excel-o", label: "Export", width: 100, click: function(){

			    	        	try {
			    	        		$$("sheet_" + i).exportToExcel();
			    	        	} catch (e){
			    	        		webix.alert("The current data cannot be exported because the whole table hasn't been downloaded yet.  Either scroll to the bottom or filter your search.");	
			    	        	}

			    	        }},

			    	        {},
			    	        ]
			      }, datatable_config
			      ]

		}
	};

}

function doDelete(i){

	var table = $$("sheet_" + i);
	var selection = table.getSelectedId(true);
	var cellsByRow = {};

	// First sort them by row so that we can do atomic updates
	for (var j=0; j<selection.length; j++) { 
		if (!cellsByRow[selection[j].row]) {
			cellsByRow[selection[j].row] = [];
		}
		cellsByRow[selection[j].row].push(selection[j]);
	}

	for (var rowId in cellsByRow){

		var rowUpdateData = {};
		var cells = cellsByRow[rowId];
		var row = cells[0].row;
		for (var j=0; j<cells.length; j++) { 

			if (cells[j].column == "rowsel"){
				table.remove(cells[j].row);
				rowUpdateData = {};
				continue;
			} else if (table.exists(cells[j].row) && config.columns_by_id[config.sheets[i].id][cells[j].column].lookup_type) {
				rowUpdateData[cells[j].column] = [];
			} else if (table.exists(cells[j].row)) {
				rowUpdateData[cells[j].column] = "";
			}			    	        			

		}

		if (Object.keys(rowUpdateData).length > 0) {
			table.updateItem(row, rowUpdateData);
		}
	}
}

function configureSheet(i){

	$$("sheet_" + i).config.sheet_id = i;

	if (config.sheets[i].contextmenu) {
		webix.ui({
			view:"contextmenu",
			id:"cmenu" + i,
			data:config.sheets[i].contextmenu,
			on:{
				onItemClick:function(id){
					var selected = $$("sheet_" + i).getSelectedItem()[0];
					config.sheets[i].contextmenuclicked(id, selected);
				}
			}
		});

		$$("cmenu" + i).attachTo($$("sheet_" + i));
	}

	$$("sheet_" + i).attachEvent("onBeforeContextMenu", function(id, e, node){

		var table = $$("sheet_" + i);
		table.select(id.row, "rowsel", false);

		return true;

	});


	$$("sheet_" + i).attachEvent("onAfterSelect", function(id){

		var table = $$("sheet_" + i);
		var cells = table.getSelectedId(true);
		var lastcolumn = table.config.columns[table.config.columns.length-1].id
		for (var j=0; j<cells.length; j++) { 
			if (cells[j].column != "rowsel") continue;
			table.selectRange(cells[j].row, "rowsel", cells[j].row, lastcolumn);
		}

	});

	webix.UIManager.addHotKey("any", function(view, ev){

            //filter or text editor
            if ((ev.target||ev.srcElement).tagName == "INPUT") return;

	    doEdit( $$("sheet_" + i), ev);

        },  $$("sheet_" + i));

	$$("sheet_" + i).attachEvent("onItemDblClick", function(id, e, node){
		doEdit(this, e);
	});

	webix.dp($$("sheet_" + i)).attachEvent('onAfterSaveError', function(id, status, obj, obj2){
		if (obj2.text.indexOf("VersionConflictEngineException") > -1) 
			webix.alert("You are editing an old version of this record.  Please refresh and try again.");
		
	});

	$$("sheet_" + i).attachEvent('onStoreLoad', function(data, data2){
		console.log(data,data2);
		
	});


}

function doRefresh(sheet_id){
	var table = $$("sheet_" + sheet_id);

	table.eachColumn(function(id, col){
		var filter = this.getFilter(id);
		if (filter){
			if (filter.setValue) {
				filter.setValue("");
			} else { 
				filter.value = "";
			}
		}
	});

	table.filterByAll();

	table.clearAll()
	table.load(table.config.url);
}

function doEdit(view, ev){

	var cell = view.getSelectedId(true);
	var column_id = cell[0].column;
	var config_column = config.columns_by_id[config.sheets[view.config.sheet_id].id][column_id];

	if (!config_column.lookup) {

		if ((ev.target||ev.srcElement).tagName == "INPUT") return;
		var pos = view.getSelectedId();
		view.edit(pos);

	} else if (config_column.lookup_type) {

		//	console.log("RUN", view.getSelectedItem());

		doGraph(config.index_id, config_column, function (value){

			var edges = new graph.LookupColumnValue(view.getSelectedItem()[column_id]);

			if (config_column.lookup_multi){
				edges.put(value);
			}else{
				edges.putOnly(value);
			}

			var updateData = makeUpdateData(column_id, edges.toArray());
			console.log(view);
			view.updateItem(cell[0].row, updateData);

		});       

	}

}

function addRecord(i){
	var sheet = $$("sheet_" + i);
	var id = sheet.add({
		//rank:99,
		label: "New Item"
	},0);
	sheet.editCell(id, "label", false, true);
}

function makeUpdateData(key, value){
	var update = {};
	update[key] = value;
	return update;
}
