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
})();