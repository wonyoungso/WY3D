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
