var WY3D = WY3D || {};

// based on https://github.com/documentcloud/underscore/blob/bf657be243a075b5e72acc8a83e6f12a564d8f55/underscore.js#L767
WY3D.extend = function ( obj, source ) {

  // ECMAScript5 compatibility based on: http://www.nczonline.net/blog/2012/12/11/are-your-mixins-ecmascript-5-compatible/
  if ( Object.keys ) {

    var keys = Object.keys( source );

    for (var i = 0, il = keys.length; i < il; i++) {

      var prop = keys[i];
      Object.defineProperty( obj, prop, Object.getOwnPropertyDescriptor( source, prop ) );

    }

  } else {

    var safeHasOwnProperty = {}.hasOwnProperty;

    for ( var property in source ) {

      if ( safeHasOwnProperty.call( source, property ) ) {

        obj[property] = source[property];

      }

    }

  }

  return obj;

};

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller
// fixes from Paul Irish and Tino Zijdel
// using 'self' instead of 'window' for compatibility with both NodeJS and IE10.
( function () {

  var lastTime = 0;
  var vendors = [ 'ms', 'moz', 'webkit', 'o' ];

  for ( var x = 0; x < vendors.length && !self.requestAnimationFrame; ++ x ) {

    self.requestAnimationFrame = self[ vendors[ x ] + 'RequestAnimationFrame' ];
    self.cancelAnimationFrame = self[ vendors[ x ] + 'CancelAnimationFrame' ] || self[ vendors[ x ] + 'CancelRequestAnimationFrame' ];

  }

  if ( self.requestAnimationFrame === undefined && self.setTimeout !== undefined ) {

    self.requestAnimationFrame = function ( callback ) {

      var currTime = Date.now(), timeToCall = Math.max( 0, 16 - ( currTime - lastTime ) );
      var id = self.setTimeout( function() { callback( currTime + timeToCall ); }, timeToCall );
      lastTime = currTime + timeToCall;
      return id;

    };

  }

  if( self.cancelAnimationFrame === undefined && self.clearTimeout !== undefined ) {

    self.cancelAnimationFrame = function ( id ) { self.clearTimeout( id ); };

  }

}() );
WY3D.Face3 = (function(){
  
  function Face3(a, b, c, normal, color, materialIndex) {
    this.a = a;
    this.b = b;
    this.c = c;

    this.normal = normal instanceof WY3D.Vector3 ? normal : new WY3D.Vector3();
    this.vertexNormals = normal instanceof Array ? normal : [];

    this.color = color === undefined ? 0xFFFFFFFF : color;
    this.vertexColors = color instanceof Array ? color : [];

    this.vertexTangents = [];

    this.centroid = new WY3D.Vector3();
  }

  Face3.prototype = {
    constructor: WY3D.Face3,
    clone: function(){
      var face = new WY3D.Face3(this.a, this.b, this.c);
      
      face.normal.copy(this.normal);
      face.color.copy(this.color);
      face.centroid.copy(this.centroid);


      var i, il;
      for ( i = 0, il = this.vertexNormals.length; i < il; i ++ ) {
        face.vertexNormals[ i ] = this.vertexNormals[ i ].clone();
      }
      
      for ( i = 0, il = this.vertexColors.length; i < il; i ++ ) {
        face.vertexColors[ i ] = this.vertexColors[ i ].clone();
      }

      for ( i = 0, il = this.vertexTangents.length; i < il; i ++ ) {
        face.vertexTangents[ i ] = this.vertexTangents[ i ].clone();
      }

      return face;
    }
  };

  return Face3;
})();
WY3D.Renderer = (function(){
  function Renderer(params){

    this.programs = [];
    this.camera = params.camera;
    this.perspective = params.perspective;
    this.canvasDom = params.canvasDom;
    this.gl = null;

    this.initGL();
  }

  Renderer.prototype = {
    initGL: function(){
      if (this.canvasDom === undefined) {
        new Error("GL을 초기화하기위한 Canvas가 생성되지 않았음");
      }

      this.gl = getWebGLContext(this.canvasDom);
      window.gl = this.gl;
    },

    addProgram: function(program){
      if (program === undefined) {
        new Error("program should not be undefiend");
        return;
      } else {
        this.programs.push(program);  
      }
    },


    clear: function(r, g, b, a){
      this.gl.clearColor(r, g, b, a);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    },

    render: function(){
      for (var i = 0; i < this.programs.length; i ++) {
        this.programs[i].render();
      }
    }
  };

  return Renderer;
})();WY3D.WebGLProgram = (function(){
  function WebGLProgram(params){


    if (params.vertexShader === undefined || params.fragmentShader === undefined) {
      console.error("vertex shader or fragment shader must be with parameters.");
      return;
    }
    this.vertexShader = params.vertexShader;
    this.fragmentShader = params.fragmentShader;
    
    this.program = null;
    this.locations = {};

    //this.compileProgram();
  }

  WebGLProgram.prototype = {
    compileProgram: function(){
      this.program = createProgram(gl, this.vertexShader, this.fragmentShader);
      return this.program !== null;
    },

    getLocations : function (uniformOrAttributeNames) {
      var foundLocations = {},
          i;
      for (i = 0; i < uniformOrAttributeNames.length; ++i) {
          var name = uniformOrAttributeNames[i],
              location = -1;
          if (name.indexOf("a_") === 0) {
              location = gl.getAttribLocation(this.program, name);
              if (location === -1) {
                  throw "Program doesn't have required attribute: " + name;
              }

              foundLocations[name.slice(2)] = location;
          } else if (name.indexOf("u_") === 0) {
              location = gl.getUniformLocation(this.program, name);
              if (location === null) {
                  throw "Program doesn't have required uniform: " + name;
              }

              foundLocations[name.slice(2)] = location;
          } else {
              throw "Couldn't figure out your intent. All uniforms should start with 'u_' prefix, and attributes with 'a_'";
          }
  
      }

      this.locations = foundLocations;
    },

    setVertexAttribArray: function(locationName){
      gl.enableVertexAttribArray(this.locations[locationName]);
    },
    
    render: function(){

    }
  };

  return WebGLProgram;
})();
WY3D.Object3D = (function(){
  function Object3D(){


    this.up = new WY3D.Vector3(0, 1, 0);
    this.position = new WY3D.Vector3();
    this._rotation = new WY3D.Euler();
    this._quaternion = new WY3D.Quaternion();

    this.scale = new WY3D.Vector3(1, 1, 1);

    this._rotation._quaternion = this._quaternion;
    this._quaternion._euler = this._rotation;

    this.matrix = new WY3D.Matrix4();
    this.matrixWorld = new WY3D.Matrix4();

  }

  Object3D.prototype = {

    get rotation() {
      return this._rotation;
    },

    set rotation(value) {
      this._rotation = value;
      this._rotation._quaternion = this._quaternion;
      this._quaternion._euler = this._rotation;
      this._rotation._updateQuaternion();
    },

    get quaternion() {
      return this._quaternion;
    },

    set quaternion(value) {
      this._quaternion = value;
      this._quaternion._rotations = this._euler;
      this._euler._quaternion = this._quaternion;
      this._quaternion.updateEuler();
    },


    updateMatrix: function () {

      this.matrix.compose( this.position, this.quaternion, this.scale );

    },

  };

  return Object3D;
})();WY3D.Mesh = (function(){
  function Mesh(geometry){
    WY3D.Object3D.call(this);

    this.geometry = geometry;
  }

  Mesh.prototype = Object.create(WY3D.Object3D.prototype);
  
  return Mesh;
})();

WY3D.Geometry = (function(){
  function Geometry(){
    this.vertices = [];
    this.colors = [];
    this.faces = [];    
    this.faceVertexUvs = [[]];
  }

  Geometry.prototype = {
    constructor: Geometry,
    
    computeCentroids: function () {

      var f, fl, face;

      for ( f = 0, fl = this.faces.length; f < fl; f ++ ) {

        face = this.faces[ f ];
        face.centroid.set( 0, 0, 0 );

        face.centroid.add( this.vertices[ face.a ] );
        face.centroid.add( this.vertices[ face.b ] );
        face.centroid.add( this.vertices[ face.c ] );
        face.centroid.divideScalar( 3 );

      }
    }

    
  };

  return Geometry;
})();
WY3D.PlaneGeometry = (function(){
  function PlaneGeometry(params) {

    WY3D.Geometry.call(this);
    
    this.width = params.width;
    this.height = params.height;
    this.widthSegments = params.widthSegments || 1;
    this.heightSegments = params.heightSegments || 1;

    var ix, iz;
    var width_half = this.width / 2;
    var height_half = this.height / 2;


    var gridX = this.widthSegments;
    var gridZ = this.heightSegments;

    var gridX1 = gridX + 1;
    var gridZ1 = gridZ + 1;

    var segment_width = this.width / gridX;
    var segment_height = this.height / gridZ;

    var normal = new WY3D.Vector3(0, 0, 1);

    for (iz = 0; iz < gridZ1; iz++) {
      for (ix = 0; ix < gridX1; ix ++) {
        var x = ix * segment_width - width_half;
        var y = iz * segment_height - height_half;

        this.vertices.push(new WY3D.Vector3(x, -y, 0));
      }
    }

    
    for (iz = 0; iz < gridZ; iz++) {
      for (ix = 0; ix < gridX; ix++) {

        var a = ix + gridX1 * iz;
        var b = ix + gridX1 * (iz + 1);
        var c = (ix + 1) + gridX1 * (iz + 1);
        var d = (ix + 1) + gridX1 * iz;

        var uva = new WY3D.Vector2( ix / gridX, 1 - iz / gridZ );
        var uvb = new WY3D.Vector2( ix / gridX, 1 - ( iz + 1 ) / gridZ );
        var uvc = new WY3D.Vector2( ( ix + 1 ) / gridX, 1 - ( iz + 1 ) / gridZ );
        var uvd = new WY3D.Vector2( ( ix + 1 ) / gridX, 1 - iz / gridZ );

        var face = new WY3D.Face3( a, b, d );
        face.normal.copy( normal );
        face.vertexNormals.push( normal.clone(), normal.clone(), normal.clone() );

        this.faces.push( face );
        this.faceVertexUvs[ 0 ].push( [ uva, uvb, uvd ] );

        face = new WY3D.Face3( b, c, d );
        face.normal.copy( normal );
        face.vertexNormals.push( normal.clone(), normal.clone(), normal.clone() );

        this.faces.push( face );
        this.faceVertexUvs[ 0 ].push( [ uvb.clone(), uvc, uvd.clone() ] );
      } 
    }


    this.computeCentroids();
  }

  return PlaneGeometry;
})();


WY3D.PlaneGeometry.prototype = Object.create( WY3D.Geometry.prototype );/**
 * @author mikael emtinger / http://gomo.se/
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author bhouston / http://exocortex.com
 */

WY3D.Quaternion = function ( x, y, z, w ) {

  this._x = x || 0;
  this._y = y || 0;
  this._z = z || 0;
  this._w = ( w !== undefined ) ? w : 1;

};

