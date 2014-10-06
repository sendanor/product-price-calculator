/** The UI code for VPS pricing calculator */
"use strict";
(function(global) {
$(function() {

if(typeof global._translations === 'undefined') {
	global._translations = {};
}

/** */
function _(key) {
	return '' + _translations.hasOwnProperty(key) ? _translations[key] : key;
}

/** Returns the string presentation of value */
function cpu_int_to_decimal(v) {
	if(v === -2) { return 0.1; }
	if(v === -1) { return 0.2; }
	if(v === 0) { return 0.5; }
	return v;
}

/** Returns the string presentation of value */
function cpu_decimal_to_int(v) {
	if(v <= 0.1) { return -2; }
	if(v <= 0.2) { return -1; }
	if(v <= 0.0) { return 0; }
	return v;
}

/** */
function get_vps_price(provider, cpu, mem, disk, net, support, callp) {
	var c = parseInt(cpu.value, 10);
	if(c === -2) { c = 0.1; }
	else if(c === -1) { c = 0.2; }
	else if(c === 0) { c = 0.5; }

	//debug.assert(callp).is('function');

	var m = parseInt( mem.value, 10);
	var d = parseInt( disk.value, 10);
	var n = parseInt( net.value, 10);
	var s = parseInt( support.value, 10);

	return $.ajax({
		dataType: "json",
		url: 'https://sendanor.rest/products/vps?provider='+provider+'&cpu='+c+'&mem='+m+'&disk='+d+'&net='+n+'&support='+s,
		data: {},
		cache: false
	}).done(function success_handler(data) {
		//debug.assert(data).is('object');
		//console.log('data = ' + JSON.stringify(data));
		callp(undefined, data);
	}).fail(function reject_handler(data) {
		callp(data && ((data.responseJSON && data.responseJSON.error) || data.statusText) || 'ajax-error');
	});

}

/** CPU */
function CPU() {
	this.code = "cpu";
	this.name = _('label-cpu');
	this.min = -2;
	this.max = 8;
	this.step = 1;
	this.value = this.min;
}

/** Returns the string presentation of value */
CPU.prototype.getValue = function() {
	if(this.value === -2) { return "1/10 "+_('label-cpu'); }
	if(this.value === -1) { return "1/5 "+_('label-cpu'); }
	if(this.value === 0) { return "1/2 "+_('label-cpu'); }
	return "" + this.value + " "+_('label-cpu');
};

/** Returns the string presentation of value */
CPU.prototype.getDecimal = function() {
	if(this.value === -2) { return 0.1; }
	if(this.value === -1) { return 0.2; }
	if(this.value === 0) { return 0.5; }
	return this.value;
};

/** Memory */
function Mem() {
	this.code = "mem";
	this.name = _('label-mem');
	this.min = 256;
	this.max = 1024*32;
	this.step = 128;
	this.value = this.min;
}

/** Returns the string presentation of value */
Mem.prototype.getValue = function() {
	return "" + this.value + " "+_('label-mem-MB');
};

/** Disk */
function Disk() {
	this.code = "disk";
	this.name = _('label-disk');
	this.min = 10;
	this.max = 1000;
	this.step = 1;
	this.value = this.min;
}

/** Returns the string presentation of value */
Disk.prototype.getValue = function() {
	return "" + this.value + " "+_('label-disk-GB');
};

/** Net */
function Net() {
	this.code = "net";
	this.name = _('label-net');
	this.min = 1;
	this.max = 100000;
	this.step = 1;
	this.value = 25;
}

/** Returns the string presentation of value */
Net.prototype.getValue = function() {
	return "" + this.value + " "+_('label-net-GB');
};

/** Support class */
function Support() {
	this.code = "support";
	this.name = _('label-support');
	this.min = 1;
	this.max = 3;
	this.step = -1;
	this.value = this.max;
}

/** Returns the string presentation of value */
Support.prototype.getValue = function() {
	return "" + this.value + _('label-support-class');
};

/** */
function enable_slider(elem, param, update_data) {

	var slider = $(elem).find("."+param.code+"-slider");
	var value = $(elem).find("."+param.code+"-value");

	/** Normal slider */
	function normal_slide(v) {
		param.value = v;
		$(value).val( param.getValue() );
	}

	/** Reverse slider */
	function reverse_slide(v) {
		param.value = (param.max+param.min) - v;
		$(value).val( param.getValue() );
	}

	var slide_fun = normal_slide;
	var def_value = param.value;
	var reverse = false;
	if(param.step < 0) {
		reverse = true;
		param.step = Math.abs(param.step);
		slide_fun = reverse_slide;
		def_value = (param.max+param.min) - def_value;
	}

	$(slider).slider({
		"min": param.min,
		"max": param.max,
		"value": def_value,
		"step": param.step,
		"slide": function(event, ui) {
			slide_fun(ui.value);
			update_data();
		}
	});

	slide_fun( $(slider).slider( "value" ) );
	update_data();

}

/** */
function update_providers(elem, data) {
	var select = $(elem).find('select.provider');
	var selected = $(select).val();
	$(select).empty();
	data.providers.forEach(function(p) {
		$(select).append( (p === selected) ? $('<option selected>').text(p) : $('<option>').text(p) );
	});
	return selected;
}

/** */
function refresh_slider(code, slider, min, max, step) {

	console.log('min = ' + min + ' max = ' + max + ' step = ' + step);

	if( (!slider) || (slider && (slider.length === 0)) ) {
		console.log('slider not found');
		return;
	}

	var value = $(slider).slider("option", "value");
	console.log('value = ' + JSON.stringify(value, null, 2) );

	if(code === "cpu") {
		value = cpu_int_to_decimal(value);
	}

	$(slider).slider("option", "min", cpu_decimal_to_int(min));
	$(slider).slider("option", "max", cpu_decimal_to_int(max));

	if(step !== undefined) {
		$(slider).slider("option", "step", step);
	}

	if(value < min) {
		$(slider).slider("option", "value", cpu_decimal_to_int(min) );
	}

	if(value > max) {
		$(slider).slider("option", "value", cpu_decimal_to_int(max) );
	}

	// this is an ugly workaround, but triggers the change event
	$(slider).slider("value", $(slider).slider("value"));

	//var values = $(slider).slider("values");
	//$(slider).slider("values", values);

	//$(slider).slider("refresh");
}

/** */
function enable_calc(elem, provider) {

	provider = provider || 'fsol';

	var cpu = new CPU();
	var mem = new Mem();
	var disk = new Disk();
	var net = new Net();
	var support = new Support();

	var _lock = false;

	function update_data() {

		if(_lock) {
			return;
		}

		_lock = true;

		$(elem).find('.result').prepend($('<i class="fa fa-spinner fa-spin">'));
		var orig_state = [provider, cpu.value, mem.value, disk.value, net.value, support.value].join('-');

		var select_provider = $(elem).find('select.provider');

		if( select_provider.length ) {
			provider = $(select_provider).val();
		}

		get_vps_price(provider, cpu, mem, disk, net, support, function(err, data) {
			try {
				if(err) {
					//debug.error(err);
					$(elem).find('.result').text( _('error-pre-content') + _(err) );
					return;
				}

				if(data.providers) {
					update_providers(elem, data);
				}

				// Update limits
				if(data.limits) {
					cpu.min = data.limits.cpu_min;
					cpu.max = data.limits.cpu_max;
					mem.min = data.limits.mem_min;
					mem.max = data.limits.mem_max;
					mem.step = data.limits.mem_step;
					disk.min = data.limits.disk_min;
					disk.max = data.limits.disk_max;
					disk.step = data.limits.disk_step;
					net.min = data.limits.net_min;
					net.max = data.limits.net_max;
					net.step = data.limits.net_step;
					support.min = data.limits.support_min;
					support.max = data.limits.support_max;

					refresh_slider( "cpu", $(elem).find('.cpu-slider'), cpu.min, cpu.max );
					refresh_slider( "mem", $(elem).find('.mem-slider'), mem.min, mem.max, mem.step );
					refresh_slider( "disk", $(elem).find('.disk-slider'), disk.min, disk.max, disk.step );
					refresh_slider( "net", $(elem).find('.net-slider'), net.min, net.max, net.step );
					refresh_slider( "support", $(elem).find('.support-slider'), support.max, support.min );
					update_data();
				}

				//debug.assert(data).is('object');
				//debug.assert(data.monthly_fee).is('number');
				$(elem).find('.result').text(''+_('product-pre-content')+
					data.provider +
					(data.model ? '/' + data.model : '') +
					' -- '+
					data.cpu + ' '+_('label-cpu')+', '+
					data.mem + ' '+_('label-mem-MB')+', '+
					data.disk + ' '+_('label-disk-GB')+', '+
					data.net + ' '+_('label-net-GB')+', '+
					data.support + _('label-support-class') +' -- '+
					data.monthly_fee + ' ' + _('eur-per-month'));

				// Update data if provider is changed
				$(elem).find('select.provider').one("change", function() {
					update_data();
				});

			} finally {
				_lock = false;

				// Check again if state has changed
				var new_state = [provider, cpu.value, mem.value, disk.value, net.value, support.value].join('-');
				if(orig_state !== new_state) {
					update_data();
				}
			}
		});
	}

	enable_slider(elem, cpu, update_data );
	enable_slider(elem, mem, update_data );
	enable_slider(elem, disk, update_data );
	enable_slider(elem, net, update_data );
	enable_slider(elem, support, update_data );

}

	enable_calc(".price-calculator");
});

})(window);

