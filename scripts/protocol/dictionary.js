var DictEntry = function(
	uuid,
	version,
	reference,
	lod,
	flags,
	type,
	size,
	data
) {
	this.uuid = uuid;
	this.version = version;
	this.reference = reference;
	this.lod = lod;
	this.flags = flags;
	this.type = type;
	this.size = size;
	this.data = data;
};

DictEntry.prototype.readFrom = function(buf) {
	this.uuid = new Uint8Array(buf, 0, 16);

	var verRef = new Uint32Array(buf, 16, 1)[0];
	this.version = verRef & 0xFF;
	this.reference = verRef >>> 8;
	
	var lodFlags = new Uint8Array(buf, 20, 1)[0];
	this.lod = (lodFlags & 0b11110000) >>> 4;
	this.flags = lodFlags & 0b00001111;

	this.type = new Uint8Array(buf, 21, 1)[0];
	this.size = new Uint16Array(buf, 22, 1)[0];
	var dataOffset = 24;
	if(this.size == 0) {
		this.size = new Uint32Array(buf, 24, 1)[0];
		dataOffset += 4;
	}

	this.data = new Uint8Array(buf, dataOffset, this.size);
};

var IDictData = function(
		mediaHeader,
		entriesCount,
		entries
) {
	this.mediaHeader = mediaHeader,
	this.entriesCount = entriesCount,
	this.entries = entries || []
};

IDictData.prototype.readFrom = function(buf) {
	this.mediaHeader = new MediaHeader();
	this.mediaHeader.readFrom(buf);

	this.entriesCount = new Uint32Array(buf, 8, 1)[0];

	var byteOffset = 12;

	for(var i = 0; i < this.entriesCount; ++i) {
		var deBuf = buf.slice(byteOffset);
		this.entries[i] = new DictEntry();
		this.entries[i].readFrom(deBuf);

		byteOffset += CONSTS.DictEntryHeaderSize;
		byteOffset += this.entries[i].size;
	}
};