WY3D.Quaternion.prototype = {

  constructor: WY3D.Quaternion,

  _x: 0,_y: 0, _z: 0, _w: 0,

  _euler: undefined,

  _updateEuler: function ( callback ) {

    if ( this._euler !== undefined ) {

      this._euler.setFromQuaternion( this, undefined, false );

    }

  },

  get x () {

    return this._x;

  },

  set x ( value ) {

    this._x = value;
    this._updateEuler();

  },

  get y () {

    return this._y;

  },

  set y ( value ) {

    this._y = value;
    this._updateEuler();

  },

  get z () {

    return this._z;

  },

  set z ( value ) {

    this._z = value;
    this._updateEuler();

  },

  get w () {

    return this._w;

  },

  set w ( value ) {

    this._w = value;
    this._updateEuler();

  },

  set: function ( x, y, z, w ) {

    this._x = x;
    this._y = y;
    this._z = z;
    this._w = w;

    this._updateEuler();

    return this;

  },

  copy: function ( quaternion ) {

    this._x = quaternion._x;
    this._y = quaternion._y;
    this._z = quaternion._z;
    this._w = quaternion._w;

    this._updateEuler();

    return this;

  },

  setFromEuler: function ( euler, update ) {

    if ( euler instanceof WY3D.Euler === false ) {

      throw new Error( 'ERROR: Quaternion\'s .setFromEuler() now expects a Euler rotation rather than a Vector3 and order.  Please update your code.' );
    }

    // http://www.mathworks.com/matlabcentral/fileexchange/
    //  20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/
    //  content/SpinCalc.m

    var c1 = Math.cos( euler._x / 2 );
    var c2 = Math.cos( euler._y / 2 );
    var c3 = Math.cos( euler._z / 2 );
    var s1 = Math.sin( euler._x / 2 );
    var s2 = Math.sin( euler._y / 2 );
    var s3 = Math.sin( euler._z / 2 );

    if ( euler.order === 'XYZ' ) {

      this._x = s1 * c2 * c3 + c1 * s2 * s3;
      this._y = c1 * s2 * c3 - s1 * c2 * s3;
      this._z = c1 * c2 * s3 + s1 * s2 * c3;
      this._w = c1 * c2 * c3 - s1 * s2 * s3;

    } else if ( euler.order === 'YXZ' ) {

      this._x = s1 * c2 * c3 + c1 * s2 * s3;
      this._y = c1 * s2 * c3 - s1 * c2 * s3;
      this._z = c1 * c2 * s3 - s1 * s2 * c3;
      this._w = c1 * c2 * c3 + s1 * s2 * s3;

    } else if ( euler.order === 'ZXY' ) {

      this._x = s1 * c2 * c3 - c1 * s2 * s3;
      this._y = c1 * s2 * c3 + s1 * c2 * s3;
      this._z = c1 * c2 * s3 + s1 * s2 * c3;
      this._w = c1 * c2 * c3 - s1 * s2 * s3;

    } else if ( euler.order === 'ZYX' ) {

      this._x = s1 * c2 * c3 - c1 * s2 * s3;
      this._y = c1 * s2 * c3 + s1 * c2 * s3;
      this._z = c1 * c2 * s3 - s1 * s2 * c3;
      this._w = c1 * c2 * c3 + s1 * s2 * s3;

    } else if ( euler.order === 'YZX' ) {

      this._x = s1 * c2 * c3 + c1 * s2 * s3;
      this._y = c1 * s2 * c3 + s1 * c2 * s3;
      this._z = c1 * c2 * s3 - s1 * s2 * c3;
      this._w = c1 * c2 * c3 - s1 * s2 * s3;

    } else if ( euler.order === 'XZY' ) {

      this._x = s1 * c2 * c3 - c1 * s2 * s3;
      this._y = c1 * s2 * c3 - s1 * c2 * s3;
      this._z = c1 * c2 * s3 + s1 * s2 * c3;
      this._w = c1 * c2 * c3 + s1 * s2 * s3;

    }

    if ( update !== false ) this._updateEuler();

    return this;

  },

  setFromAxisAngle: function ( axis, angle ) {

    // from http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm
    // axis have to be normalized

    var halfAngle = angle / 2, s = Math.sin( halfAngle );

    this._x = axis.x * s;
    this._y = axis.y * s;
    this._z = axis.z * s;
    this._w = Math.cos( halfAngle );

    this._updateEuler();

    return this;

  },

  setFromRotationMatrix: function ( m ) {

    // http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm

    // assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

    var te = m.elements,

      m11 = te[0], m12 = te[4], m13 = te[8],
      m21 = te[1], m22 = te[5], m23 = te[9],
      m31 = te[2], m32 = te[6], m33 = te[10],

      trace = m11 + m22 + m33,
      s;

    if ( trace > 0 ) {

      s = 0.5 / Math.sqrt( trace + 1.0 );

      this._w = 0.25 / s;
      this._x = ( m32 - m23 ) * s;
      this._y = ( m13 - m31 ) * s;
      this._z = ( m21 - m12 ) * s;

    } else if ( m11 > m22 && m11 > m33 ) {

      s = 2.0 * Math.sqrt( 1.0 + m11 - m22 - m33 );

      this._w = (m32 - m23 ) / s;
      this._x = 0.25 * s;
      this._y = (m12 + m21 ) / s;
      this._z = (m13 + m31 ) / s;

    } else if ( m22 > m33 ) {

      s = 2.0 * Math.sqrt( 1.0 + m22 - m11 - m33 );

      this._w = (m13 - m31 ) / s;
      this._x = (m12 + m21 ) / s;
      this._y = 0.25 * s;
      this._z = (m23 + m32 ) / s;

    } else {

      s = 2.0 * Math.sqrt( 1.0 + m33 - m11 - m22 );

      this._w = ( m21 - m12 ) / s;
      this._x = ( m13 + m31 ) / s;
      this._y = ( m23 + m32 ) / s;
      this._z = 0.25 * s;

    }

    this._updateEuler();

    return this;

  },

  inverse: function () {

    this.conjugate().normalize();

    return this;

  },

  conjugate: function () {

    this._x *= -1;
    this._y *= -1;
    this._z *= -1;

    this._updateEuler();

    return this;

  },

  lengthSq: function () {

    return this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w;

  },

  length: function () {

    return Math.sqrt( this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w );

  },

  normalize: function () {

    var l = this.length();

    if ( l === 0 ) {

      this._x = 0;
      this._y = 0;
      this._z = 0;
      this._w = 1;

    } else {

      l = 1 / l;

      this._x = this._x * l;
      this._y = this._y * l;
      this._z = this._z * l;
      this._w = this._w * l;

    }

    return this;

  },

  multiply: function ( q, p ) {

    if ( p !== undefined ) {

      console.warn( 'DEPRECATED: Quaternion\'s .multiply() now only accepts one argument. Use .multiplyQuaternions( a, b ) instead.' );
      return this.multiplyQuaternions( q, p );

    }

    return this.multiplyQuaternions( this, q );

  },

  multiplyQuaternions: function ( a, b ) {

    // from http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/code/index.htm

    var qax = a._x, qay = a._y, qaz = a._z, qaw = a._w;
    var qbx = b._x, qby = b._y, qbz = b._z, qbw = b._w;

    this._x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
    this._y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
    this._z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
    this._w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;

    this._updateEuler();

    return this;

  },

  multiplyVector3: function ( vector ) {

    console.warn( 'DEPRECATED: Quaternion\'s .multiplyVector3() has been removed. Use is now vector.applyQuaternion( quaternion ) instead.' );
    return vector.applyQuaternion( this );

  },

  slerp: function ( qb, t ) {

    var x = this._x, y = this._y, z = this._z, w = this._w;

    // http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/

    var cosHalfTheta = w * qb._w + x * qb._x + y * qb._y + z * qb._z;

    if ( cosHalfTheta < 0 ) {

      this._w = -qb._w;
      this._x = -qb._x;
      this._y = -qb._y;
      this._z = -qb._z;

      cosHalfTheta = -cosHalfTheta;

    } else {

      this.copy( qb );

    }

    if ( cosHalfTheta >= 1.0 ) {

      this._w = w;
      this._x = x;
      this._y = y;
      this._z = z;

      return this;

    }

    var halfTheta = Math.acos( cosHalfTheta );
    var sinHalfTheta = Math.sqrt( 1.0 - cosHalfTheta * cosHalfTheta );

    if ( Math.abs( sinHalfTheta ) < 0.001 ) {

      this._w = 0.5 * ( w + this._w );
      this._x = 0.5 * ( x + this._x );
      this._y = 0.5 * ( y + this._y );
      this._z = 0.5 * ( z + this._z );

      return this;

    }

    var ratioA = Math.sin( ( 1 - t ) * halfTheta ) / sinHalfTheta,
    ratioB = Math.sin( t * halfTheta ) / sinHalfTheta;

    this._w = ( w * ratioA + this._w * ratioB );
    this._x = ( x * ratioA + this._x * ratioB );
    this._y = ( y * ratioA + this._y * ratioB );
    this._z = ( z * ratioA + this._z * ratioB );

    this._updateEuler();

    return this;

  },

  equals: function ( quaternion ) {

    return ( quaternion._x === this._x ) && ( quaternion._y === this._y ) && ( quaternion._z === this._z ) && ( quaternion._w === this._w );

  },

  fromArray: function ( array ) {

    this._x = array[ 0 ];
    this._y = array[ 1 ];
    this._z = array[ 2 ];
    this._w = array[ 3 ];

    this._updateEuler();

    return this;

  },

  toArray: function () {

    return [ this._x, this._y, this._z, this._w ];

  },

  clone: function () {

    return new WY3D.Quaternion( this._x, this._y, this._z, this._w );

  }

};

WY3D.Quaternion.slerp = function ( qa, qb, qm, t ) {

  return qm.copy( qa ).slerp( qb, t );

};
/**
 * @author mrdoob / http://mrdoob.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author bhouston / http://exocortex.com
 */

WY3D.Euler = function ( x, y, z, order ) {

  this._x = x || 0;
  this._y = y || 0;
  this._z = z || 0;
  this._order = order || WY3D.Euler.DefaultOrder;

};

WY3D.Euler.RotationOrders = [ 'XYZ', 'YZX', 'ZXY', 'XZY', 'YXZ', 'ZYX' ];

WY3D.Euler.DefaultOrder = 'XYZ';

WY3D.Euler.prototype = {

  constructor: WY3D.Euler,

  _x: 0, _y: 0, _z: 0, _order: WY3D.Euler.DefaultOrder,

  _quaternion: undefined,

  _updateQuaternion: function () {

    if ( this._quaternion !== undefined ) {

      this._quaternion.setFromEuler( this, false );

    }

  },

  get x () {

    return this._x;

  },

  set x ( value ) {

    this._x = value;
    this._updateQuaternion();

  },

  get y () {

    return this._y;

  },

  set y ( value ) {

    this._y = value;
    this._updateQuaternion();

  },

  get z () {

    return this._z;

  },

  set z ( value ) {

    this._z = value;
    this._updateQuaternion();

  },

  get order () {

    return this._order;

  },

  set order ( value ) {

    this._order = value;
    this._updateQuaternion();

  },

  set: function ( x, y, z, order ) {

    this._x = x;
    this._y = y;
    this._z = z;
    this._order = order || this._order;

    this._updateQuaternion();

    return this;

  },

  copy: function ( euler ) {

    this._x = euler._x;
    this._y = euler._y;
    this._z = euler._z;
    this._order = euler._order;

    this._updateQuaternion();

    return this;

  },

  setFromRotationMatrix: function ( m, order ) {

    // assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

    // clamp, to handle numerical problems

    function clamp( x ) {

      return Math.min( Math.max( x, -1 ), 1 );

    }

    var te = m.elements;
    var m11 = te[0], m12 = te[4], m13 = te[8];
    var m21 = te[1], m22 = te[5], m23 = te[9];
    var m31 = te[2], m32 = te[6], m33 = te[10];

    order = order || this._order;

    if ( order === 'XYZ' ) {

      this._y = Math.asin( clamp( m13 ) );

      if ( Math.abs( m13 ) < 0.99999 ) {

        this._x = Math.atan2( - m23, m33 );
        this._z = Math.atan2( - m12, m11 );

      } else {

        this._x = Math.atan2( m32, m22 );
        this._z = 0;

      }

    } else if ( order === 'YXZ' ) {

      this._x = Math.asin( - clamp( m23 ) );

      if ( Math.abs( m23 ) < 0.99999 ) {

        this._y = Math.atan2( m13, m33 );
        this._z = Math.atan2( m21, m22 );

      } else {

        this._y = Math.atan2( - m31, m11 );
        this._z = 0;

      }

    } else if ( order === 'ZXY' ) {

      this._x = Math.asin( clamp( m32 ) );

      if ( Math.abs( m32 ) < 0.99999 ) {

        this._y = Math.atan2( - m31, m33 );
        this._z = Math.atan2( - m12, m22 );

      } else {

        this._y = 0;
        this._z = Math.atan2( m21, m11 );

      }

    } else if ( order === 'ZYX' ) {

      this._y = Math.asin( - clamp( m31 ) );

      if ( Math.abs( m31 ) < 0.99999 ) {

        this._x = Math.atan2( m32, m33 );
        this._z = Math.atan2( m21, m11 );

      } else {

        this._x = 0;
        this._z = Math.atan2( - m12, m22 );

      }

    } else if ( order === 'YZX' ) {

      this._z = Math.asin( clamp( m21 ) );

      if ( Math.abs( m21 ) < 0.99999 ) {

        this._x = Math.atan2( - m23, m22 );
        this._y = Math.atan2( - m31, m11 );

      } else {

        this._x = 0;
        this._y = Math.atan2( m13, m33 );

      }

    } else if ( order === 'XZY' ) {

      this._z = Math.asin( - clamp( m12 ) );

      if ( Math.abs( m12 ) < 0.99999 ) {

        this._x = Math.atan2( m32, m22 );
        this._y = Math.atan2( m13, m11 );

      } else {

        this._x = Math.atan2( - m23, m33 );
        this._y = 0;

      }

    } else {

      console.warn( 'WARNING: Euler.setFromRotationMatrix() given unsupported order: ' + order );

    }

    this._order = order;

    this._updateQuaternion();

    return this;

  },

  setFromQuaternion: function ( q, order, update ) {

    // q is assumed to be normalized

    // clamp, to handle numerical problems

    function clamp( x ) {

      return Math.min( Math.max( x, -1 ), 1 );

    }

    // http://www.mathworks.com/matlabcentral/fileexchange/20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/content/SpinCalc.m

    var sqx = q.x * q.x;
    var sqy = q.y * q.y;
    var sqz = q.z * q.z;
    var sqw = q.w * q.w;

    order = order || this._order;

    if ( order === 'XYZ' ) {

      this._x = Math.atan2( 2 * ( q.x * q.w - q.y * q.z ), ( sqw - sqx - sqy + sqz ) );
      this._y = Math.asin(  clamp( 2 * ( q.x * q.z + q.y * q.w ) ) );
      this._z = Math.atan2( 2 * ( q.z * q.w - q.x * q.y ), ( sqw + sqx - sqy - sqz ) );

    } else if ( order ===  'YXZ' ) {

      this._x = Math.asin(  clamp( 2 * ( q.x * q.w - q.y * q.z ) ) );
      this._y = Math.atan2( 2 * ( q.x * q.z + q.y * q.w ), ( sqw - sqx - sqy + sqz ) );
      this._z = Math.atan2( 2 * ( q.x * q.y + q.z * q.w ), ( sqw - sqx + sqy - sqz ) );

    } else if ( order === 'ZXY' ) {

      this._x = Math.asin(  clamp( 2 * ( q.x * q.w + q.y * q.z ) ) );
      this._y = Math.atan2( 2 * ( q.y * q.w - q.z * q.x ), ( sqw - sqx - sqy + sqz ) );
      this._z = Math.atan2( 2 * ( q.z * q.w - q.x * q.y ), ( sqw - sqx + sqy - sqz ) );

    } else if ( order === 'ZYX' ) {

      this._x = Math.atan2( 2 * ( q.x * q.w + q.z * q.y ), ( sqw - sqx - sqy + sqz ) );
      this._y = Math.asin(  clamp( 2 * ( q.y * q.w - q.x * q.z ) ) );
      this._z = Math.atan2( 2 * ( q.x * q.y + q.z * q.w ), ( sqw + sqx - sqy - sqz ) );

    } else if ( order === 'YZX' ) {

      this._x = Math.atan2( 2 * ( q.x * q.w - q.z * q.y ), ( sqw - sqx + sqy - sqz ) );
      this._y = Math.atan2( 2 * ( q.y * q.w - q.x * q.z ), ( sqw + sqx - sqy - sqz ) );
      this._z = Math.asin(  clamp( 2 * ( q.x * q.y + q.z * q.w ) ) );

    } else if ( order === 'XZY' ) {

      this._x = Math.atan2( 2 * ( q.x * q.w + q.y * q.z ), ( sqw - sqx + sqy - sqz ) );
      this._y = Math.atan2( 2 * ( q.x * q.z + q.y * q.w ), ( sqw + sqx - sqy - sqz ) );
      this._z = Math.asin(  clamp( 2 * ( q.z * q.w - q.x * q.y ) ) );

    } else {

      console.warn( 'WARNING: Euler.setFromQuaternion() given unsupported order: ' + order );

    }

    this._order = order;

    if ( update !== false ) this._updateQuaternion();

    return this;

  },

  reorder: function () {

    // WARNING: this discards revolution information -bhouston

    var q = new WY3D.Quaternion();

    return function ( newOrder ) {

      q.setFromEuler( this );
      this.setFromQuaternion( q, newOrder );

    };


  }(),

  fromArray: function ( array ) {

    this._x = array[ 0 ];
    this._y = array[ 1 ];
    this._z = array[ 2 ];
    if ( array[ 3 ] !== undefined ) this._order = array[ 3 ];

    this._updateQuaternion();

    return this;

  },

  toArray: function () {

    return [ this._x, this._y, this._z, this._order ];

  },

  equals: function ( euler ) {

    return ( euler._x === this._x ) && ( euler._y === this._y ) && ( euler._z === this._z ) && ( euler._order === this._order );

  },

  clone: function () {

    return new WY3D.Euler( this._x, this._y, this._z, this._order );

  }

};
/**
 * @author mrdoob / http://mrdoob.com/
 * @author philogb / http://blog.thejit.org/
 * @author egraether / http://egraether.com/
 * @author zz85 / http://www.lab4games.net/zz85/blog
 */

