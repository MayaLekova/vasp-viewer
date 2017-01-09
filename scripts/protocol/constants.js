var CONSTS = {
	MediaChannel: {
		calatog: 0,
		commands: 1,
		animation: 2,
		sound: 3,
		text: 4,
		dicByOrder: 5,
		reserved1: 6,
		reserved2: 7
	},

	AnimationPacketType: {
		freeType:   0,
		iDictType: 2,
		pDictType: 3,
		iScenType: 4,
		pScenType: 5,
		iTextureType: 6,
		pTextureType: 7,
	},

	TransportFlags: {
		startOfPacket: 1 << 0,
		reserved1: 1 << 1,
		reserved2: 1 << 2,
		important: 1 << 3
	},

	Prefix: 0b10010111,

	DictEntryHeaderSize: 24,
	TextureEntryHeaderSize: 24,
	TransportHeaderSize: 4,
	TransportPacketSize: 256,

	BitmapHeaderSize: 54,
}
