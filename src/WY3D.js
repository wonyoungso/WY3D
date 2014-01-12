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