WY3D.Vector2 = function ( x, y ) {

  this.x = x || 0;
  this.y = y || 0;

};

WY3D.Vector2.prototype = {

  constructor: WY3D.Vector2,

  set: function ( x, y ) {

    this.x = x;
    this.y = y;

    return this;

  },

  setX: function ( x ) {

    this.x = x;

    return this;

  },

  setY: function ( y ) {

    this.y = y;

    return this;

  },


  setComponent: function ( index, value ) {

    switch ( index ) {

      case 0: this.x = value; break;
      case 1: this.y = value; break;
      default: throw new Error( "index is out of range: " + index );

    }

  },

  getComponent: function ( index ) {

    switch ( index ) {

      case 0: return this.x;
      case 1: return this.y;
      default: throw new Error( "index is out of range: " + index );

    }

  },

  copy: function ( v ) {

    this.x = v.x;
    this.y = v.y;

    return this;

  },

  add: function ( v, w ) {

    if ( w !== undefined ) {

      console.warn( 'DEPRECATED: Vector2\'s .add() now only accepts one argument. Use .addVectors( a, b ) instead.' );
      return this.addVectors( v, w );

    }

    this.x += v.x;
    this.y += v.y;

    return this;

  },

  addVectors: function ( a, b ) {

    this.x = a.x + b.x;
    this.y = a.y + b.y;

    return this;

  },

  addScalar: function ( s ) {

    this.x += s;
    this.y += s;

    return this;

  },

  sub: function ( v, w ) {

    if ( w !== undefined ) {

      console.warn( 'DEPRECATED: Vector2\'s .sub() now only accepts one argument. Use .subVectors( a, b ) instead.' );
      return this.subVectors( v, w );

    }

    this.x -= v.x;
    this.y -= v.y;

    return this;

  },

  subVectors: function ( a, b ) {

    this.x = a.x - b.x;
    this.y = a.y - b.y;

    return this;

  },

  multiplyScalar: function ( s ) {

    this.x *= s;
    this.y *= s;

    return this;

  },

  divideScalar: function ( scalar ) {

    if ( scalar !== 0 ) {

      var invScalar = 1 / scalar;

      this.x *= invScalar;
      this.y *= invScalar;

    } else {

      this.x = 0;
      this.y = 0;

    }

    return this;

  },

  min: function ( v ) {

    if ( this.x > v.x ) {

      this.x = v.x;

    }

    if ( this.y > v.y ) {

      this.y = v.y;

    }

    return this;

  },

  max: function ( v ) {

    if ( this.x < v.x ) {

      this.x = v.x;

    }

    if ( this.y < v.y ) {

      this.y = v.y;

    }

    return this;

  },

  clamp: function ( min, max ) {

    // This function assumes min < max, if this assumption isn't true it will not operate correctly

    if ( this.x < min.x ) {

      this.x = min.x;

    } else if ( this.x > max.x ) {

      this.x = max.x;

    }

    if ( this.y < min.y ) {

      this.y = min.y;

    } else if ( this.y > max.y ) {

      this.y = max.y;

    }

    return this;

  },

  negate: function() {

    return this.multiplyScalar( - 1 );

  },

  dot: function ( v ) {

    return this.x * v.x + this.y * v.y;

  },

  lengthSq: function () {

    return this.x * this.x + this.y * this.y;

  },

  length: function () {

    return Math.sqrt( this.x * this.x + this.y * this.y );

  },

  normalize: function () {

    return this.divideScalar( this.length() );

  },

  distanceTo: function ( v ) {

    return Math.sqrt( this.distanceToSquared( v ) );

  },

  distanceToSquared: function ( v ) {

    var dx = this.x - v.x, dy = this.y - v.y;
    return dx * dx + dy * dy;

  },

  setLength: function ( l ) {

    var oldLength = this.length();

    if ( oldLength !== 0 && l !== oldLength ) {

      this.multiplyScalar( l / oldLength );
    }

    return this;

  },

  lerp: function ( v, alpha ) {

    this.x += ( v.x - this.x ) * alpha;
    this.y += ( v.y - this.y ) * alpha;

    return this;

  },

  equals: function( v ) {

    return ( ( v.x === this.x ) && ( v.y === this.y ) );

  },

  fromArray: function ( array ) {

    this.x = array[ 0 ];
    this.y = array[ 1 ];

    return this;

  },

  toArray: function () {

    return [ this.x, this.y ];

  },

  clone: function () {

    return new WY3D.Vector2( this.x, this.y );

  }

};
/**
 * @author mrdoob / http://mrdoob.com/
 * @author *kile / http://kile.stravaganza.org/
 * @author philogb / http://blog.thejit.org/
 * @author mikael emtinger / http://gomo.se/
 * @author egraether / http://egraether.com/
 * @author WestLangley / http://github.com/WestLangley
 */

WY3D.Vector3 = function ( x, y, z ) {

  this.x = x || 0;
  this.y = y || 0;
  this.z = z || 0;

};

