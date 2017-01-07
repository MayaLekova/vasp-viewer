var Transport = function() {

};

Transport.prototype.readFrom = function(buf) {
	var packetCount = buf.byteLength / CONSTS.TransportPacketSize;
	var srcByteOffset = 0, dstByteOffset = 0;

	var result = new ArrayBuffer(buf.byteLength - packetCount * CONSTS.TransportHeaderSize);
	var view = new Uint8Array(result);

	// Join all packets' data
	for(var i = 0; i < packetCount; ++i) {
		var packetBuf = buf.slice(srcByteOffset, CONSTS.TransportPacketSize * (i + 1));
		var th = new TransportHeader();
		th.readFrom(packetBuf);

		var packetData = new Uint8Array(packetBuf.slice(CONSTS.TransportHeaderSize));
		view.set(packetData, dstByteOffset);

		dstByteOffset += (CONSTS.TransportPacketSize - CONSTS.TransportHeaderSize);
		srcByteOffset += CONSTS.TransportPacketSize;
	}

	var dict = new IDictData();
	dict.readFrom(result);
	return dict;
};
