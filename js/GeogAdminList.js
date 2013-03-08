/**
**/


goog.provide("monsoon.maps.GeogAdminList");

goog.require('goog.dom');
goog.require("goog.structs.LinkedMap");
goog.require("goog.structs.StringSet");


/**
 * @constructor
*/
monsoon.maps.GeogAdminList = function(countrySelectObj, stateSelectObj) {
	if(typeof countrySelectObj == 'string' || countrySelectObj instanceof String) {
		this.countrySelect_ = goog.dom.getElement(countrySelectObj);
	} else {
		this.countrySelect_ = countrySelectObj;
	}
	
	if(typeof stateSelectObj == 'string' || stateSelectObj instanceof String) {
		this.stateSelect_ = goog.dom.getElement(stateSelectObj);
	} else {
		this.stateSelect_ = stateSelectObj;
	}
	// save the 20 most recently used state lists, i.e., for 20 countries
	this.stateListMap_ = new goog.structs.LinkedMap(20, true);
};

monsoon.maps.GeogAdminList.prototype.countryList_ = null; // the list of countries with SU_A3, NAME, X, Y, and Zoom level.
monsoon.maps.GeogAdminList.prototype.stateListMap_ = null; // the list of countries with SU_A3, NAME, X, Y, and Zoom level.
monsoon.maps.GeogAdminList.prototype.baseURL = '';
// This Yahoo service would translate HTML/XML/JSON to XML/JSON/JSONP and so on.
monsoon.maps.GeogAdminList.prototype.yqlBaseURL = 'http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20json%20where%20url%3D%22'; 

monsoon.maps.GeogAdminList.prototype.loadCountryList = function (url, callBackObj) {
	var self = this;
	//console.log(url + " : " + key);

	// No cross-domain rules, this would not be able to get data from another website.		
	$.ajax({
		url: self.baseURL + url,
		dataType: 'json',
		async: true,
		success: function(data) {
			//console.log(data.type);
			self.countryList_ = data;
			// Add the list to the HTML select and save the 
			
			if(self.countrySelect_) {
				self.countrySelect_.options.length = 0;
				
				if(self.countryList_.type == 'countryCollection') {
					var cntryList = self.countryList_.countries;
					var currentIndex = 0;
					for(var i = 0; i < cntryList.length; i++) {
						var option = document.createElement("option");
						option.text = cntryList[i].N;
						option.value = cntryList[i].C;
						
						if(cntryList[i].C == 'USA') {
							currentIndex = i;
						}
						
						try {
							// for IE earlier than version 8
							self.countrySelect_.add(option, self.countrySelect_.options[null]);
						  } catch (e)
						  {
							self.countrySelect_.add(option, null);
						  }				 
					}
				}
				
				self.countrySelect_.selectedIndex = currentIndex;
				self.loadStateList(cntryList[currentIndex].C);
				
				if(callBackObj) {
					//callBackObj.loadLayer(data);
					callBackObj.loadExampleLayer();
				}
				// Set onchange event handler
			}
		},
		error: function (xhr, txtStatus, thrownError) {
			console.log(xhr.status + ":" + thrownError + ":" + txtStatus);
			//console.log(xhr.responseText);
		}
	});	
};



monsoon.maps.GeogAdminList.prototype.loadStateList = function (countryCode) {
	
	var self = this;

	if(this.stateListMap_.containsKey(countryCode)) {
		var data = this.stateListMap_.get(countryCode);
		if(self.stateSelect_) {
			//self.stateSelect_.style.width = self.countrySelect_.style.width;
			self.stateSelect_.options.length = 0;
			
			if(data.type == 'provinceCollection') {
				var stateList = data.provinces;
			
				for(var i = 0; i < stateList.length; i++) {
					var option = document.createElement("option");
					option.text = stateList[i].N;
					option.value = stateList[i].C;
					
					try {
						// for IE earlier than version 8
						self.stateSelect_.add(option, self.stateSelect_.options[null]);
					  } catch (e)
					  {
						self.stateSelect_.add(option, null);
					  }				 
				}
			}
		}		
		
		return; // It has been loaded, do nothing
	}
	//console.log(url + " : " + key);
	// No cross-domain rules, this would not be able to get data from another website.		
	$.ajax({
		url: self.baseURL + 'CNTS/' + countryCode + '.json',
		dataType: 'json',
		async: true,
		success: function(data) {
			//console.log(data.type);
			self.stateListMap_.set(countryCode, data);
			// Add the list to the HTML select and save the 
			if(self.stateSelect_) {
				self.stateSelect_.options.length = 0;
				
				if(data.type == 'provinceCollection') {
					var stateList = data.provinces;
				
					for(var i = 0; i < stateList.length; i++) {
						var option = document.createElement("option");
						option.text = stateList[i].N;
						option.value = stateList[i].C;
						
						try {
							// for IE earlier than version 8
							self.stateSelect_.add(option, self.stateSelect_.options[null]);
						  } catch (e)
						  {
							self.stateSelect_.add(option, null);
						  }				 
					}
				}
				
				//self.stateSelect_.style.width = self.countrySelect_.style.width;
			}
		},
		error: function (xhr, txtStatus, thrownError) {
			console.log(xhr.status + ":" + thrownError + ":" + txtStatus);
			//console.log(xhr.responseText);
		}
	});	
};




