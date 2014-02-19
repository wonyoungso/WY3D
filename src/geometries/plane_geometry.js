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


WY3D.PlaneGeometry.prototype = Object.create( WY3D.Geometry.prototype );