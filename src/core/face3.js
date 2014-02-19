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
