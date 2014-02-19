WY3D.WebGLProgram = (function(){
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
