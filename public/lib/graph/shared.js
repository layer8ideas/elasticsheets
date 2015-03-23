
(function(exports){
	
	/*
	 * Class: LookupColumnValue
	 * Manages Adjacency Data
	 */
	function LookupColumnValue (value) {
		if (!value) value = [];
		this.changed = false;
		this.hashed = {};
		for (var i=0;i<value.length;i++){
			this.hashed[value[i].id] = value[i];
		} 
	}

	LookupColumnValue.prototype.hasChanged = function() {
		return this.changed;
	};

	LookupColumnValue.prototype.ensureCorrect = function(id, label) {
		if (!this.hasCorrect(id, label)){
			this.put({id:id, label:label})
		}
		return !this.hasChanged();
	};

	LookupColumnValue.prototype.hasCorrect = function(id, label) {
		return (this.has(id) && this.hashed[id].label === label);
	};

	LookupColumnValue.prototype.has = function(id) {
		return (id in this.hashed);
	};

	LookupColumnValue.prototype.put = function(obj) {
		this.changed = true;
		this.hashed[obj.id] = obj;
	};
	
	LookupColumnValue.prototype.clear = function(obj) {
		this.hashed = {};
	};

	LookupColumnValue.prototype.putOnly = function(obj) {
		this.clear();
		this.put(obj);
	};

	LookupColumnValue.prototype.remove = function(id) {
		this.changed = true;
		delete this.hashed[id];
	};
	

	LookupColumnValue.prototype.toArray = function() {
		var theArray = [];
		for (var key in this.hashed){
			theArray.push(this.hashed[key])
		}
		return theArray;
	};

	exports.LookupColumnValue = LookupColumnValue;


	
})(typeof exports === 'undefined'? this['graph']={}: exports);