WY3D.Vector3.prototype = {

  constructor: WY3D.Vector3,

  set: function ( x, y, z ) {

    this.x = x;
    this.y = y;
    this.z = z;

    return this;

  },

  setX: function ( x ) {

    this.x = x;

    return this;

  },

  setY: function ( y ) {

    this.y = y;

    return this;

  },

  setZ: function ( z ) {

    this.z = z;

    return this;

  },

  setComponent: function ( index, value ) {

    switch ( index ) {

      case 0: this.x = value; break;
      case 1: this.y = value; break;
      case 2: this.z = value; break;
      default: throw new Error( "index is out of range: " + index );

    }

  },

  getComponent: function ( index ) {

    switch ( index ) {

      case 0: return this.x;
      case 1: return this.y;
      case 2: return this.z;
      default: throw new Error( "index is out of range: " + index );

    }

  },

  copy: function ( v ) {

    this.x = v.x;
    this.y = v.y;
    this.z = v.z;

    return this;

  },

  add: function ( v, w ) {

    if ( w !== undefined ) {

      console.warn( 'DEPRECATED: Vector3\'s .add() now only accepts one argument. Use .addVectors( a, b ) instead.' );
      return this.addVectors( v, w );

    }

    this.x += v.x;
    this.y += v.y;
    this.z += v.z;

    return this;

  },

  addScalar: function ( s ) {

    this.x += s;
    this.y += s;
    this.z += s;

    return this;

  },

  addVectors: function ( a, b ) {

    this.x = a.x + b.x;
    this.y = a.y + b.y;
    this.z = a.z + b.z;

    return this;

  },

  sub: function ( v, w ) {

    if ( w !== undefined ) {

      console.warn( 'DEPRECATED: Vector3\'s .sub() now only accepts one argument. Use .subVectors( a, b ) instead.' );
      return this.subVectors( v, w );

    }

    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;

    return this;

  },

  subVectors: function ( a, b ) {

    this.x = a.x - b.x;
    this.y = a.y - b.y;
    this.z = a.z - b.z;

    return this;

  },

  multiply: function ( v, w ) {

    if ( w !== undefined ) {

      console.warn( 'DEPRECATED: Vector3\'s .multiply() now only accepts one argument. Use .multiplyVectors( a, b ) instead.' );
      return this.multiplyVectors( v, w );

    }

    this.x *= v.x;
    this.y *= v.y;
    this.z *= v.z;

    return this;

  },

  multiplyScalar: function ( scalar ) {

    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;

    return this;

  },

  multiplyVectors: function ( a, b ) {

    this.x = a.x * b.x;
    this.y = a.y * b.y;
    this.z = a.z * b.z;

    return this;

  },

  applyMatrix3: function ( m ) {

    var x = this.x;
    var y = this.y;
    var z = this.z;

    var e = m.elements;

    this.x = e[0] * x + e[3] * y + e[6] * z;
    this.y = e[1] * x + e[4] * y + e[7] * z;
    this.z = e[2] * x + e[5] * y + e[8] * z;

    return this;

  },

  applyMatrix4: function ( m ) {

    // input: WY3D.Matrix4 affine matrix

    var x = this.x, y = this.y, z = this.z;

    var e = m.elements;

    this.x = e[0] * x + e[4] * y + e[8]  * z + e[12];
    this.y = e[1] * x + e[5] * y + e[9]  * z + e[13];
    this.z = e[2] * x + e[6] * y + e[10] * z + e[14];

    return this;

  },

  applyProjection: function ( m ) {

    // input: WY3D.Matrix4 projection matrix

    var x = this.x, y = this.y, z = this.z;

    var e = m.elements;
    var d = 1 / ( e[3] * x + e[7] * y + e[11] * z + e[15] ); // perspective divide

    this.x = ( e[0] * x + e[4] * y + e[8]  * z + e[12] ) * d;
    this.y = ( e[1] * x + e[5] * y + e[9]  * z + e[13] ) * d;
    this.z = ( e[2] * x + e[6] * y + e[10] * z + e[14] ) * d;

    return this;

  },

  applyQuaternion: function ( q ) {

    var x = this.x;
    var y = this.y;
    var z = this.z;

    var qx = q.x;
    var qy = q.y;
    var qz = q.z;
    var qw = q.w;

    // calculate quat * vector

    var ix =  qw * x + qy * z - qz * y;
    var iy =  qw * y + qz * x - qx * z;
    var iz =  qw * z + qx * y - qy * x;
    var iw = -qx * x - qy * y - qz * z;

    // calculate result * inverse quat

    this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;

    return this;

  },

  transformDirection: function ( m ) {

    // input: WY3D.Matrix4 affine matrix
    // vector interpreted as a direction

    var x = this.x, y = this.y, z = this.z;

    var e = m.elements;

    this.x = e[0] * x + e[4] * y + e[8]  * z;
    this.y = e[1] * x + e[5] * y + e[9]  * z;
    this.z = e[2] * x + e[6] * y + e[10] * z;

    this.normalize();

    return this;

  },

  divide: function ( v ) {

    this.x /= v.x;
    this.y /= v.y;
    this.z /= v.z;

    return this;

  },

  divideScalar: function ( scalar ) {

    if ( scalar !== 0 ) {

      var invScalar = 1 / scalar;

      this.x *= invScalar;
      this.y *= invScalar;
      this.z *= invScalar;

    } else {

      this.x = 0;
      this.y = 0;
      this.z = 0;

    }

    return this;

  },

  min: function ( v ) {

    if ( this.x > v.x ) {

      this.x = v.x;

    }

    if ( this.y > v.y ) {

      this.y = v.y;

    }

    if ( this.z > v.z ) {

      this.z = v.z;

    }

    return this;

  },

  max: function ( v ) {

    if ( this.x < v.x ) {

      this.x = v.x;

    }

    if ( this.y < v.y ) {

      this.y = v.y;

    }

    if ( this.z < v.z ) {

      this.z = v.z;

    }

    return this;

  },

  clamp: function ( min, max ) {

    // This function assumes min < max, if this assumption isn't true it will not operate correctly

    if ( this.x < min.x ) {

      this.x = min.x;

    } else if ( this.x > max.x ) {

      this.x = max.x;

    }

    if ( this.y < min.y ) {

      this.y = min.y;

    } else if ( this.y > max.y ) {

      this.y = max.y;

    }

    if ( this.z < min.z ) {

      this.z = min.z;

    } else if ( this.z > max.z ) {

      this.z = max.z;

    }

    return this;

  },

  negate: function () {

    return this.multiplyScalar( - 1 );

  },

  dot: function ( v ) {

    return this.x * v.x + this.y * v.y + this.z * v.z;

  },

  lengthSq: function () {

    return this.x * this.x + this.y * this.y + this.z * this.z;

  },

  length: function () {

    return Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z );

  },

  lengthManhattan: function () {

    return Math.abs( this.x ) + Math.abs( this.y ) + Math.abs( this.z );

  },

  normalize: function () {

    return this.divideScalar( this.length() );

  },

  setLength: function ( l ) {

    var oldLength = this.length();

    if ( oldLength !== 0 && l !== oldLength  ) {

      this.multiplyScalar( l / oldLength );
    }

    return this;

  },

  lerp: function ( v, alpha ) {

    this.x += ( v.x - this.x ) * alpha;
    this.y += ( v.y - this.y ) * alpha;
    this.z += ( v.z - this.z ) * alpha;

    return this;

  },

  cross: function ( v, w ) {

    if ( w !== undefined ) {

      console.warn( 'DEPRECATED: Vector3\'s .cross() now only accepts one argument. Use .crossVectors( a, b ) instead.' );
      return this.crossVectors( v, w );

    }

    var x = this.x, y = this.y, z = this.z;

    this.x = y * v.z - z * v.y;
    this.y = z * v.x - x * v.z;
    this.z = x * v.y - y * v.x;

    return this;

  },

  crossVectors: function ( a, b ) {

    var ax = a.x, ay = a.y, az = a.z;
    var bx = b.x, by = b.y, bz = b.z;

    this.x = ay * bz - az * by;
    this.y = az * bx - ax * bz;
    this.z = ax * by - ay * bx;

    return this;

  },

  angleTo: function ( v ) {

    var theta = this.dot( v ) / ( this.length() * v.length() );

    // clamp, to handle numerical problems

    return Math.acos( WY3D.Math.clamp( theta, -1, 1 ) );

  },

  distanceTo: function ( v ) {

    return Math.sqrt( this.distanceToSquared( v ) );

  },

  distanceToSquared: function ( v ) {

    var dx = this.x - v.x;
    var dy = this.y - v.y;
    var dz = this.z - v.z;

    return dx * dx + dy * dy + dz * dz;

  },

  setEulerFromRotationMatrix: function ( m, order ) {

    console.error( "REMOVED: Vector3\'s setEulerFromRotationMatrix has been removed in favor of Euler.setFromRotationMatrix(), please update your code.");

  },

  setEulerFromQuaternion: function ( q, order ) {

    console.error( "REMOVED: Vector3\'s setEulerFromQuaternion: has been removed in favor of Euler.setFromQuaternion(), please update your code.");

  },

  getPositionFromMatrix: function ( m ) {

    console.warn( "DEPRECATED: Vector3\'s .getPositionFromMatrix() has been renamed to .setFromMatrixPosition(). Please update your code." );

    return this.setFromMatrixPosition( m );

  },

  getScaleFromMatrix: function ( m ) {

    console.warn( "DEPRECATED: Vector3\'s .getScaleFromMatrix() has been renamed to .setFromMatrixScale(). Please update your code." );

    return this.setFromMatrixScale( m );
  },

  getColumnFromMatrix: function ( index, matrix ) {

    console.warn( "DEPRECATED: Vector3\'s .getColumnFromMatrix() has been renamed to .setFromMatrixColumn(). Please update your code." );

    return this.setFromMatrixColumn( index, matrix );

  },

  setFromMatrixPosition: function ( m ) {

    this.x = m.elements[ 12 ];
    this.y = m.elements[ 13 ];
    this.z = m.elements[ 14 ];

    return this;

  },

  setFromMatrixScale: function ( m ) {

    var sx = this.set( m.elements[ 0 ], m.elements[ 1 ], m.elements[  2 ] ).length();
    var sy = this.set( m.elements[ 4 ], m.elements[ 5 ], m.elements[  6 ] ).length();
    var sz = this.set( m.elements[ 8 ], m.elements[ 9 ], m.elements[ 10 ] ).length();

    this.x = sx;
    this.y = sy;
    this.z = sz;

    return this;
  },

  setFromMatrixColumn: function ( index, matrix ) {

    var offset = index * 4;

    var me = matrix.elements;

    this.x = me[ offset ];
    this.y = me[ offset + 1 ];
    this.z = me[ offset + 2 ];

    return this;

  },

  equals: function ( v ) {

    return ( ( v.x === this.x ) && ( v.y === this.y ) && ( v.z === this.z ) );

  },

  fromArray: function ( array ) {

    this.x = array[ 0 ];
    this.y = array[ 1 ];
    this.z = array[ 2 ];

    return this;

  },

  toArray: function () {

    return [ this.x, this.y, this.z ];

  },

  clone: function () {

    return new WY3D.Vector3( this.x, this.y, this.z );

  }

};

WY3D.extend( WY3D.Vector3.prototype, {

  applyEuler: function () {

    var quaternion = new WY3D.Quaternion();

    return function ( euler ) {

      if ( euler instanceof WY3D.Euler === false ) {

        console.error( 'ERROR: Vector3\'s .applyEuler() now expects a Euler rotation rather than a Vector3 and order.  Please update your code.' );

      }

      this.applyQuaternion( quaternion.setFromEuler( euler ) );

      return this;

    };

  }(),

  applyAxisAngle: function () {

    var quaternion = new WY3D.Quaternion();

    return function ( axis, angle ) {

      this.applyQuaternion( quaternion.setFromAxisAngle( axis, angle ) );

      return this;

    };

  }(),

  projectOnVector: function () {

    var v1 = new WY3D.Vector3();

    return function ( vector ) {

      v1.copy( vector ).normalize();
      var d = this.dot( v1 );
      return this.copy( v1 ).multiplyScalar( d );

    };

  }(),

  projectOnPlane: function () {

    var v1 = new WY3D.Vector3();

    return function ( planeNormal ) {

      v1.copy( this ).projectOnVector( planeNormal );

      return this.sub( v1 );

    };

  }(),

  reflect: function () {

    var v1 = new WY3D.Vector3();

    return function ( vector ) {

        v1.copy( this ).projectOnVector( vector ).multiplyScalar( 2 );

        return this.subVectors( v1, this );

    };

  }()

} );
/**
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author bhouston / http://exocortex.com
 */

WY3D.Matrix3 = function ( n11, n12, n13, n21, n22, n23, n31, n32, n33 ) {

  this.elements = new Float32Array(9);

  this.set(

    ( n11 !== undefined ) ? n11 : 1, n12 || 0, n13 || 0,
    n21 || 0, ( n22 !== undefined ) ? n22 : 1, n23 || 0,
    n31 || 0, n32 || 0, ( n33 !== undefined ) ? n33 : 1

  );
};

WY3D.Matrix3.prototype = {

  constructor: WY3D.Matrix3,

  set: function ( n11, n12, n13, n21, n22, n23, n31, n32, n33 ) {

    var te = this.elements;

    te[0] = n11; te[3] = n12; te[6] = n13;
    te[1] = n21; te[4] = n22; te[7] = n23;
    te[2] = n31; te[5] = n32; te[8] = n33;

    return this;

  },

  identity: function () {

    this.set(

      1, 0, 0,
      0, 1, 0,
      0, 0, 1

    );

    return this;

  },

  copy: function ( m ) {

    var me = m.elements;

    this.set(

      me[0], me[3], me[6],
      me[1], me[4], me[7],
      me[2], me[5], me[8]

    );

    return this;

  },

  multiplyVector3: function ( vector ) {

    console.warn( 'DEPRECATED: Matrix3\'s .multiplyVector3() has been removed. Use vector.applyMatrix3( matrix ) instead.' );
    return vector.applyMatrix3( this );

  },

  multiplyVector3Array: function() {

    var v1 = new WY3D.Vector3();

    return function ( a ) {

      for ( var i = 0, il = a.length; i < il; i += 3 ) {

        v1.x = a[ i ];
        v1.y = a[ i + 1 ];
        v1.z = a[ i + 2 ];

        v1.applyMatrix3(this);

        a[ i ]     = v1.x;
        a[ i + 1 ] = v1.y;
        a[ i + 2 ] = v1.z;

      }

      return a;

    };

  }(),

  multiplyScalar: function ( s ) {

    var te = this.elements;

    te[0] *= s; te[3] *= s; te[6] *= s;
    te[1] *= s; te[4] *= s; te[7] *= s;
    te[2] *= s; te[5] *= s; te[8] *= s;

    return this;

  },

  determinant: function () {

    var te = this.elements;

    var a = te[0], b = te[1], c = te[2],
      d = te[3], e = te[4], f = te[5],
      g = te[6], h = te[7], i = te[8];

    return a*e*i - a*f*h - b*d*i + b*f*g + c*d*h - c*e*g;

  },

  getInverse: function ( matrix, throwOnInvertible ) {

    // input: WY3D.Matrix4
    // ( based on http://code.google.com/p/webgl-mjs/ )

    var me = matrix.elements;
    var te = this.elements;

    te[ 0 ] =   me[10] * me[5] - me[6] * me[9];
    te[ 1 ] = - me[10] * me[1] + me[2] * me[9];
    te[ 2 ] =   me[6] * me[1] - me[2] * me[5];
    te[ 3 ] = - me[10] * me[4] + me[6] * me[8];
    te[ 4 ] =   me[10] * me[0] - me[2] * me[8];
    te[ 5 ] = - me[6] * me[0] + me[2] * me[4];
    te[ 6 ] =   me[9] * me[4] - me[5] * me[8];
    te[ 7 ] = - me[9] * me[0] + me[1] * me[8];
    te[ 8 ] =   me[5] * me[0] - me[1] * me[4];

    var det = me[ 0 ] * te[ 0 ] + me[ 1 ] * te[ 3 ] + me[ 2 ] * te[ 6 ];

    // no inverse

    if ( det === 0 ) {

      var msg = "Matrix3.getInverse(): can't invert matrix, determinant is 0";

      if ( throwOnInvertible || false ) {

        throw new Error( msg ); 

      } else {

        console.warn( msg );

      }

      this.identity();

      return this;

    }

    this.multiplyScalar( 1.0 / det );

    return this;

  },

  transpose: function () {

    var tmp, m = this.elements;

    tmp = m[1]; m[1] = m[3]; m[3] = tmp;
    tmp = m[2]; m[2] = m[6]; m[6] = tmp;
    tmp = m[5]; m[5] = m[7]; m[7] = tmp;

    return this;

  },

  getNormalMatrix: function ( m ) {

    // input: WY3D.Matrix4

    this.getInverse( m ).transpose();

    return this;

  },

  transposeIntoArray: function ( r ) {

    var m = this.elements;

    r[ 0 ] = m[ 0 ];
    r[ 1 ] = m[ 3 ];
    r[ 2 ] = m[ 6 ];
    r[ 3 ] = m[ 1 ];
    r[ 4 ] = m[ 4 ];
    r[ 5 ] = m[ 7 ];
    r[ 6 ] = m[ 2 ];
    r[ 7 ] = m[ 5 ];
    r[ 8 ] = m[ 8 ];

    return this;

  },

  clone: function () {

    var te = this.elements;

    return new WY3D.Matrix3(

      te[0], te[3], te[6],
      te[1], te[4], te[7],
      te[2], te[5], te[8]

    );

  }

};
/**
 * @author mrdoob / http://mrdoob.com/
 * @author supereggbert / http://www.paulbrunt.co.uk/
 * @author philogb / http://blog.thejit.org/
 * @author jordi_ros / http://plattsoft.com
 * @author D1plo1d / http://github.com/D1plo1d
 * @author alteredq / http://alteredqualia.com/
 * @author mikael emtinger / http://gomo.se/
 * @author timknip / http://www.floorplanner.com/
 * @author bhouston / http://exocortex.com
 * @author WestLangley / http://github.com/WestLangley
 */


WY3D.Matrix4 = function ( n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44 ) {

  this.elements = new Float32Array( 16 );

  // TODO: if n11 is undefined, then just set to identity, otherwise copy all other values into matrix
  //   we should not support semi specification of Matrix4, it is just weird.

  var te = this.elements;

  te[0] = ( n11 !== undefined ) ? n11 : 1; te[4] = n12 || 0; te[8] = n13 || 0; te[12] = n14 || 0;
  te[1] = n21 || 0; te[5] = ( n22 !== undefined ) ? n22 : 1; te[9] = n23 || 0; te[13] = n24 || 0;
  te[2] = n31 || 0; te[6] = n32 || 0; te[10] = ( n33 !== undefined ) ? n33 : 1; te[14] = n34 || 0;
  te[3] = n41 || 0; te[7] = n42 || 0; te[11] = n43 || 0; te[15] = ( n44 !== undefined ) ? n44 : 1;

};

