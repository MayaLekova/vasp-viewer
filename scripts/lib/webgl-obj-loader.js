(function (scope, undefined) {
  'use strict';

  var OBJ = {};

  // поддръжка за Node.js
  if (typeof module !== 'undefined') {
    module.exports = OBJ;
  } else {
    scope.OBJ = OBJ;
  }

  /**
   * Основният клас за меш. Поддържа върхове, нормали, текстурни координати
   * и лица. Конструкторът извършва парсването на .obj файла, подаден като стринг.
   *
   * @class Mesh
   * @constructor
   *
   * @param {String} objectData стринг с данните от .obj файла
   */
  OBJ.Mesh = function (objectData) {
    /*
     Секции на .obj файла:
       * 'v': върхове
       * 'vn': нормали във върховете
       * 'f': лица
       * 'vt': текстурни координати
     */
    var verts = [], vertNormals = [], textures = [], unpacked = {};
    // временна структура, която съдържа повтарящи се върхове
    // преди да бъдат изчистени повторенията
    unpacked.verts = [];
    unpacked.norms = [];
    unpacked.textures = [];
    unpacked.hashindices = {};
    unpacked.indices = [];
    unpacked.index = 0;
    // масив от всички редове на файла
    var lines = objectData.split('\n');

    var VERTEX_RE = /^v\s/;
    var NORMAL_RE = /^vn\s/;
    var TEXTURE_RE = /^vt\s/;
    var FACE_RE = /^f\s/;
    var WHITESPACE_RE = /\s+/;

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      var elements = line.split(WHITESPACE_RE);
      elements.shift();

      if (VERTEX_RE.test(line)) {
        // редът описва връх
        verts.push.apply(verts, elements);
      } else if (NORMAL_RE.test(line)) {
        // редът описва нормала
        vertNormals.push.apply(vertNormals, elements);
      } else if (TEXTURE_RE.test(line)) {
        // редът описва текстурни координати
        textures.push.apply(textures, elements);
      } else if (FACE_RE.test(line)) {
        // редът описва лице
        /*
        разделяме лицето на масив от групи върхове
        например:
           f 16/92/11 14/101/22 1/69/1
        става:
          ['16/92/11', '14/101/22', '1/69/1'];
        */
        var quad = false;
        for (var j = 0, eleLen = elements.length; j < eleLen; j++){
            // Триангулация на четириъгълници
            // четириъгълник: 'f v0/t0/vn0 v1/t1/vn1 v2/t2/vn2 v3/t3/vn3/'
            // съответните триъгълници:
            //      'f v0/t0/vn0 v1/t1/vn1 v2/t2/vn2'
            //      'f v2/t2/vn2 v3/t3/vn3 v0/t0/vn0'
            if(j === 3 && !quad) {
                // добавяме v2/t2/vn2 отново преди да преброим до 3
                j = 2;
                quad = true;
            }
            if(elements[j] in unpacked.hashindices){
                unpacked.indices.push(unpacked.hashindices[elements[j]]);
            }
            else{
                /*
                Всеки елемент на масива с редове от лица означава връх, чиито
                атрибути са отделени с '/'. Това ще раздели всеки атрибут в нов масив:
                    '19/92/11'
                става:
                    vertex = ['19', '92', '11'];
                където
                    vertex[0] е индекса на върха
                    vertex[1] е текстурния индекс
                    vertex[2] е индексът на нормалата
                 */
                var vertex = elements[ j ].split( '/' );
                /*
                 Масивите verts, textures, и vertNormals съдържат едномерен масив 
                 с координати.

                 Изваждаме единица, защото индексите в .obj файла са 1-базирани.

                 В едномерния масив използваме отстъпи, за да намерим съответната
                 компонента: +0 е x, +1 е y, +2 е z.
                 */
                // позиция на върха
                unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 0]);
                unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 1]);
                unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 2]);
                // текстурни координати
                if (textures.length) {
                  unpacked.textures.push(+textures[(vertex[1] - 1) * 2 + 0]);
                  unpacked.textures.push(+textures[(vertex[1] - 1) * 2 + 1]);
                }
                // нормали на върховете
                unpacked.norms.push(+vertNormals[(vertex[2] - 1) * 3 + 0]);
                unpacked.norms.push(+vertNormals[(vertex[2] - 1) * 3 + 1]);
                unpacked.norms.push(+vertNormals[(vertex[2] - 1) * 3 + 2]);
                // добавяме новосъздадения връх към списъка с индекси
                unpacked.hashindices[elements[j]] = unpacked.index;
                unpacked.indices.push(unpacked.index);
                unpacked.index += 1;
            }
            if(j === 3 && quad) {
                // добавяме v0/t0/vn0 към втория триъгълник
                unpacked.indices.push( unpacked.hashindices[elements[0]]);
            }
        }
      }
    }
    this.vertices = unpacked.verts;
    this.vertexNormals = unpacked.norms;
    this.textures = unpacked.textures;
    this.indices = unpacked.indices;
  }

  // Помощна функция за създаване на буфер
  var _buildBuffer = function( gl, type, data, itemSize ){
    var buffer = gl.createBuffer();
    var arrayView = type === gl.ARRAY_BUFFER ? Float32Array : Uint16Array;
    gl.bindBuffer(type, buffer);
    gl.bufferData(type, new arrayView(data), gl.STATIC_DRAW);
    buffer.itemSize = itemSize;
    buffer.numItems = data.length / itemSize;
    return buffer;
  }

  /**
   * Приема WebGL контекст и меш, създава буферите и ги закача
   * като атрибути на меша.
   *
   * @param {WebGLRenderingContext} gl инстанцията на контекста от `canvas.getContext('webgl')`
   * @param {Mesh} mesh една инстанция на `OBJ.Mesh`
   *
   * Новосъздадените атрибути на меша са:
   *
   * **normalBuffer**       |съдържа нормалите във върховете
   * normalBuffer.itemSize  |настроено на 3
   * normalBuffer.numItems  |общия брой нормали във върховете
   * |
   * **textureBuffer**      |съдържа текстурните координати
   * textureBuffer.itemSize |настроено на 2
   * textureBuffer.numItems |броя текстурни координати
   * |
   * **vertexBuffer**       |съдържа позициите на върховете
   * vertexBuffer.itemSize  |настроено на 3
   * vertexBuffer.numItems  |общия брой върхове
   * |
   * **indexBuffer**        |съдържа индексите на лицата
   * indexBuffer.itemSize   |настроено на 1
   * indexBuffer.numItems   |общия брой индекси
   *
   */
  OBJ.initMeshBuffers = function( gl, mesh ){
    mesh.normalBuffer = _buildBuffer(gl, gl.ARRAY_BUFFER, mesh.vertexNormals, 3);
    mesh.textureBuffer = _buildBuffer(gl, gl.ARRAY_BUFFER, mesh.textures, 2);
    mesh.vertexBuffer = _buildBuffer(gl, gl.ARRAY_BUFFER, mesh.vertices, 3);
    mesh.indexBuffer = _buildBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, mesh.indices, 1);
  }

  OBJ.deleteMeshBuffers = function( gl, mesh ){
    gl.deleteBuffer(mesh.normalBuffer);
    gl.deleteBuffer(mesh.textureBuffer);
    gl.deleteBuffer(mesh.vertexBuffer);
    gl.deleteBuffer(mesh.indexBuffer);
  }
})(this);

