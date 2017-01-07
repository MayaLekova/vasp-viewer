var TransportHeader = function(
		prefix,
		number,
		channel,
		type,
		flags,
		CRC
) {
	this.prefix = prefix,
	this.number = number,
	this.channel = channel,
	this.type = type,
	this.flags = flags,
	this.CRC = CRC
};

/*TransportHeader.prototype.writeTo = function(buf) {
	new Uint8Array(buf, 0, 1)[0] = this.prefix;
	new Uint8Array(buf, 8, 1)[0] = this.number;
	new Uint8Array(buf, 12, 1)[0] = this.channel;
	new Uint8Array(buf, 16, 1)[0] = this.type;
	new Uint8Array(buf, 20, 1)[0] = this.flags;
	new Uint8Array(buf, 24, 1)[0] = this.CRC;
};*/

TransportHeader.prototype.readFrom = function(buf) {
	this.prefix = new Uint8Array(buf, 0, 1)[0];

	var numChan = new Uint8Array(buf, 1, 1)[0];
	this.number = (numChan & 0b11110000) >>> 4;
	this.channel = numChan & 0b00001111;

	var typeFlags = new Uint8Array(buf, 2, 1)[0];
	this.type = (typeFlags & 0b11110000) >>> 4;
	this.flags = typeFlags & 0b00001111;

	this.CRC = new Uint8Array(buf, 3, 1)[0];
};