WY3D.Matrix4.prototype = {

  constructor: WY3D.Matrix4,

  set: function ( n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44 ) {

    var te = this.elements;

    te[0] = n11; te[4] = n12; te[8] = n13; te[12] = n14;
    te[1] = n21; te[5] = n22; te[9] = n23; te[13] = n24;
    te[2] = n31; te[6] = n32; te[10] = n33; te[14] = n34;
    te[3] = n41; te[7] = n42; te[11] = n43; te[15] = n44;

    return this;

  },

  identity: function () {

    this.set(

      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1

    );

    return this;

  },

  copy: function ( m ) {

    this.elements.set( m.elements );

    return this;

  },

  extractPosition: function ( m ) {

    console.warn( 'DEPRECATED: Matrix4\'s .extractPosition() has been renamed to .copyPosition().' );
    return this.copyPosition( m );

  },

  copyPosition: function ( m ) {

    var te = this.elements;
    var me = m.elements;

    te[12] = me[12];
    te[13] = me[13];
    te[14] = me[14];

    return this;

  },

  extractRotation: function () {

    var v1 = new WY3D.Vector3();

    return function ( m ) {

      var te = this.elements;
      var me = m.elements;

      var scaleX = 1 / v1.set( me[0], me[1], me[2] ).length();
      var scaleY = 1 / v1.set( me[4], me[5], me[6] ).length();
      var scaleZ = 1 / v1.set( me[8], me[9], me[10] ).length();

      te[0] = me[0] * scaleX;
      te[1] = me[1] * scaleX;
      te[2] = me[2] * scaleX;

      te[4] = me[4] * scaleY;
      te[5] = me[5] * scaleY;
      te[6] = me[6] * scaleY;

      te[8] = me[8] * scaleZ;
      te[9] = me[9] * scaleZ;
      te[10] = me[10] * scaleZ;

      return this;

    };

  }(),

  makeRotationFromEuler: function ( euler ) {

    if ( euler instanceof WY3D.Euler === false ) {

      console.error( 'ERROR: Matrix\'s .makeRotationFromEuler() now expects a Euler rotation rather than a Vector3 and order.  Please update your code.' );

    }

    var te = this.elements;

    var x = euler.x, y = euler.y, z = euler.z;
    var a = Math.cos( x ), b = Math.sin( x );
    var c = Math.cos( y ), d = Math.sin( y );
    var e = Math.cos( z ), f = Math.sin( z );
    var ae, ce, ac;


    if ( euler.order === 'XYZ' ) {

      ae = a * e, af = a * f, be = b * e, bf = b * f;

      te[0] = c * e;
      te[4] = - c * f;
      te[8] = d;

      te[1] = af + be * d;
      te[5] = ae - bf * d;
      te[9] = - b * c;

      te[2] = bf - ae * d;
      te[6] = be + af * d;
      te[10] = a * c;

    } else if ( euler.order === 'YXZ' ) {

      ce = c * e, cf = c * f, de = d * e, df = d * f;

      te[0] = ce + df * b;
      te[4] = de * b - cf;
      te[8] = a * d;

      te[1] = a * f;
      te[5] = a * e;
      te[9] = - b;

      te[2] = cf * b - de;
      te[6] = df + ce * b;
      te[10] = a * c;

    } else if ( euler.order === 'ZXY' ) {

      ce = c * e, cf = c * f, de = d * e, df = d * f;

      te[0] = ce - df * b;
      te[4] = - a * f;
      te[8] = de + cf * b;

      te[1] = cf + de * b;
      te[5] = a * e;
      te[9] = df - ce * b;

      te[2] = - a * d;
      te[6] = b;
      te[10] = a * c;

    } else if ( euler.order === 'ZYX' ) {

      ae = a * e, af = a * f, be = b * e, bf = b * f;

      te[0] = c * e;
      te[4] = be * d - af;
      te[8] = ae * d + bf;

      te[1] = c * f;
      te[5] = bf * d + ae;
      te[9] = af * d - be;

      te[2] = - d;
      te[6] = b * c;
      te[10] = a * c;

    } else if ( euler.order === 'YZX' ) {

      ac = a * c, ad = a * d, bc = b * c, bd = b * d;

      te[0] = c * e;
      te[4] = bd - ac * f;
      te[8] = bc * f + ad;

      te[1] = f;
      te[5] = a * e;
      te[9] = - b * e;

      te[2] = - d * e;
      te[6] = ad * f + bc;
      te[10] = ac - bd * f;

    } else if ( euler.order === 'XZY' ) {

      ac = a * c, ad = a * d, bc = b * c, bd = b * d;

      te[0] = c * e;
      te[4] = - f;
      te[8] = d * e;

      te[1] = ac * f + bd;
      te[5] = a * e;
      te[9] = ad * f - bc;

      te[2] = bc * f - ad;
      te[6] = b * e;
      te[10] = bd * f + ac;

    }

    // last column
    te[3] = 0;
    te[7] = 0;
    te[11] = 0;

    // bottom row
    te[12] = 0;
    te[13] = 0;
    te[14] = 0;
    te[15] = 1;

    return this;

  },

  setRotationFromQuaternion: function ( q ) {

    console.warn( 'DEPRECATED: Matrix4\'s .setRotationFromQuaternion() has been deprecated in favor of makeRotationFromQuaternion.  Please update your code.' );

    return this.makeRotationFromQuaternion( q );

  },

  makeRotationFromQuaternion: function ( q ) {

    var te = this.elements;

    var x = q.x, y = q.y, z = q.z, w = q.w;
    var x2 = x + x, y2 = y + y, z2 = z + z;
    var xx = x * x2, xy = x * y2, xz = x * z2;
    var yy = y * y2, yz = y * z2, zz = z * z2;
    var wx = w * x2, wy = w * y2, wz = w * z2;

    te[0] = 1 - ( yy + zz );
    te[4] = xy - wz;
    te[8] = xz + wy;

    te[1] = xy + wz;
    te[5] = 1 - ( xx + zz );
    te[9] = yz - wx;

    te[2] = xz - wy;
    te[6] = yz + wx;
    te[10] = 1 - ( xx + yy );

    // last column
    te[3] = 0;
    te[7] = 0;
    te[11] = 0;

    // bottom row
    te[12] = 0;
    te[13] = 0;
    te[14] = 0;
    te[15] = 1;

    return this;

  },

  lookAt: function() {

    var x = new WY3D.Vector3();
    var y = new WY3D.Vector3();
    var z = new WY3D.Vector3();

    return function ( eye, target, up ) {

      var te = this.elements;

      z.subVectors( eye, target ).normalize();

      if ( z.length() === 0 ) {

        z.z = 1;

      }

      x.crossVectors( up, z ).normalize();

      if ( x.length() === 0 ) {

        z.x += 0.0001;
        x.crossVectors( up, z ).normalize();

      }

      y.crossVectors( z, x );


      te[0] = x.x; te[4] = y.x; te[8] = z.x;
      te[1] = x.y; te[5] = y.y; te[9] = z.y;
      te[2] = x.z; te[6] = y.z; te[10] = z.z;

      return this;

    };

  }(),

  multiply: function ( m, n ) {

    if ( n !== undefined ) {

      console.warn( 'DEPRECATED: Matrix4\'s .multiply() now only accepts one argument. Use .multiplyMatrices( a, b ) instead.' );
      return this.multiplyMatrices( m, n );

    }

    return this.multiplyMatrices( this, m );

  },

  multiplyMatrices: function ( a, b ) {

    var ae = a.elements;
    var be = b.elements;
    var te = this.elements;

    var a11 = ae[0], a12 = ae[4], a13 = ae[8], a14 = ae[12];
    var a21 = ae[1], a22 = ae[5], a23 = ae[9], a24 = ae[13];
    var a31 = ae[2], a32 = ae[6], a33 = ae[10], a34 = ae[14];
    var a41 = ae[3], a42 = ae[7], a43 = ae[11], a44 = ae[15];

    var b11 = be[0], b12 = be[4], b13 = be[8], b14 = be[12];
    var b21 = be[1], b22 = be[5], b23 = be[9], b24 = be[13];
    var b31 = be[2], b32 = be[6], b33 = be[10], b34 = be[14];
    var b41 = be[3], b42 = be[7], b43 = be[11], b44 = be[15];

    te[0] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
    te[4] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
    te[8] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
    te[12] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

    te[1] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
    te[5] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
    te[9] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
    te[13] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

    te[2] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
    te[6] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
    te[10] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
    te[14] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

    te[3] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
    te[7] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
    te[11] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
    te[15] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

    return this;

  },

  multiplyToArray: function ( a, b, r ) {

    var te = this.elements;

    this.multiplyMatrices( a, b );

    r[ 0 ] = te[0]; r[ 1 ] = te[1]; r[ 2 ] = te[2]; r[ 3 ] = te[3];
    r[ 4 ] = te[4]; r[ 5 ] = te[5]; r[ 6 ] = te[6]; r[ 7 ] = te[7];
    r[ 8 ]  = te[8]; r[ 9 ]  = te[9]; r[ 10 ] = te[10]; r[ 11 ] = te[11];
    r[ 12 ] = te[12]; r[ 13 ] = te[13]; r[ 14 ] = te[14]; r[ 15 ] = te[15];

    return this;

  },

  multiplyScalar: function ( s ) {

    var te = this.elements;

    te[0] *= s; te[4] *= s; te[8] *= s; te[12] *= s;
    te[1] *= s; te[5] *= s; te[9] *= s; te[13] *= s;
    te[2] *= s; te[6] *= s; te[10] *= s; te[14] *= s;
    te[3] *= s; te[7] *= s; te[11] *= s; te[15] *= s;

    return this;

  },

  multiplyVector3: function ( vector ) {

    console.warn( 'DEPRECATED: Matrix4\'s .multiplyVector3() has been removed. Use vector.applyMatrix4( matrix ) or vector.applyProjection( matrix ) instead.' );
    return vector.applyProjection( this );

  },

  multiplyVector4: function ( vector ) {

    console.warn( 'DEPRECATED: Matrix4\'s .multiplyVector4() has been removed. Use vector.applyMatrix4( matrix ) instead.' );
    return vector.applyMatrix4( this );

  },

  multiplyVector3Array: function() {

    var v1 = new WY3D.Vector3();

    return function ( a ) {

      for ( var i = 0, il = a.length; i < il; i += 3 ) {

        v1.x = a[ i ];
        v1.y = a[ i + 1 ];
        v1.z = a[ i + 2 ];

        v1.applyProjection( this );

        a[ i ]     = v1.x;
        a[ i + 1 ] = v1.y;
        a[ i + 2 ] = v1.z;

      }

      return a;

    };

  }(),

  rotateAxis: function ( v ) {

    console.warn( 'DEPRECATED: Matrix4\'s .rotateAxis() has been removed. Use Vector3.transformDirection( matrix ) instead.' );

    v.transformDirection( this );

  },

  crossVector: function ( vector ) {

    console.warn( 'DEPRECATED: Matrix4\'s .crossVector() has been removed. Use vector.applyMatrix4( matrix ) instead.' );
    return vector.applyMatrix4( this );

  },

  determinant: function () {

    var te = this.elements;

    var n11 = te[0], n12 = te[4], n13 = te[8], n14 = te[12];
    var n21 = te[1], n22 = te[5], n23 = te[9], n24 = te[13];
    var n31 = te[2], n32 = te[6], n33 = te[10], n34 = te[14];
    var n41 = te[3], n42 = te[7], n43 = te[11], n44 = te[15];

    //TODO: make this more efficient
    //( based on http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm )

    return (
      n41 * (n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34) +
      n42 * (n11 * n23 * n34 - n11 * n24 * n33 + n14 * n21 * n33 - n13 * n21 * n34 + n13 * n24 * n31 - n14 * n23 * n31) +
      n43 * (n11 * n24 * n32 - n11 * n22 * n34 - n14 * n21 * n32 + n12 * n21 * n34 + n14 * n22 * n31 - n12 * n24 * n31) +
      n44 * (-n13 * n22 * n31 - n11 * n23 * n32 + n11 * n22 * n33 + n13 * n21 * n32 - n12 * n21 * n33 + n12 * n23 * n31)
    );

  },

  transpose: function () {

    var te = this.elements;
    var tmp;

    tmp = te[1]; te[1] = te[4]; te[4] = tmp;
    tmp = te[2]; te[2] = te[8]; te[8] = tmp;
    tmp = te[6]; te[6] = te[9]; te[9] = tmp;

    tmp = te[3]; te[3] = te[12]; te[12] = tmp;
    tmp = te[7]; te[7] = te[13]; te[13] = tmp;
    tmp = te[11]; te[11] = te[14]; te[14] = tmp;

    return this;

  },

  flattenToArray: function ( flat ) {

    var te = this.elements;
    flat[ 0 ] = te[0]; flat[ 1 ] = te[1]; flat[ 2 ] = te[2]; flat[ 3 ] = te[3];
    flat[ 4 ] = te[4]; flat[ 5 ] = te[5]; flat[ 6 ] = te[6]; flat[ 7 ] = te[7];
    flat[ 8 ] = te[8]; flat[ 9 ] = te[9]; flat[ 10 ] = te[10]; flat[ 11 ] = te[11];
    flat[ 12 ] = te[12]; flat[ 13 ] = te[13]; flat[ 14 ] = te[14]; flat[ 15 ] = te[15];

    return flat;

  },

  flattenToArrayOffset: function( flat, offset ) {

    var te = this.elements;
    flat[ offset ] = te[0];
    flat[ offset + 1 ] = te[1];
    flat[ offset + 2 ] = te[2];
    flat[ offset + 3 ] = te[3];

    flat[ offset + 4 ] = te[4];
    flat[ offset + 5 ] = te[5];
    flat[ offset + 6 ] = te[6];
    flat[ offset + 7 ] = te[7];

    flat[ offset + 8 ]  = te[8];
    flat[ offset + 9 ]  = te[9];
    flat[ offset + 10 ] = te[10];
    flat[ offset + 11 ] = te[11];

    flat[ offset + 12 ] = te[12];
    flat[ offset + 13 ] = te[13];
    flat[ offset + 14 ] = te[14];
    flat[ offset + 15 ] = te[15];

    return flat;

  },

  getPosition: function() {

    var v1 = new WY3D.Vector3();

    return function () {

      console.warn( 'DEPRECATED: Matrix4\'s .getPosition() has been removed. Use Vector3.setFromMatrixPosition( matrix ) instead.' );

      var te = this.elements;
      return v1.set( te[12], te[13], te[14] );

    };

  }(),

  setPosition: function ( v ) {

    var te = this.elements;

    te[12] = v.x;
    te[13] = v.y;
    te[14] = v.z;

    return this;

  },

  getInverse: function ( m, throwOnInvertible ) {

    // based on http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm
    var te = this.elements;
    var me = m.elements;

    var n11 = me[0], n12 = me[4], n13 = me[8], n14 = me[12];
    var n21 = me[1], n22 = me[5], n23 = me[9], n24 = me[13];
    var n31 = me[2], n32 = me[6], n33 = me[10], n34 = me[14];
    var n41 = me[3], n42 = me[7], n43 = me[11], n44 = me[15];

    te[0] = n23*n34*n42 - n24*n33*n42 + n24*n32*n43 - n22*n34*n43 - n23*n32*n44 + n22*n33*n44;
    te[4] = n14*n33*n42 - n13*n34*n42 - n14*n32*n43 + n12*n34*n43 + n13*n32*n44 - n12*n33*n44;
    te[8] = n13*n24*n42 - n14*n23*n42 + n14*n22*n43 - n12*n24*n43 - n13*n22*n44 + n12*n23*n44;
    te[12] = n14*n23*n32 - n13*n24*n32 - n14*n22*n33 + n12*n24*n33 + n13*n22*n34 - n12*n23*n34;
    te[1] = n24*n33*n41 - n23*n34*n41 - n24*n31*n43 + n21*n34*n43 + n23*n31*n44 - n21*n33*n44;
    te[5] = n13*n34*n41 - n14*n33*n41 + n14*n31*n43 - n11*n34*n43 - n13*n31*n44 + n11*n33*n44;
    te[9] = n14*n23*n41 - n13*n24*n41 - n14*n21*n43 + n11*n24*n43 + n13*n21*n44 - n11*n23*n44;
    te[13] = n13*n24*n31 - n14*n23*n31 + n14*n21*n33 - n11*n24*n33 - n13*n21*n34 + n11*n23*n34;
    te[2] = n22*n34*n41 - n24*n32*n41 + n24*n31*n42 - n21*n34*n42 - n22*n31*n44 + n21*n32*n44;
    te[6] = n14*n32*n41 - n12*n34*n41 - n14*n31*n42 + n11*n34*n42 + n12*n31*n44 - n11*n32*n44;
    te[10] = n12*n24*n41 - n14*n22*n41 + n14*n21*n42 - n11*n24*n42 - n12*n21*n44 + n11*n22*n44;
    te[14] = n14*n22*n31 - n12*n24*n31 - n14*n21*n32 + n11*n24*n32 + n12*n21*n34 - n11*n22*n34;
    te[3] = n23*n32*n41 - n22*n33*n41 - n23*n31*n42 + n21*n33*n42 + n22*n31*n43 - n21*n32*n43;
    te[7] = n12*n33*n41 - n13*n32*n41 + n13*n31*n42 - n11*n33*n42 - n12*n31*n43 + n11*n32*n43;
    te[11] = n13*n22*n41 - n12*n23*n41 - n13*n21*n42 + n11*n23*n42 + n12*n21*n43 - n11*n22*n43;
    te[15] = n12*n23*n31 - n13*n22*n31 + n13*n21*n32 - n11*n23*n32 - n12*n21*n33 + n11*n22*n33;

    var det = n11 * te[ 0 ] + n21 * te[ 4 ] + n31 * te[ 8 ] + n41 * te[ 12 ];

    if ( det === 0 ) {

      var msg = "Matrix4.getInverse(): can't invert matrix, determinant is 0";

      if ( throwOnInvertible || false ) {

        throw new Error( msg ); 

      } else {

        console.warn( msg );

      }

      this.identity();

      return this;
    }

    this.multiplyScalar( 1 / det );

    return this;

  },

  translate: function ( v ) {

    console.warn( 'DEPRECATED: Matrix4\'s .translate() has been removed.');

  },

  rotateX: function ( angle ) {

    console.warn( 'DEPRECATED: Matrix4\'s .rotateX() has been removed.');

  },

  rotateY: function ( angle ) {

    console.warn( 'DEPRECATED: Matrix4\'s .rotateY() has been removed.');

  },

  rotateZ: function ( angle ) {

    console.warn( 'DEPRECATED: Matrix4\'s .rotateZ() has been removed.');

  },

  rotateByAxis: function ( axis, angle ) {

    console.warn( 'DEPRECATED: Matrix4\'s .rotateByAxis() has been removed.');

  },

  scale: function ( v ) {

    var te = this.elements;
    var x = v.x, y = v.y, z = v.z;

    te[0] *= x; te[4] *= y; te[8] *= z;
    te[1] *= x; te[5] *= y; te[9] *= z;
    te[2] *= x; te[6] *= y; te[10] *= z;
    te[3] *= x; te[7] *= y; te[11] *= z;

    return this;

  },

  getMaxScaleOnAxis: function () {

    var te = this.elements;

    var scaleXSq = te[0] * te[0] + te[1] * te[1] + te[2] * te[2];
    var scaleYSq = te[4] * te[4] + te[5] * te[5] + te[6] * te[6];
    var scaleZSq = te[8] * te[8] + te[9] * te[9] + te[10] * te[10];

    return Math.sqrt( Math.max( scaleXSq, Math.max( scaleYSq, scaleZSq ) ) );

  },

  makeTranslation: function ( x, y, z ) {

    this.set(

      1, 0, 0, x,
      0, 1, 0, y,
      0, 0, 1, z,
      0, 0, 0, 1

    );

    return this;

  },

  makeRotationX: function ( theta ) {

    var c = Math.cos( theta ), s = Math.sin( theta );

    this.set(

      1, 0,  0, 0,
      0, c, -s, 0,
      0, s,  c, 0,
      0, 0,  0, 1

    );

    return this;

  },

  makeRotationY: function ( theta ) {

    var c = Math.cos( theta ), s = Math.sin( theta );

    this.set(

       c, 0, s, 0,
       0, 1, 0, 0,
      -s, 0, c, 0,
       0, 0, 0, 1

    );

    return this;

  },

  makeRotationZ: function ( theta ) {

    var c = Math.cos( theta ), s = Math.sin( theta );

    this.set(

      c, -s, 0, 0,
      s,  c, 0, 0,
      0,  0, 1, 0,
      0,  0, 0, 1

    );

    return this;

  },

  makeRotationAxis: function ( axis, angle ) {

    // Based on http://www.gamedev.net/reference/articles/article1199.asp

    var c = Math.cos( angle );
    var s = Math.sin( angle );
    var t = 1 - c;
    var x = axis.x, y = axis.y, z = axis.z;
    var tx = t * x, ty = t * y;

    this.set(

      tx * x + c, tx * y - s * z, tx * z + s * y, 0,
      tx * y + s * z, ty * y + c, ty * z - s * x, 0,
      tx * z - s * y, ty * z + s * x, t * z * z + c, 0,
      0, 0, 0, 1

    );

     return this;

  },

  makeScale: function ( x, y, z ) {

    this.set(

      x, 0, 0, 0,
      0, y, 0, 0,
      0, 0, z, 0,
      0, 0, 0, 1

    );

    return this;

  },

  compose: function ( position, quaternion, scale ) {

    this.makeRotationFromQuaternion( quaternion );
    this.scale( scale );
    this.setPosition( position );

    return this;

  },

  decompose: function () {

    var vector = new WY3D.Vector3();
    var matrix = new WY3D.Matrix4();

    return function ( position, quaternion, scale ) {

      var te = this.elements;

      var sx = vector.set( te[0], te[1], te[2] ).length();
      var sy = vector.set( te[4], te[5], te[6] ).length();
      var sz = vector.set( te[8], te[9], te[10] ).length();

      position.x = te[12];
      position.y = te[13];
      position.z = te[14];

      // scale the rotation part

      matrix.elements.set( this.elements ); // at this point matrix is incomplete so we can't use .copy()

      var invSX = 1 / sx;
      var invSY = 1 / sy;
      var invSZ = 1 / sz;

      matrix.elements[0] *= invSX;
      matrix.elements[1] *= invSX;
      matrix.elements[2] *= invSX;

      matrix.elements[4] *= invSY;
      matrix.elements[5] *= invSY;
      matrix.elements[6] *= invSY;

      matrix.elements[8] *= invSZ;
      matrix.elements[9] *= invSZ;
      matrix.elements[10] *= invSZ;

      quaternion.setFromRotationMatrix( matrix );

      scale.x = sx;
      scale.y = sy;
      scale.z = sz;

      return this;

    };

  }(),

  makeFrustum: function ( left, right, bottom, top, near, far ) {

    var te = this.elements;
    var x = 2 * near / ( right - left );
    var y = 2 * near / ( top - bottom );

    var a = ( right + left ) / ( right - left );
    var b = ( top + bottom ) / ( top - bottom );
    var c = - ( far + near ) / ( far - near );
    var d = - 2 * far * near / ( far - near );

    te[0] = x;  te[4] = 0;  te[8] = a;  te[12] = 0;
    te[1] = 0;  te[5] = y;  te[9] = b;  te[13] = 0;
    te[2] = 0;  te[6] = 0;  te[10] = c; te[14] = d;
    te[3] = 0;  te[7] = 0;  te[11] = - 1; te[15] = 0;

    return this;

  },

  makePerspective: function ( fov, aspect, near, far ) {

    var ymax = near * Math.tan( WY3D.Math.degToRad( fov * 0.5 ) );
    var ymin = - ymax;
    var xmin = ymin * aspect;
    var xmax = ymax * aspect;

    return this.makeFrustum( xmin, xmax, ymin, ymax, near, far );

  },

  makeOrthographic: function ( left, right, top, bottom, near, far ) {

    var te = this.elements;
    var w = right - left;
    var h = top - bottom;
    var p = far - near;

    var x = ( right + left ) / w;
    var y = ( top + bottom ) / h;
    var z = ( far + near ) / p;

    te[0] = 2 / w;  te[4] = 0;  te[8] = 0;  te[12] = -x;
    te[1] = 0;  te[5] = 2 / h;  te[9] = 0;  te[13] = -y;
    te[2] = 0;  te[6] = 0;  te[10] = -2/p;  te[14] = -z;
    te[3] = 0;  te[7] = 0;  te[11] = 0; te[15] = 1;

    return this;

  },

  fromArray: function ( array ) {

    this.elements.set( array );

    return this;

  },

  toArray: function () {

    var te = this.elements;

    return [
      te[ 0 ], te[ 1 ], te[ 2 ], te[ 3 ],
      te[ 4 ], te[ 5 ], te[ 6 ], te[ 7 ],
      te[ 8 ], te[ 9 ], te[ 10 ], te[ 11 ],
      te[ 12 ], te[ 13 ], te[ 14 ], te[ 15 ]
    ];

  },

  clone: function () {

    var te = this.elements;

    return new WY3D.Matrix4(

      te[0], te[4], te[8], te[12],
      te[1], te[5], te[9], te[13],
      te[2], te[6], te[10], te[14],
      te[3], te[7], te[11], te[15]

    );

  }

};
//Copyright (c) 2009 The Chromium Authors. All rights reserved.
//Use of this source code is governed by a BSD-style license that can be
//found in the LICENSE file.