monsoon.maps.GeogAdminList.prototype.loadCountryListCrossDomain = function (url, callBackObj) {
	var self = this;
	
	//http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20json%20where%20url%3D%22https%3A%2F%2Fnetfiles.umn.edu%2Fusers%2Fsunx0170%2FGLI%2FVector%2Fcountries.json%22&format=json
	//http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20json%20where%20url%3D%22https%3A%2F%2Fnetfiles.umn.edu%2Fusers%2Fsunx0170%2FGLI%2FVector%2FAdminWorld%2FCNTS%2FUSA.json%22&format=json	
	var fullURL = this.yqlBaseURL + encodeURIComponent(self.baseURL + url) + '%22&format=json&callback=?';
	//console.log(fullURL);
	
	// No cross-domain rules, this would not be able to get data from another website.		
	$.ajax({
		url: fullURL,
		dataType: 'jsonp',
		async: false,
		success: function(data) {
			//console.log(data.query.results.json);
			
			var jsonData = data.query.results.json;
			
			if(jsonData != null) {

				self.countryList_ = jsonData;
				// Add the list to the HTML select and save the 
				
				if(self.countrySelect_) {
					self.countrySelect_.options.length = 0;
					
					if(self.countryList_.type == 'countryCollection') {
						var cntryList = self.countryList_.countries;
						var currentIndex = 0;
						for(var i = 0; i < cntryList.length; i++) {
							var option = document.createElement("option");
							option.text = cntryList[i].N;
							option.value = cntryList[i].C;
							
							if(cntryList[i].C == 'USA') {
								currentIndex = i;
							}
							
							try {
								// for IE earlier than version 8
								self.countrySelect_.add(option, self.countrySelect_.options[null]);
							  } catch (e)
							  {
								self.countrySelect_.add(option, null);
							  }				 
						}
					}
					
					self.countrySelect_.selectedIndex = currentIndex;
					self.loadStateListCrossDomain(cntryList[currentIndex].C);
					
					if(callBackFunction) {
						callBackFunction();
					}
				}
				// Set onchange event handler
			}
		},
		error: function (xhr, txtStatus, thrownError) {
			console.log(xhr.status + ":" + thrownError + ":" + txtStatus);
			//console.log(xhr.responseText);
		}
	});	
};



monsoon.maps.GeogAdminList.prototype.loadCountryListCallback = function (url, callBackFunction) {
	var self = this;
	
	// No cross-domain rules, this would not be able to get data from another website.		
	$.ajax({
		url: self.baseURL + url,
		dataType: 'json',
		async: false,
		success: function(data) {
			if(data) {
				//console.log(data.type);
				self.countryList_ = data;

				// Add the list to the HTML select and save the 
				if(self.countrySelect_) {
					self.countrySelect_.options.length = 0;
					
					if(self.countryList_.type == 'countryCollection') {
						var cntryList = self.countryList_.countries;
						var currentIndex = 0;
						for(var i = 0; i < cntryList.length; i++) {
							var option = document.createElement("option");
							option.text = cntryList[i].N;
							option.value = cntryList[i].C;
							
							if(cntryList[i].C == 'USA') {
								currentIndex = i;
							}
							
							try {
								// for IE earlier than version 8
								self.countrySelect_.add(option, self.countrySelect_.options[null]);
							  } catch (e)
							  {
								self.countrySelect_.add(option, null);
							  }				 
						}
					}
					
					self.countrySelect_.selectedIndex = currentIndex;
					self.loadStateList(cntryList[currentIndex].C);
					
					if(callBackFunction) {
						callBackFunction();
					}
				}
				// Set onchange event handler
			}
		},
		error: function (xhr, txtStatus, thrownError) {
			console.log(xhr.status + ":" + thrownError + ":" + txtStatus);
			//console.log(xhr.responseText);
		}
	});	
};



monsoon.maps.GeogAdminList.prototype.loadStateListCrossDomain = function (countryCode) {
	
	var self = this;

	if(this.stateListMap_.containsKey(countryCode)) {
		var data = this.stateListMap_.get(countryCode);
		if(self.stateSelect_) {
			//self.stateSelect_.style.width = self.countrySelect_.style.width;
			self.stateSelect_.options.length = 0;
			
			if(data.type == 'provinceCollection') {
				var stateList = data.provinces;
			
				for(var i = 0; i < stateList.length; i++) {
					var option = document.createElement("option");
					option.text = stateList[i].N;
					option.value = stateList[i].C;
					
					try {
						// for IE earlier than version 8
						self.stateSelect_.add(option, self.stateSelect_.options[null]);
					  } catch (e)
					  {
						self.stateSelect_.add(option, null);
					  }				 
				}
			}
		}		
		
		return; // It has been loaded, do nothing
	}
	//console.log(url + " : " + key);
	// No cross-domain rules, this would not be able to get data from another website.	
	//var yqlBase = 'http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20json%20where%20url%3D%22';
	var fullURL = this.yqlBaseURL + encodeURIComponent(self.baseURL + 'CNTS/' + countryCode + '.json') + '%22&format=json&callback=?';
	
	$.ajax({
		url: fullURL,
		dataType: 'jsonp',
		async: true,
		success: function(data) {
			var jsonData = data.query.results.json;
			//console.log(jsonData.type);
			self.stateListMap_.set(countryCode, jsonData);
			// Add the list to the HTML select and save the 
			if(self.stateSelect_) {
				self.stateSelect_.options.length = 0;
				
				if(jsonData.type == 'provinceCollection') {
					var stateList = jsonData.provinces;
				
					for(var i = 0; i < stateList.length; i++) {
						var option = document.createElement("option");
						option.text = stateList[i].N;
						option.value = stateList[i].C;
						
						try {
							// for IE earlier than version 8
							self.stateSelect_.add(option, self.stateSelect_.options[null]);
						  } catch (e)
						  {
							self.stateSelect_.add(option, null);
						  }				 
					}
				}
				
				//self.stateSelect_.style.width = self.countrySelect_.style.width;
			}
		},
		error: function (xhr, txtStatus, thrownError) {
			console.log(xhr.status + ":" + thrownError + ":" + txtStatus);
			//console.log(xhr.responseText);
		}
	});	
};


