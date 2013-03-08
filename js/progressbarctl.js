/**
 * ProgressBar for Google Maps v3
 * @version 1.1
 *
 * by Jos?? Fernando Calcerrada.
 *
 * Licensed under the GPL licenses:
 * http://www.gnu.org/licenses/gpl.html
 *
 *
 * Chagelog
 *
 * v1.1
 * - IE fixed
 *
 */
goog.provide("monsoon.maps.ProgressBar");

/**
 * @constructor
 */
monsoon.maps.ProgressBar = function(opts) {

	this.options = monsoon.maps.ProgressBar.prototype.CombineOptions(opts, {
		height:       '1.3em',
		width:        '280px',
		top:          '65px',
		right:        '35px',
		colorBar:     '#68C',
		background:   '#FFFFFF',
		fontFamily:   'Arial, sans-serif',
		fontSize:     '12px'
	});

	this.div = document.createElement('div');

	this.div.id  = 'pg_div';
	var dstyle = this.div.style;
	this.div.style.cssText = 'box-shadow: ' + this.shadow + '; '
					+ '-webkit-box-shadow: ' + this.shadow + '; '
					+ '-moz-box-shadow: ' + this.shadow + '; ';
					
	dstyle.display     = 'none';
	dstyle.width       = this.options.width;
	dstyle.height      = this.options.height;
	dstyle.marginRight = '6px';
	dstyle.border      = '1px solid #BBB';
	dstyle.background  = this.options.background;
	dstyle.fontSize    = this.options.fontSize;
	dstyle.position    = 'relative';
	dstyle.top         = '200px';
	dstyle.left        = '900px';
	dstyle.textAlign   = 'left';
	dstyle.align       = 'center';  
	
	this.text = document.createElement('div');
	this.text.id  = 'pg_text';
	var tstyle = this.text.style;
	tstyle.position      = 'absolute';
	tstyle.width         = '100%';
	tstyle.border        = '5px';
	tstyle.textAlign     = 'center';
	tstyle.verticalAlign = 'bottom';

	this.bar = document.createElement('div');
	this.bar.id                    = 'pg_bar';
	this.bar.style.height          = this.options.height;
	this.bar.style.backgroundColor = this.options.colorBar;

	this.div.appendChild(this.text);
	this.div.appendChild(this.bar);
	
};

monsoon.maps.ProgressBar.prototype.options = null; 

monsoon.maps.ProgressBar.prototype.current = 0;
monsoon.maps.ProgressBar.prototype.total = 0;

monsoon.maps.ProgressBar.prototype.shadow = '1px 1px #888';


monsoon.maps.ProgressBar.prototype.div = null;
monsoon.maps.ProgressBar.prototype.text = null;
monsoon.maps.ProgressBar.prototype.bar = null;


monsoon.maps.ProgressBar.prototype.draw = function(mapDiv) {
    this.div.style.cssText = this.div.style.cssText +
      'z-index: 20; position: absolute; '+
      'top: '+this.options.top+'; right: '+this.options.right + '; ';

      var divObj = document.getElementById(mapDiv).appendChild(this.div);
      console.log(divObj);
};

monsoon.maps.ProgressBar.prototype.resetPosition = function(parentDiv) {

	 this.div.parentNode.removeChild(this.div);
	 parentDiv.appendChild(this.div);
    this.div.style.cssText = 'width: 280px; marginRight: 5px; background: #FFFFFF; z-index: 20; position: relative; '+ 'top: 0'+ '; right: 0;';
};

monsoon.maps.ProgressBar.prototype.start = function(total_) {
    if (parseInt(total_) === total_ && total_ > 0) {
      this.total = total_;
      this.current = 0;
      this.bar.style.width = '0%';
      this.text.innerHTML = 'Loading...';
      this.div.style.display = 'inline';
    }

    return this.total;
  };

monsoon.maps.ProgressBar.prototype.updateBar = function(increase) {
    if (parseInt(increase) === increase && this.total) {
      this.current += parseInt(increase);
      if (this.current > this.total) {
        this.total = this.current;
      } else if (this.current < 0) {
        this.current = 0;
      }

      this.bar.style.width = Math.round((this.current/this.total)*100)+'%';
      //text.innerHTML = current+' / '+total;
	  var num = this.current/this.total*100;
	  this.text.innerHTML = "~" + num.toFixed(2) + "%:" + this.current;

    } else if (!this.total){
      return this.total;
    }

    return this.current;
  };
  
monsoon.maps.ProgressBar.prototype.hide = function() {
    this.div.style.display = 'none';
  };

monsoon.maps.ProgressBar.prototype.getDiv = function() {
    return this.div;
  };

monsoon.maps.ProgressBar.prototype.getTotal = function() {
    return this.total;
  };

monsoon.maps.ProgressBar.prototype.setTotal = function(total_) {
    this.total = total_;
  };

monsoon.maps.ProgressBar.prototype.getCurrent = function() {
    return this.current;
  };

monsoon.maps.ProgressBar.prototype.setCurrent = function(current_) {
	this.div.style.display = 'block';
	{
	 this.current = parseInt(current_);
	  if (this.current > this.total) {
		this.total = this.current;
	  } else if (this.current < 0) {
		this.current = 0;
	  }

	  this.bar.style.width = Math.round((this.current/this.total)*100)+'%';
	  var num = this.current/this.total*100;
	  this.text.innerHTML = "~" + num.toFixed(2) + "%:" + this.current;

	} 
	return this.current;
};

monsoon.maps.ProgressBar.prototype.CombineOptions = function (overrides, defaults) {
  var result = {};
  if (!!overrides) {
    for (var prop in overrides) {
      if (overrides.hasOwnProperty(prop)) {
        result[prop] = overrides[prop];
      }
    }
  }
  if (!!defaults) {
    for (prop in defaults) {
      if (defaults.hasOwnProperty(prop) && (result[prop] === undefined)) {
        result[prop] = defaults[prop];
      }
    }
  }
  return result;
};