// Various functions for helping debug WebGL apps.

WebGLDebugUtils = function() {

/**
 * Wrapped logging function.
 * @param {string} msg Message to log.
 */
var log = function(msg) {
  if (window.console && window.console.log) {
    window.console.log(msg);
  }
};

/**
 * Which arguements are enums.
 * @type {!Object.<number, string>}
 */
var glValidEnumContexts = {

  // Generic setters and getters

  'enable': { 0:true },
  'disable': { 0:true },
  'getParameter': { 0:true },

  // Rendering

  'drawArrays': { 0:true },
  'drawElements': { 0:true, 2:true },

  // Shaders

  'createShader': { 0:true },
  'getShaderParameter': { 1:true },
  'getProgramParameter': { 1:true },

  // Vertex attributes

  'getVertexAttrib': { 1:true },
  'vertexAttribPointer': { 2:true },

  // Textures

  'bindTexture': { 0:true },
  'activeTexture': { 0:true },
  'getTexParameter': { 0:true, 1:true },
  'texParameterf': { 0:true, 1:true },
  'texParameteri': { 0:true, 1:true, 2:true },
  'texImage2D': { 0:true, 2:true, 6:true, 7:true },
  'texSubImage2D': { 0:true, 6:true, 7:true },
  'copyTexImage2D': { 0:true, 2:true },
  'copyTexSubImage2D': { 0:true },
  'generateMipmap': { 0:true },

  // Buffer objects

  'bindBuffer': { 0:true },
  'bufferData': { 0:true, 2:true },
  'bufferSubData': { 0:true },
  'getBufferParameter': { 0:true, 1:true },

  // Renderbuffers and framebuffers

  'pixelStorei': { 0:true, 1:true },
  'readPixels': { 4:true, 5:true },
  'bindRenderbuffer': { 0:true },
  'bindFramebuffer': { 0:true },
  'checkFramebufferStatus': { 0:true },
  'framebufferRenderbuffer': { 0:true, 1:true, 2:true },
  'framebufferTexture2D': { 0:true, 1:true, 2:true },
  'getFramebufferAttachmentParameter': { 0:true, 1:true, 2:true },
  'getRenderbufferParameter': { 0:true, 1:true },
  'renderbufferStorage': { 0:true, 1:true },

  // Frame buffer operations (clear, blend, depth test, stencil)

  'clear': { 0:true },
  'depthFunc': { 0:true },
  'blendFunc': { 0:true, 1:true },
  'blendFuncSeparate': { 0:true, 1:true, 2:true, 3:true },
  'blendEquation': { 0:true },
  'blendEquationSeparate': { 0:true, 1:true },
  'stencilFunc': { 0:true },
  'stencilFuncSeparate': { 0:true, 1:true },
  'stencilMaskSeparate': { 0:true },
  'stencilOp': { 0:true, 1:true, 2:true },
  'stencilOpSeparate': { 0:true, 1:true, 2:true, 3:true },

  // Culling

  'cullFace': { 0:true },
  'frontFace': { 0:true },
};

/**
 * Map of numbers to names.
 * @type {Object}
 */
var glEnums = null;

/**
 * Initializes this module. Safe to call more than once.
 * @param {!WebGLRenderingContext} ctx A WebGL context. If
 *    you have more than one context it doesn't matter which one
 *    you pass in, it is only used to pull out constants.
 */
function init(ctx) {
  if (glEnums === null) {
    glEnums = { };
    for (var propertyName in ctx) {
      if (typeof ctx[propertyName] == 'number') {
        glEnums[ctx[propertyName]] = propertyName;
      }
    }
  }
}

/**
 * Checks the utils have been initialized.
 */
function checkInit() {
  if (glEnums === null) {
    throw 'WebGLDebugUtils.init(ctx) not called';
  }
}

/**
 * Returns true or false if value matches any WebGL enum
 * @param {*} value Value to check if it might be an enum.
 * @return {boolean} True if value matches one of the WebGL defined enums
 */
function mightBeEnum(value) {
  checkInit();
  return (glEnums[value] !== undefined);
}

/**
 * Gets an string version of an WebGL enum.
 *
 * Example:
 *   var str = WebGLDebugUtil.glEnumToString(ctx.getError());
 *
 * @param {number} value Value to return an enum for
 * @return {string} The string version of the enum.
 */
function glEnumToString(value) {
  checkInit();
  var name = glEnums[value];
  return (name !== undefined) ? name :
      ("*UNKNOWN WebGL ENUM (0x" + value.toString(16) + ")");
}

/**
 * Returns the string version of a WebGL argument.
 * Attempts to convert enum arguments to strings.
 * @param {string} functionName the name of the WebGL function.
 * @param {number} argumentIndx the index of the argument.
 * @param {*} value The value of the argument.
 * @return {string} The value as a string.
 */
function glFunctionArgToString(functionName, argumentIndex, value) {
  var funcInfo = glValidEnumContexts[functionName];
  if (funcInfo !== undefined) {
    if (funcInfo[argumentIndex]) {
      return glEnumToString(value);
    }
  }
  return value.toString();
}

/**
 * Given a WebGL context returns a wrapped context that calls
 * gl.getError after every command and calls a function if the
 * result is not gl.NO_ERROR.
 *
 * @param {!WebGLRenderingContext} ctx The webgl context to
 *        wrap.
 * @param {!function(err, funcName, args): void} opt_onErrorFunc
 *        The function to call when gl.getError returns an
 *        error. If not specified the default function calls
 *        console.log with a message.
 */
function makeDebugContext(ctx, opt_onErrorFunc) {
  init(ctx);
  opt_onErrorFunc = opt_onErrorFunc || function(err, functionName, args) {
        // apparently we can't do args.join(",");
        var argStr = "";
        for (var ii = 0; ii < args.length; ++ii) {
          argStr += ((ii === 0) ? '' : ', ') +
              glFunctionArgToString(functionName, ii, args[ii]);
        }
        log("WebGL error "+ glEnumToString(err) + " in "+ functionName +
            "(" + argStr + ")");
      };

  // Holds booleans for each GL error so after we get the error ourselves
  // we can still return it to the client app.
  var glErrorShadow = { };

  // Makes a function that calls a WebGL function and then calls getError.
  function makeErrorWrapper(ctx, functionName) {
    return function() {
      var result = ctx[functionName].apply(ctx, arguments);
      var err = ctx.getError();
      if (err !== 0) {
        glErrorShadow[err] = true;
        opt_onErrorFunc(err, functionName, arguments);
      }
      return result;
    };
  }

  // Make a an object that has a copy of every property of the WebGL context
  // but wraps all functions.
  var wrapper = {};
  for (var propertyName in ctx) {
    if (typeof ctx[propertyName] == 'function') {
       wrapper[propertyName] = makeErrorWrapper(ctx, propertyName);
     } else {
       wrapper[propertyName] = ctx[propertyName];
     }
  }

  // Override the getError function with one that returns our saved results.
  wrapper.getError = function() {
    for (var err in glErrorShadow) {
      if (glErrorShadow[err]) {
        glErrorShadow[err] = false;
        return err;
      }
    }
    return ctx.NO_ERROR;
  };

  return wrapper;
}

function resetToInitialState(ctx) {
  var numAttribs = ctx.getParameter(ctx.MAX_VERTEX_ATTRIBS);
  var tmp = ctx.createBuffer();
  var ii;

  ctx.bindBuffer(ctx.ARRAY_BUFFER, tmp);
  for (ii = 0; ii < numAttribs; ++ii) {
    ctx.disableVertexAttribArray(ii);
    ctx.vertexAttribPointer(ii, 4, ctx.FLOAT, false, 0, 0);
    ctx.vertexAttrib1f(ii, 0);
  }
  ctx.deleteBuffer(tmp);

  var numTextureUnits = ctx.getParameter(ctx.MAX_TEXTURE_IMAGE_UNITS);
  for (ii = 0; ii < numTextureUnits; ++ii) {
    ctx.activeTexture(ctx.TEXTURE0 + ii);
    ctx.bindTexture(ctx.TEXTURE_CUBE_MAP, null);
    ctx.bindTexture(ctx.TEXTURE_2D, null);
  }

  ctx.activeTexture(ctx.TEXTURE0);
  ctx.useProgram(null);
  ctx.bindBuffer(ctx.ARRAY_BUFFER, null);
  ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, null);
  ctx.bindFramebuffer(ctx.FRAMEBUFFER, null);
  ctx.bindRenderbuffer(ctx.RENDERBUFFER, null);
  ctx.disable(ctx.BLEND);
  ctx.disable(ctx.CULL_FACE);
  ctx.disable(ctx.DEPTH_TEST);
  ctx.disable(ctx.DITHER);
  ctx.disable(ctx.SCISSOR_TEST);
  ctx.blendColor(0, 0, 0, 0);
  ctx.blendEquation(ctx.FUNC_ADD);
  ctx.blendFunc(ctx.ONE, ctx.ZERO);
  ctx.clearColor(0, 0, 0, 0);
  ctx.clearDepth(1);
  ctx.clearStencil(-1);
  ctx.colorMask(true, true, true, true);
  ctx.cullFace(ctx.BACK);
  ctx.depthFunc(ctx.LESS);
  ctx.depthMask(true);
  ctx.depthRange(0, 1);
  ctx.frontFace(ctx.CCW);
  ctx.hint(ctx.GENERATE_MIPMAP_HINT, ctx.DONT_CARE);
  ctx.lineWidth(1);
  ctx.pixelStorei(ctx.PACK_ALIGNMENT, 4);
  ctx.pixelStorei(ctx.UNPACK_ALIGNMENT, 4);
  ctx.pixelStorei(ctx.UNPACK_FLIP_Y_WEBGL, false);
  ctx.pixelStorei(ctx.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  // TODO: Delete this IF.
  if (ctx.UNPACK_COLORSPACE_CONVERSION_WEBGL) {
    ctx.pixelStorei(ctx.UNPACK_COLORSPACE_CONVERSION_WEBGL, ctx.BROWSER_DEFAULT_WEBGL);
  }
  ctx.polygonOffset(0, 0);
  ctx.sampleCoverage(1, false);
  ctx.scissor(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.stencilFunc(ctx.ALWAYS, 0, 0xFFFFFFFF);
  ctx.stencilMask(0xFFFFFFFF);
  ctx.stencilOp(ctx.KEEP, ctx.KEEP, ctx.KEEP);
  ctx.viewport(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
  ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT | ctx.STENCIL_BUFFER_BIT);

  // TODO: This should NOT be needed but Firefox fails with 'hint'
  while(ctx.getError());
}

function makeLostContextSimulatingContext(ctx) {
  var wrapper_ = {};
  var contextId_ = 1;
  var contextLost_ = false;
  var resourceId_ = 0;
  var resourceDb_ = [];
  var onLost_;
  var onRestored_;
  var nextOnRestored_;

  // Holds booleans for each GL error so can simulate errors.
  var glErrorShadow_ = { };

  function isWebGLObject(obj) {
    //return false;
    return (obj instanceof WebGLBuffer ||
            obj instanceof WebGLFramebuffer ||
            obj instanceof WebGLProgram ||
            obj instanceof WebGLRenderbuffer ||
            obj instanceof WebGLShader ||
            obj instanceof WebGLTexture);
  }

  function checkResources(args) {
    for (var ii = 0; ii < args.length; ++ii) {
      var arg = args[ii];
      if (isWebGLObject(arg)) {
        return arg.__webglDebugContextLostId__ == contextId_;
      }
    }
    return true;
  }

  function clearErrors() {
    var k = Object.keys(glErrorShadow_);
    for (var ii = 0; ii < k.length; ++ii) {
      delete glErrorShdow_[k];
    }
  }

  // Makes a function that simulates WebGL when out of context.
  function makeLostContextWrapper(ctx, functionName) {
    var f = ctx[functionName];
    return function() {
      // Only call the functions if the context is not lost.
      if (!contextLost_) {
        if (!checkResources(arguments)) {
          glErrorShadow_[ctx.INVALID_OPERATION] = true;
          return;
        }
        var result = f.apply(ctx, arguments);
        return result;
      }
    };
  }

  for (var propertyName in ctx) {
    if (typeof ctx[propertyName] == 'function') {
       wrapper_[propertyName] = makeLostContextWrapper(ctx, propertyName);
     } else {
       wrapper_[propertyName] = ctx[propertyName];
     }
  }

  function makeWebGLContextEvent(statusMessage) {
    return {statusMessage: statusMessage};
  }

  function freeResources() {
    for (var ii = 0; ii < resourceDb_.length; ++ii) {
      var resource = resourceDb_[ii];
      if (resource instanceof WebGLBuffer) {
        ctx.deleteBuffer(resource);
      } else if (resource instanceof WebctxFramebuffer) {
        ctx.deleteFramebuffer(resource);
      } else if (resource instanceof WebctxProgram) {
        ctx.deleteProgram(resource);
      } else if (resource instanceof WebctxRenderbuffer) {
        ctx.deleteRenderbuffer(resource);
      } else if (resource instanceof WebctxShader) {
        ctx.deleteShader(resource);
      } else if (resource instanceof WebctxTexture) {
        ctx.deleteTexture(resource);
      }
    }
  }

  wrapper_.loseContext = function() {
    if (!contextLost_) {
      contextLost_ = true;
      ++contextId_;
      while (ctx.getError());
      clearErrors();
      glErrorShadow_[ctx.CONTEXT_LOST_WEBGL] = true;
      setTimeout(function() {
          if (onLost_) {
            onLost_(makeWebGLContextEvent("context lost"));
          }
        }, 0);
    }
  };

  wrapper_.restoreContext = function() {
    if (contextLost_) {
      if (onRestored_) {
        setTimeout(function() {
            freeResources();
            resetToInitialState(ctx);
            contextLost_ = false;
            if (onRestored_) {
              var callback = onRestored_;
              onRestored_ = nextOnRestored_;
              nextOnRestored_ = undefined;
              callback(makeWebGLContextEvent("context restored"));
            }
          }, 0);
      } else {
        throw "You can not restore the context without a listener";
      }
    }
  };

  // Wrap a few functions specially.
  wrapper_.getError = function() {
    var err;
    if (!contextLost_) {
      while (err == ctx.getError()) {
        glErrorShadow_[err] = true;
      }
    }
    for (err in glErrorShadow_) {
      if (glErrorShadow_[err]) {
        delete glErrorShadow_[err];
        return err;
      }
    }
    return ctx.NO_ERROR;
  };

  var creationFunctions = [
    "createBuffer",
    "createFramebuffer",
    "createProgram",
    "createRenderbuffer",
    "createShader",
    "createTexture"
  ];

  var ii, functionName;
  var wrapperFunc = function(f) {
    return function() {
      if (contextLost_) {
        return null;
      }
      var obj = f.apply(ctx, arguments);
      obj.__webglDebugContextLostId__ = contextId_;
      resourceDb_.push(obj);
      return obj;
    };
  };

  var wrapperReturnNull = function(f) {
    return function() {
      if (contextLost_) {
        return null;
      }
      return f.apply(ctx, arguments);
    };
  };

  var wrapperIsFunction = function(f) {
    return function() {
      if (contextLost_) {
        return false;
      }
      return f.apply(ctx, arguments);
    };
  };

  for (ii = 0; ii < creationFunctions.length; ++ii) {
    functionName = creationFunctions[ii];
    wrapper_[functionName] = wrapperFunc(ctx[functionName]);
  }

  var functionsThatShouldReturnNull = [
    "getActiveAttrib",
    "getActiveUniform",
    "getBufferParameter",
    "getContextAttributes",
    "getAttachedShaders",
    "getFramebufferAttachmentParameter",
    "getParameter",
    "getProgramParameter",
    "getProgramInfoLog",
    "getRenderbufferParameter",
    "getShaderParameter",
    "getShaderInfoLog",
    "getShaderSource",
    "getTexParameter",
    "getUniform",
    "getUniformLocation",
    "getVertexAttrib"
  ];
  for (ii = 0; ii < functionsThatShouldReturnNull.length; ++ii) {
    functionName = functionsThatShouldReturnNull[ii];
    wrapper_[functionName] = wrapperReturnNull(wrapper_[functionName]);
  }

  var isFunctions = [
    "isBuffer",
    "isEnabled",
    "isFramebuffer",
    "isProgram",
    "isRenderbuffer",
    "isShader",
    "isTexture"
  ];

  for (ii = 0; ii < isFunctions.length; ++ii) {
    functionName = isFunctions[ii];
    wrapper_[functionName] = wrapperIsFunction(wrapper_[functionName]);
  }

  wrapper_.checkFramebufferStatus = function(f) {
    return function() {
      if (contextLost_) {
        return ctx.FRAMEBUFFER_UNSUPPORTED;
      }
      return f.apply(ctx, arguments);
    };
  }(wrapper_.checkFramebufferStatus);

  wrapper_.getAttribLocation = function(f) {
    return function() {
      if (contextLost_) {
        return -1;
      }
      return f.apply(ctx, arguments);
    };
  }(wrapper_.getAttribLocation);

  wrapper_.getVertexAttribOffset = function(f) {
    return function() {
      if (contextLost_) {
        return 0;
      }
      return f.apply(ctx, arguments);
    };
  }(wrapper_.getVertexAttribOffset);

  wrapper_.isContextLost = function() {
    return contextLost_;
  };

  function wrapEvent(listener) {
    if (typeof(listener) == "function") {
      return listener;
    } else {
      return function(info) {
        listener.handleEvent(info);
      };
    }
  }

  wrapper_.registerOnContextLostListener = function(listener) {
    onLost_ = wrapEvent(listener);
  };

  wrapper_.registerOnContextRestoredListener = function(listener) {
    if (contextLost_) {
      nextOnRestored_ = wrapEvent(listener);
    } else {
      onRestored_ = wrapEvent(listener);
    }
  };

  return wrapper_;
}

return {
  /**
   * Initializes this module. Safe to call more than once.
   * @param {!WebGLRenderingContext} ctx A WebGL context. If
   *    you have more than one context it doesn't matter which one
   *    you pass in, it is only used to pull out constants.
   */
  'init': init,

  /**
   * Returns true or false if value matches any WebGL enum
   * @param {*} value Value to check if it might be an enum.
   * @return {boolean} True if value matches one of the WebGL defined enums
   */
  'mightBeEnum': mightBeEnum,

  /**
   * Gets an string version of an WebGL enum.
   *
   * Example:
   *   WebGLDebugUtil.init(ctx);
   *   var str = WebGLDebugUtil.glEnumToString(ctx.getError());
   *
   * @param {number} value Value to return an enum for
   * @return {string} The string version of the enum.
   */
  'glEnumToString': glEnumToString,

  /**
   * Converts the argument of a WebGL function to a string.
   * Attempts to convert enum arguments to strings.
   *
   * Example:
   *   WebGLDebugUtil.init(ctx);
   *   var str = WebGLDebugUtil.glFunctionArgToString('bindTexture', 0, gl.TEXTURE_2D);
   *
   * would return 'TEXTURE_2D'
   *
   * @param {string} functionName the name of the WebGL function.
   * @param {number} argumentIndx the index of the argument.
   * @param {*} value The value of the argument.
   * @return {string} The value as a string.
   */
  'glFunctionArgToString': glFunctionArgToString,

  /**
   * Given a WebGL context returns a wrapped context that calls
   * gl.getError after every command and calls a function if the
   * result is not NO_ERROR.
   *
   * You can supply your own function if you want. For example, if you'd like
   * an exception thrown on any GL error you could do this
   *
   *    function throwOnGLError(err, funcName, args) {
   *      throw WebGLDebugUtils.glEnumToString(err) + " was caused by call to" +
   *            funcName;
   *    };
   *
   *    ctx = WebGLDebugUtils.makeDebugContext(
   *        canvas.getContext("webgl"), throwOnGLError);
   *
   * @param {!WebGLRenderingContext} ctx The webgl context to wrap.
   * @param {!function(err, funcName, args): void} opt_onErrorFunc The function
   *     to call when gl.getError returns an error. If not specified the default
   *     function calls console.log with a message.
   */
  'makeDebugContext': makeDebugContext,

  /**
   * Given a WebGL context returns a wrapped context that adds 4
   * functions.
   *
   * ctx.loseContext:
   *   simulates a lost context event.
   *
   * ctx.restoreContext:
   *   simulates the context being restored.
   *
   * ctx.registerOnContextLostListener(listener):
   *   lets you register a listener for context lost. Use instead
   *   of addEventListener('webglcontextlostevent', listener);
   *
   * ctx.registerOnContextRestoredListener(listener):
   *   lets you register a listener for context restored. Use
   *   instead of addEventListener('webglcontextrestored',
   *   listener);
   *
   * @param {!WebGLRenderingContext} ctx The webgl context to wrap.
   */
  'makeLostContextSimulatingContext': makeLostContextSimulatingContext,

  /**
   * Resets a context to the initial state.
   * @param {!WebGLRenderingContext} ctx The webgl context to
   *     reset.
   */
  'resetToInitialState': resetToInitialState
};

}();


// cuon-utils.js (c) 2012 kanda and matsuda
/**
 * Create a program object and make current
 * @param gl GL context
 * @param vshader a vertex shader program (string)
 * @param fshader a fragment shader program (string)
 * @return true, if the program object was created and successfully made current 
 */
function initShaders(gl, vshader, fshader) {
  var program = createProgram(gl, vshader, fshader);
  if (!program) {
    console.log('Failed to create program');
    return false;
  }

  gl.useProgram(program);
  gl.program = program;

  return true;
}

/**
 * Create the linked program object
 * @param gl GL context
 * @param vshader a vertex shader program (string)
 * @param fshader a fragment shader program (string)
 * @return created program object, or null if the creation has failed
 */
function createProgram(gl, vshader, fshader) {
  // Create shader object
  var vertexShader = loadShader(gl, gl.VERTEX_SHADER, vshader);
  var fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fshader);
  if (!vertexShader || !fragmentShader) {
    return null;
  }

  // Create a program object
  var program = gl.createProgram();
  if (!program) {
    return null;
  }

  // Attach the shader objects
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  // Link the program object
  gl.linkProgram(program);

  // Check the result of linking
  var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!linked) {
    var error = gl.getProgramInfoLog(program);
    console.log('Failed to link program: ' + error);
    gl.deleteProgram(program);
    gl.deleteShader(fragmentShader);
    gl.deleteShader(vertexShader);
    return null;
  }
  return program;
}

