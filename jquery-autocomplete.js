(function($){
	"use strict";
	function Whisperer(element, options){
		this.element = $(element);
		this.options = $.extend({}, Whisperer.defaults, options);
		this.id = 'autocompletelist';
		
		this._initDatalist();
		this._initEvents(this);
	}

	Whisperer.defaults = {
		minLength: 0,
		maxLength: -1,
		source: '',
		param: '',
		select: $.noop,
		url: ''
	};

	Whisperer.prototype = {

		_initDatalist : function() {
			this.datalistSelect = this.element.prop('list');

			if (!this.datalistSelect) {
				this.datalistSelect = $('<datalist id="' + this.id + '"><select /></datalist>');
				this.element.attr('list', this.id);
				this.element.after(this.datalistSelect);
			}
			this.datalistSelect = $('select', this.datalistSelect);
		},
		search: function(val){
			console.log("invoking search");
			var response, 
				that = this,
				o = this.options,
				cVal = val;
			
			if(o.maxLength > -1){
				cVal = cVal.substr(o, o.maxLength);
			}
				
			response = function(data){
				that.setList(data, cVal);
			};
			
			$.ajax({
				url: o.url,
				dataType: 'jsonp',
				data: {
					name: val
				},
				success: function(data){
					var jsonResp = data;
					var resultContent = [];
					$.each(jsonResp, function(i, res){
						var item = o.processRecord(res);
						resultContent.push(item);
					});
					response(resultContent);
				},
				error: function(xhr, status, err){
					console.log(status + "nok" + err);
				}
			});
				
		},
		setList: function(options, val){
			if(!options){
				options = [];
			}

			if(this.currentOptions != options && this.currentVal !== val){
				this.currentOptions = options;
				this.currentVal = val;
				options = $.map(options, this.initOption);
				this.datalistSelect.html(options);
			}

		},
		val: function() {
			return this.element.prop('value');
		},
		initOption: function(option){
			var elem = $(document.createElement('option'));
			elem.prop('value', option.value);
			elem.prop('label', option.label);
			return elem;
		},
		_initEvents: function(inst){
			var options = inst.options;
			var searchTimer;

			var detectListselect = (function(){
				var lastValue;
				return function(type){
					var curValue = inst.val();
					
					if(curValue === lastValue){
						return;
					}
					
					lastValue = curValue;
					
					if(inst.val()){
						clearTimeout(searchTimer);
						if(options.select){
							options.select.call(inst.element[0], $.Event('listselect'));
						}
						inst.element.trigger('elementselected');
						return true;
					}
				};
			})();
			
			var handleSearch = (function(){
				console.log("handle search");
				var doSearch = function(){
					var currVal = inst.val();
					if (currVal.length >= options.minLength){
						inst.search(currVal);
					}
					};
				var exSearch = function(){
					clearTimeout(searchTimer);
					searchTimer =  setTimeout( doSearch(), 90);
					console.log("after do search");
				};
				return exSearch;
			})();
			
			inst.element.on({
				'input change': function(e){
					clearTimeout(searchTimer);
					console.log(e.type);
					if(e.type == 'change'){
						if(inst.element.is(':focus')){
							detectListselect('change');
						}
					} else if (e.type == 'input'){
						handleSearch();
					} 
					else {
						console.log("another unhandled action");
					}
				},
				
				listselect: function(e){
					console.log("elementselected");
				}
			});
		}
	};


	$.fn.prompt = function(opts, args){
		this.each(function(){
			new Whisperer(this, $.extend({}, opts));
		});
	};

})(jQuery);