
/** */
function get_vps_price(cpu, mem, disk, support, callp) {
	var c = parseInt(cpu.value, 10);
	if(c === -2) { c = 0.1; }
	else if(c === -1) { c = 0.2; }
	else if(c === 0) { c = 0.5; }

	//debug.assert(callp).is('function');

	var m = parseInt( mem.value, 10);
	var d = parseInt( disk.value, 10);
	var s = parseInt( support.value, 10);

	return $.ajax({
		dataType: "json",
		url: 'https://sendanor.rest/products/vps?cpu='+c+'&mem='+m+'&disk='+d+'&support='+s,
		data: {},
		cache: false
	}).done(function success_handler(data) {
		//debug.assert(data).is('object');
		//console.log('data = ' + JSON.stringify(data));
		callp(undefined, data);
	});

}

/** CPU */
function CPU() {
	this.code = "cpu";
	this.name = "CPU";
	this.min = -2;
	this.max = 8;
	this.step = 1;
	this.value = this.min;
}

/** Returns the string presentation of value */
CPU.prototype.getValue = function() {
	if(this.value === -2) { return "1/10 CPU"; }
	if(this.value === -1) { return "1/5 CPU"; }
	if(this.value === 0) { return "1/2 CPU"; }
	return "" + this.value + " CPU";
};

/** Memory */
function Mem() {
	this.code = "mem";
	this.name = "Muisti (MB)";
	this.min = 256;
	this.max = 1024*32;
	this.step = 128;
	this.value = this.min;
}

/** Returns the string presentation of value */
Mem.prototype.getValue = function() {
	return "" + this.value + " MB";
};

/** Disk */
function Disk() {
	this.code = "disk";
	this.name = "Levytila (GB)";
	this.min = 10;
	this.max = 1000;
	this.step = 1;
	this.value = this.min;
}

/** Returns the string presentation of value */
Disk.prototype.getValue = function() {
	return "" + this.value + " GB";
};

/** Support class */
function Support() {
	this.code = "support";
	this.name = "Tuki";
	this.min = 1;
	this.max = 3;
	this.step = -1;
	this.value = this.max;
}

/** Returns the string presentation of value */
Support.prototype.getValue = function() {
	return "" + this.value + ". luokka";
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
function enable_calc(elem) {
	var cpu = new CPU();
	var mem = new Mem();
	var disk = new Disk();
	var support = new Support();

	var _lock = false;

	function update_data() {

		if(_lock) {
			return;
		}

		_lock = true;
		$(elem).find('.result').prepend($('<i class="fa fa-spinner fa-spin">'));
		var orig_state = [cpu.value, mem.value, disk.value, disk.support].join('-');
		get_vps_price(cpu, mem, disk, support, function(err, data) {
			try {
				if(err) {
					//debug.error(err);
					return;
				}

				//debug.assert(data).is('object');
				//debug.assert(data.monthly_fee).is('number');
				$(elem).find('.result').text('Virtuaalipalvelin '+
					data.cpu + ' CPU, '+
					data.mem + ' MB, '+
					data.disk + ' GB, '+
					data.support + '. luokka -- '+
					data.monthly_fee + ' €/kk');
			} finally {
				_lock = false;

				// Check again if state has changed
				var new_state = [cpu.value, mem.value, disk.value, disk.support].join('-');
				if(orig_state !== new_state) {
					update_data();
				}
			}
		});
	}

	enable_slider(elem, cpu, update_data );
	enable_slider(elem, mem, update_data );
	enable_slider(elem, disk, update_data );
	enable_slider(elem, support, update_data );
}

$(function() {
	enable_calc(".price-calculator");
});