/**
 * Create a shader object
 * @param gl GL context
 * @param type the type of the shader object to be created
 * @param source shader program (string)
 * @return created shader object, or null if the creation has failed.
 */
function loadShader(gl, type, source) {
  // Create shader object
  var shader = gl.createShader(type);
  if (shader === null) {
    console.log('unable to create shader');
    return null;
  }

  // Set the shader program
  gl.shaderSource(shader, source);

  // Compile the shader
  gl.compileShader(shader);

  // Check the result of compilation
  var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!compiled) {
    var error = gl.getShaderInfoLog(shader);
    console.log('Failed to compile shader: ' + error);
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

/** 
 * Initialize and get the rendering for WebGL
 * @param canvas <cavnas> element
 * @param opt_debug flag to initialize the context for debugging
 * @return the rendering context for WebGL
 */
function getWebGLContext(canvas, opt_debug) {
  // Get the rendering context for WebGL
  var gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) return null;

  // if opt_debug is explicitly false, create the context for debugging
  if (arguments.length < 2 || opt_debug) {
    gl = WebGLDebugUtils.makeDebugContext(gl);
  }

  return gl;
}

/*
 * Copyright 2010, Google Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */


/**
 * @fileoverview This file contains functions every webgl program will need
 * a version of one way or another.
 *
 * Instead of setting up a context manually it is recommended to
 * use. This will check for success or failure. On failure it
 * will attempt to present an approriate message to the user.
 *
 *       gl = WebGLUtils.setupWebGL(canvas);
 *
 * For animated WebGL apps use of setTimeout or setInterval are
 * discouraged. It is recommended you structure your rendering
 * loop like this.
 *
 *       function render() {
 *         window.requestAnimFrame(render, canvas);
 *
 *         // do rendering
 *         ...
 *       }
 *       render();
 *
 * This will call your rendering function up to the refresh rate
 * of your display but will stop rendering if your app is not
 * visible.
 */

