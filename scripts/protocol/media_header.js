var MediaHeader = function(
		type,
		size,
		PTS
) {
	this.type = type,
	this.size = size,
	this.PTS = PTS
};

/*MediaHeader.prototype.writeTo = function(buf) {
	new Uint32Array(buf, 0, 1)[0] = this.type;
	new Uint32Array(buf, 8, 1)[0] = this.size;
	new Uint32Array(buf, 32, 1)[0] = this.PTS;
};*/

MediaHeader.prototype.readFrom = function(buf) {
	var typeSize = new Uint32Array(buf, 0, 1)[0];
	this.type = typeSize & 0xFF;
	this.size = typeSize >>> 8;

	this.PTS = new Uint32Array(buf, 4, 1)[0];
};
