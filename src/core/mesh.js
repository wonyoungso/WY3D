WY3D.Mesh = (function(){
  function Mesh(geometry){
    WY3D.Object3D.call(this);

    this.geometry = geometry;
  }

  Mesh.prototype = Object.create(WY3D.Object3D.prototype);
  
  return Mesh;
})();