WebGLUtils = function() {

/**
 * Creates the HTLM for a failure message
 * @param {string} canvasContainerId id of container of th
 *        canvas.
 * @return {string} The html.
 */
var makeFailHTML = function(msg) {
  return '' +
    '<table style="background-color: #8CE; width: 100%; height: 100%;"><tr>' +
    '<td align="center">' +
    '<div style="display: table-cell; vertical-align: middle;">' +
    '<div style="">' + msg + '</div>' +
    '</div>' +
    '</td></tr></table>';
};

/**
 * Mesasge for getting a webgl browser
 * @type {string}
 */
var GET_A_WEBGL_BROWSER = '' +
  'This page requires a browser that supports WebGL.<br/>' +
  '<a href="http://get.webgl.org">Click here to upgrade your browser.</a>';

/**
 * Mesasge for need better hardware
 * @type {string}
 */
var OTHER_PROBLEM = '' +
  "It doesn't appear your computer can support WebGL.<br/>" +
  '<a href="http://get.webgl.org/troubleshooting/">Click here for more information.</a>';

/**
 * Creates a webgl context. If creation fails it will
 * change the contents of the container of the <canvas>
 * tag to an error message with the correct links for WebGL.
 * @param {Element} canvas. The canvas element to create a
 *     context from.
 * @param {WebGLContextCreationAttirbutes} opt_attribs Any
 *     creation attributes you want to pass in.
 * @param {function:(msg)} opt_onError An function to call
 *     if there is an error during creation.
 * @return {WebGLRenderingContext} The created context.
 */
var setupWebGL = function(canvas, opt_attribs, opt_onError) {
  function handleCreationError(msg) {
    var container = canvas.parentNode;
    if (container) {
      var str = window.WebGLRenderingContext ?
           OTHER_PROBLEM :
           GET_A_WEBGL_BROWSER;
      if (msg) {
        str += "<br/><br/>Status: " + msg;
      }
      container.innerHTML = makeFailHTML(str);
    }
  }

  opt_onError = opt_onError || handleCreationError;

  if (canvas.addEventListener) {
    canvas.addEventListener("webglcontextcreationerror", function(event) {
          opt_onError(event.statusMessage);
        }, false);
  }
  var context = create3DContext(canvas, opt_attribs);
  if (!context) {
    if (!window.WebGLRenderingContext) {
      opt_onError("");
    }
  }
  return context;
};

/**
 * Creates a webgl context.
 * @param {!Canvas} canvas The canvas tag to get context
 *     from. If one is not passed in one will be created.
 * @return {!WebGLContext} The created context.
 */
var create3DContext = function(canvas, opt_attribs) {
  var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
  var context = null;
  for (var ii = 0; ii < names.length; ++ii) {
    try {
      context = canvas.getContext(names[ii], opt_attribs);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  return context;
};

return {
  create3DContext: create3DContext,
  setupWebGL: setupWebGL
};
}();
