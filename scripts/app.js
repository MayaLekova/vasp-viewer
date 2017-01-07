function start( )
{
	var	canvas = document.getElementById("picasso");
	canvas.addEventListener('webglcontextlost',function(event){event.preventDefault();},false);
	canvas.addEventListener('webglcontextrestored',function(){init();},false);

	document.getElementById('model-input')
  		.addEventListener('change', readModel, false);

	init();
	drawFrame();
	// simulateData();
}

function init()
{
	gl = getContext("picasso");
	glprog = getProgram(vShader,fShader);
	getVariables();

	gl.enable(gl.DEPTH_TEST);
	gl.clearColor(0.85,0.85,0.85,1);

	identity();
	perspective(30,gl.canvas.width/gl.canvas.height,1,40000);
	gl.uniform1i(uUseNormalMatrix,false);

	gl.uniform3f(uAmbientColor,0.3,0.3,0.3);
	gl.uniform3f(uDiffuseColor,1,1,1);
	gl.uniform3f(uLightDir,0,0,-1);

	// създаваме (засега празна) текстура
	texture = gl.createTexture();

	// зареждаме асинхронно изображението за текстурата
	var image = new Image();
	image.onload = function() {imageLoaded(image)};
	image.src = 'data/leopard.jpg';

	var objStr = document.getElementById('my_cube.obj').innerHTML;
	mesh = new OBJ.Mesh(objStr);

	OBJ.initMeshBuffers(gl, mesh);
}

// функция, която се извиква след зареждането на изображение
function imageLoaded(image)
{
	// правим си текуща текстура
	gl.bindTexture(gl.TEXTURE_2D, texture);
	
	// прехвърляме данните от картинката в текстурата
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
	
	// задаваме филтри за увеличаване и намаляване
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	
	// махаме текуща текстура
	gl.bindTexture(gl.TEXTURE_2D, null);
}

var time = now();
function now() { return (new Date()).getTime()/1000; }

function simulateData()
{
	var message = new ArrayBuffer(32);
	var th = new TransportHeader(CONSTS.Prefix, 1, 1, CONSTS.MediaChannel.commands, CONSTS.TransportFlags.startOfPacket | CONSTS.TransportFlags.important, 42);
	th.writeTo(message);

	var blob = new Blob([message]);
	saveAs(blob, "th.vas");

	var message2 = new ArrayBuffer(64);
	var mh = new MediaHeader(3, 256, 1234);
	mh.writeTo(message2);

	var blob2 = new Blob([message2]);
	saveAs(blob2, "mh.vas");
}

function readModel(e)
{
	var file = e.target.files[0];
	if (!file) {
	    return;
	}
	if(/\.obj/.exec(file.name)) {
		var reader = new FileReader();
		reader.onload = function(e) {
		    var objBuf = e.target.result;
		    var objStr = new TextDecoder('UTF-8').decode(objBuf);

			mesh = new OBJ.Mesh(objStr);
			OBJ.initMeshBuffers(gl, mesh);		    
		};
		reader.readAsArrayBuffer(file);
	} else if(/\.vas/.exec(file.name)) {
		var reader = new FileReader();
		reader.onload = function(e) {
		    var message = e.target.result;
		    var transport = new Transport();
		    var dict = transport.readFrom(message);
		    console.log(dict);
		    console.log(dict.mediaHeader);
		    console.log(dict.entries[0]);

		    var objStr = new TextDecoder('UTF-8').decode(dict.entries[0].data);

			mesh = new OBJ.Mesh(objStr);
			OBJ.initMeshBuffers(gl, mesh);		    
		};
		reader.readAsArrayBuffer(file);
	} else {
		console.log('Unknown file format');
	}
}

function drawFrame()
{
	time = now();
	gl.clear(gl.COLOR_BUFFER_BIT+gl.DEPTH_BUFFER_BIT);
	
	lookAt([8*cos(time/5),8*sin(time/5),1],[0,0,0],[0,0,1]);

	gl.vertexAttrib3fv(aColor,[1,0.75,0]);

	useMatrix();

	gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
	gl.enableVertexAttribArray(aXYZ);
	gl.vertexAttribPointer(aXYZ, mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer);
	gl.enableVertexAttribArray(aNormal);
	gl.vertexAttribPointer(aNormal, mesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

	if(mesh.textures.length) {
		// подаване на текстурни координати
		gl.bindBuffer(gl.ARRAY_BUFFER, mesh.textureBuffer);
		gl.enableVertexAttribArray(aST);
		gl.vertexAttribPointer(aST, mesh.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.uniform1i(uUseTexture,true);

		// ако текстурата е готова, правим я текуща
		if (gl.isTexture(texture))
		{
			gl.bindTexture(gl.TEXTURE_2D, texture);
		}
	} else {
		gl.uniform1i(uUseTexture,false);
		gl.disableVertexAttribArray(aST);
	}

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
	gl.drawElements(gl.TRIANGLES, mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

	requestAnimationFrame(drawFrame);
}
