

function doGraph(index_id, config_column, callback) {
	
	var thewindow = webix.ui({
		 id:"theWindow",
		 view:"window", move:true,
		 head:{
				view:"toolbar", margin:-4, cols:[
					{view:"label", label: config.sheets_by_id[config_column.lookup_type].header },
					{ view:"icon", icon:"question-circle",
						click:"webix.message('About pressed')"},
					{ view:"icon", icon:"times-circle",
						click:"$$('theWindow').close();"}
					]
			},

	    position:"center",
	    modal:true,
		body:{
			width: 520,         //  component's dimensions
		    height: 180,
			id:"searchTable",
			view:"datatable",
			columns: [{id : "label", header : { id: "thisFilter", content:"serverFilter"}, width:500}],	
			select:"row",
			scrollY: false,
			scrollX: false,
			autowidth:true,
			navigation:true,
	    	url: "/search/" + index_id + "/" + config_column.lookup_type,
		}
	})
	
	$$("searchTable").attachEvent("onItemDblClick", function(id, e, node){
	  callback({
		  id: this.getSelectedItem().id, label: this.getSelectedItem().label
	  })  
       thewindow.hide()
    });
	webix.UIManager.addHotKey("Esc", function(view){
		thewindow.hide();
	},  thewindow);
	webix.UIManager.addHotKey("Esc", function(view){
		thewindow.hide();
	},   $$("searchTable"));
	
	
	
	thewindow.show();

	$$("searchTable").$view.getElementsByTagName("input")[0].focus();
}