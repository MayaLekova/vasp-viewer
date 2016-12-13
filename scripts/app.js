function start( )
{
	var	canvas = document.getElementById("picasso");
	canvas.addEventListener('webglcontextlost',function(event){event.preventDefault();},false);
	canvas.addEventListener('webglcontextrestored',function(){init();},false);

	init();
	drawFrame();
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

	var objStr = document.getElementById('my_cube.obj').innerHTML;
	mesh = new OBJ.Mesh(objStr);

	OBJ.initMeshBuffers(gl, mesh);
}

var time = now();
function now() { return (new Date()).getTime()/1000; }

function drawFrame()
{
	time = now();
	gl.clear(gl.COLOR_BUFFER_BIT+gl.DEPTH_BUFFER_BIT);
	
	lookAt([8*cos(time/5),8*sin(time/5),1],[0,0,0],[0,0,1]);

	gl.vertexAttrib3fv(aColor,[1,0.75,0]);

	useMatrix();

	// now to render the mesh
	gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
	gl.enableVertexAttribArray(aXYZ);
	gl.vertexAttribPointer(aXYZ, mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer);
	gl.enableVertexAttribArray(aNormal);
	gl.vertexAttribPointer(aNormal, mesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
	gl.drawElements(gl.TRIANGLES, mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

	requestAnimationFrame(drawFrame);
}
