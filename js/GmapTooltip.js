/**
* Generic Map Tooltip
* Follows the cursor while within map bounds, and displays whatever info you give it.
* By Greg MacWilliam, Threespot.
*/

goog.provide("monsoon.maps.MapTooltip");

/**
 * @constructor
 */
monsoon.maps.MapTooltip = function(frameObj) {
	this.balloon = $('<div/>').addClass('map-tooltip').appendTo('body').hide();
	this.content = $('<div/>').addClass('map-tooltip-content').appendTo(this.balloon);
	this.tail = $('<div/>').addClass('map-tooltip-tail').appendTo(this.balloon);
	
	if (typeof(frameObj) === 'string') {
		this.frame = $('#'+frameObj);
	} else {
		this.frame = frameObj;
	}	

	// Bind mouse events to map container.
	var self = this;

	// these are jQuery methods and notion.
	self.frame
	  .mousedown(function() {
			self.dragging = true;
			self.balloon.hide();
		})
	  .mouseup(function(evt) {
			self.dragging = false;
			if (self.active) {
				self.balloon.show();
				self.update(evt.pageX, evt.pageY);
			}
		})
		.mousemove(function(evt) {
			self.update(evt.pageX, evt.pageY);
		});	
		
};

monsoon.maps.MapTooltip.prototype.mouseX = -1;
monsoon.maps.MapTooltip.prototype.mouseY = -1,
monsoon.maps.MapTooltip.prototype.active = false,
monsoon.maps.MapTooltip.prototype.dragging = false,
monsoon.maps.MapTooltip.prototype.balloon = null;
monsoon.maps.MapTooltip.prototype.content = null;
monsoon.maps.MapTooltip.prototype.tail = null;
monsoon.maps.MapTooltip.prototype.frame = null; // it must be an object returned by jQuery
monsoon.maps.MapTooltip.prototype.balloonAlwaysUp = false;

// Updates the tooltip display with the current mouse coordinates,
// or defaults to using last set coordinates if called without arguments.
monsoon.maps.MapTooltip.prototype.update = function (mx, my) {
	
		this.mouseX = (mx || this.mouseX);
		this.mouseY = (my || this.mouseY);
		
		
		// Only update tooltip display while active and not dragging.
		if (this.active && !this.dragging)
		{
			var self = this;
			
			$(this.balloon).ready(function() {
			// Get half the tail width and full tail height.
			var tw=self.tail.width()/2;
			var	 th=self.tail.height();
			
			// Get width and height of the box.
			var bw=self.balloon.width();
			var bh=self.balloon.height();
			// Calculate container offset and flag if tooltip should push down.
			var offset = self.frame.offset();
			var down = (self.mouseY-offset.top < bh+th+15);
			
			// Calculate left and right mouse margins.
			var ml=offset.left-self.mouseX;
			var mr=offset.left+self.frame.width()-self.mouseX;

			// Calculate box's left offset.
			var ol=Math.max(ml-tw, Math.min(-bw/2, mr-bw+tw));
			
			var mb = offset.top + self.frame.height() - self.mouseY;

			if(!self.balloonAlwaysUp) 
			{
				self.balloon.css({
					left:self.mouseX+ol,
					top:self.mouseY-(down ? -15 : bh+35)
				});
				// Adjust tail position.
				self.tail.css({
					backgroundPosition:(down ? '0 0' : '0 bottom'),
					left:-(ol+tw),
					bottom:(down ? bh+1 : -th-1)
				});
				
			} else
			{
				self.balloon.css({
					left:self.mouseX+ol,
					bottom:mb + 35
				});
			}
			

				
		});
	}
	};
	
monsoon.maps.MapTooltip.prototype.onMouseMove = function(evt) {
		this.update(evt.pageX, evt.pageY);
	};
	
monsoon.maps.MapTooltip.prototype.show = function (info) {
	this.active = true;
	this.content.html(info);
	if (!this.dragging) {
		this.balloon.show();
		this.update();
	}
};		

monsoon.maps.MapTooltip.prototype.hide = function() {
	this.balloon.hide();
	this.active = false;
};
