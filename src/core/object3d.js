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
})();