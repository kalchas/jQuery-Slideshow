(function (WIN, DOC, $) {
	
	'use strict';
	
	var
		prefix = 'slideshow',
		FALSE = false,
		TRUE = true,
		UNDEFINED,
		methods = {
			
			init : function (options) {
				
				var
					$this = $(this),
					data = get_element_data($this),
					defaults = {
						
						"bckbuttonclass" : "ns-slideshow-bckbutton",
						"fwdbuttonclass" : "ns-slideshow-fwdbutton",
						"thumbclass" : "ns-slideshow-thumb"
						
					};
					
				stash_html($this);
				data.opts = $.extend(true, defaults, options);
				data.content_area = $('<div />').appendTo($this);
				set_element_data(data, $this);
				
				//jQuery Slideshow-specific code here.
				
				$this.live(prefix + 'dataloaded', function () {
					
					init_slideshow($this);
					
				});
				
				if (UNDEFINED !== data.opts.datasource) {
					
					load_datasource($this);
					
				}
				
				$this.trigger(prefix + 'init');
				return $this;
				
			}
			
		},
		
		//jQuery Slideshow-specific private methods
		
		can_move = function (e, offset) {
			
			var
				$this = (UNDEFINED === e) ? $(this) : e,
				data = get_element_data($this),
				first_left =  parseInt($(data.thumbnails[0]).css('left'), 10),
				last_left = parseInt(data.thumbnails[data.thumbnails.length - 1].css('left'), 10); 
			
			//No offset is provided.	
			if (UNDEFINED === offset) {
				
				return FALSE;
				
			}
			
			//The slider is already all the way to the beginning and you're trying to shift it further back.
			if (0 < first_left + offset) {
				
				return FALSE;
				
			}
			
			if ((last_left + offset) < 0) {
				
				return FALSE;
				
			}
			
			return TRUE;
			
			
		},
		
		create_slide = function (e, i) {
			
			var
				$this = (UNDEFINED === e) ? $(this) : e,
				data = get_element_data($this);
			
			data.slides[i] = $('<div />', {
				
				"css" : data.opts.slidecss
				
			}).css('background-image', 'url(' + data["images"][i] + ')');
			set_element_data(data, $this);
			
		},
		
		create_thumbnail = function (e, i) {
			
			var
				$this = (UNDEFINED === e) ? $(this) : e,
				data = get_element_data($this);
				
			data.thumbnails[i] = $('<div />', {
			
				"css" : data.opts.thumbnailcss,
				"class" : data.opts.thumbclass
				
			});
			
			data.thumbnails[i].css('background-image', 'url(' + data["images"][i] + ')');
			set_element_data({"slide" : i}, data.thumbnails[i]);
			place_thumbnail(data.thumbnails[i], i);
			set_element_data(data, $this);
			return data.thumbnails[i];
				
		},
		
		init_slideshow = function (e) {
			
			var
				$this = (UNDEFINED === e) ? $(this) : e,
				data = get_element_data($this);

			$this.bind(prefix + 'slideloading', function () {
				
				var
					data = get_element_data($this);

				$('.' + data.opts.thumbclass, data.thumbstrip).fadeTo(0, 0.25);
				
				data.thumbnails[data.current_slide].fadeTo(0, 1);
				
			});
			
			$this.delegate('.' + data.opts.bckbuttonclass, 'click', function () {
				
				move_thumbnails($this, 'backward');
				
			});
			
			$this.delegate('.' + data.opts.fwdbuttonclass, 'click', function () {
				
				move_thumbnails($this, 'forward');
				
			});
			
			wireframe($this, data);
			data.current_slide = 0;
			set_element_data(data, $this);
			load_thumbnails($this, 0);
			load_slide($this, 0);
			
		},
		
		load_datasource = function (e) {
			
			var
				$this = (UNDEFINED === e) ? $(this) : e,
				data = get_element_data($this);
				
			$.getJSON(data.opts.datasource, function (d) {
				
				data["images"] = d["images"];
				set_element_data(data, $this);
				$this.trigger(prefix + 'dataloaded');
				
			});
			
		},
		
		load_slide = function (e, i) {
			
			var
				$this = (UNDEFINED === e) ? $(this) : e,
				data = get_element_data($this);
				
			if (UNDEFINED === data["images"][i]) {
				
				return FALSE;
				
			}
			
			if (UNDEFINED === data.slides[i]) {//Only make a new slide if it doesn't exist already.
			
				create_slide($this, i);
				load_slide($this, i);
				return FALSE;

			} else {
				
				data.current_slide = i;
				$this.trigger(prefix + 'slideloading');
				data.slides[i].prependTo(data.stage).fadeTo(0, 1);

				if (0 < data.slides[i].next().length) {
				
					data.slides[i].next().fadeTo(data.opts.transitionspeed, '0', function () {

						$(this).detach();
						set_element_data(data, $this);
						$this.trigger(prefix + 'slideloaded');

					});

				} else {

					set_element_data(data, $this);
					$this.trigger(prefix + 'slideloaded');

				}
				
			}
			
		},
		
		load_thumbnails = function (e) {
			
			var
				$this = (UNDEFINED === e) ? $(this) : e,
				data = get_element_data($this);
				
			data.thumbstrip.delegate('.' + data.opts.thumbclass, 'click', function () {
				
				var
					that = $(this),
					thumbdata = get_element_data(that);
					
				load_slide($this, thumbdata.slide);
				
			});
			
			$(data.images).each(function (i, e) {

				create_thumbnail($this, i).appendTo(data.thumbstrip);
				
			});
			
		},
		
		move_thumbnails = function (e, dir) {
			
			var
				$this = (UNDEFINED === e) ? $(this) : e,
				current_offset,
				data = get_element_data($this),
				thumbstrip_width = parseInt(data.thumbstrip.css('width'), 10),
				left_bound = 0 - (thumbstrip_width + 10),
				right_bound = 2 * (thumbstrip_width + 10);
			
			data.slideoffset = (UNDEFINED === data.slideoffset) ?  thumbstrip_width + 10 : data.slideoffset;
			
			current_offset = ('forward' === dir) ? data.slideoffset : 0 - data.slideoffset;
			
			if (can_move($this, current_offset)) {
			
				current_offset = (0 < current_offset) ? '+=' + Math.abs(current_offset) : '-=' + Math.abs(current_offset);
				
				
				
				$(data.thumbnails).each(function (i, e) {
					
					var left = parseInt($(e).css('left'), 10);
					
					if ($.contains(data.thumbstrip[0], e[0]) && ((left_bound > left) || (right_bound < left))) {
						
						$(e).detach();
						
					} else {
							
						$(e).appendTo(data.thumbstrip);

					}
					
					$(e).animate({
						
						'left' : current_offset
						
					});
					
				});
				
			}
			
			set_element_data(data, $this);
			
		},
		
		place_thumbnail = function (e, i, o) {
			
			var
				$this = (UNDEFINED === e) ? $(this) : e,
				data = get_element_data($this),
				offset = (UNDEFINED === o) ? 10 : o;
				
			$this.css('left', ((parseInt($this.css('width'), 10) + offset) * i) + 'px');
			
		},
		
		wireframe = function (e, data) {
			
			var
				$this = (UNDEFINED === e) ? $(this) : e;
			
			data.content_area.css(data.opts.slideshowcss);
			
			data.stage = $('<div />', {
				
				"css" : data.opts.stagecss
				
			}).appendTo(data.content_area);
			
			data.thumbstripwrapper = $('<div />', {
				
				"css" : data.opts.thumbstripwrappercss
				
			}).appendTo(data.content_area);
			
			data.thumbstrip = $('<div />', {
				
				"css" : data.opts.thumbstripcss
				
			}).appendTo(data.thumbstripwrapper);
			
			data.bckbutton = $('<div />', {
				
				"class" : data.opts.bckbuttonclass,
				"css" : data.opts.bckbuttoncss
				
			}).appendTo(data.thumbstripwrapper);
			
			data.fwdbutton = $('<div />', {
				
				"class" : data.opts.fwdbuttonclass,
				"css" : data.opts.fwdbuttoncss
				
			}).appendTo(data.thumbstripwrapper);
			
			data.slides = (UNDEFINED === data.slides) ? [] : data.slides;
			data.thumbnails = (UNDEFINED === data.thumbnails) ? [] : data.thumbnails;
			
			set_element_data(data, $this);
			
			$this.trigger(prefix + 'wireframed');
		},
		
		//Standard issue stuff.
		get_element_data = function (e, k) {
			
			var
				$this = (UNDEFINED === e) ? $(this) : e,
				data,
				key = (UNDEFINED === k) ? prefix : k;//End get_element_data() vars.
				
			data = $($this).data(key);
			//If we haven't stored any data yet, return an empty object. It works better.
			data = (UNDEFINED === data) ? {} : data;
			
			return data;
			
		},
		
		set_element_data = function (value, e, k) {
			
			var
				$this = (UNDEFINED === e) ? $(this) : e,
				data,
				key = (UNDEFINED === k) ? prefix : k;//End set_element_data() vars.
			
			//If there's already any data there, get it. Otherwise, we'll start with an empty object.	
			data = get_element_data($this, key);
			//extend the old data with the new data. We don't want to just clobber everything when we do this.
			data = $.extend(true, data, value);
			//Finally put the augmented data back with the element.
			$($this).data(key, data);
			
			return $this;
			
		},
		
		stash_html = function (e, d) {
			
			var
				$this = (UNDEFINED === e) ? $(this) : e,
				data = get_element_data($this),
				dump = (UNDEFINED === d) ? FALSE : d;//End stash_html() vars.
			
			//data.old_html is an array b/c we might want to stash several versions.
			if (UNDEFINED === data.old_html) {
			
				data.old_html = [];
				
			}
			
			if (TRUE === dump) {
				
				$($this).children().remove();
				
			} else {
			
				//Remove the html content from the DOM and save it for later use.
				data.old_html.push($($this).children().detach());
				
			}
			
			//Stash the content as data attached to the element.
			set_element_data(data, $this);
			
			return $this;
			
		};
	
	$.fn.slideshow = function (method) {
		
		if (undefined !== methods[method]) {
			
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
			
		} else if ('object' === typeof method  || !method) {
			
			return methods.init.apply(this, arguments);
			
		} else {
			
			$.error('Method ' + method + ' is not available for jquery.slideshow');
		}
		
	};
	
}(window, document, jQuery, undefined));