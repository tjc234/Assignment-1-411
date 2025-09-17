// create 2D vector
function vec2( x, y ) { return new Float32Array([ x, y ]);}

// main program
(function () {
  // get WebGL2 context
  const canvas = document.getElementById( 'gl-canvas' );
  const gl = canvas.getContext( 'webgl2');

  // shader setup 
  function compile( gl, src, type ) {
    const s = gl.createShader(type);
    // compile shaders by calling WebGL API
    gl.shaderSource( s, src);
    gl.compileShader(s);
    gl.getShaderParameter(s, gl.COMPILE_STATUS)
    return s;
  }
  // link shaders into a program
  function link( gl, vs, fs ) {
    const p = gl.createProgram();
    // attach shaders by calling WebGL API
    gl.attachShader( p, vs ); gl.attachShader( p, fs );
    gl.linkProgram( p );
    gl.getProgramParameter( p, gl.LINK_STATUS )
    return p;
  }

  // grab shader source from HTML tags and compile
  const vsSrc = document.getElementById( 'vshader' ).textContent;
  const fsSrc = document.getElementById( 'fshader' ).textContent;
  const vs = compile( gl, vsSrc, gl.VERTEX_SHADER );
  const fs = compile( gl, fsSrc, gl.FRAGMENT_SHADER );
  const prog = link( gl, vs, fs );
  gl.useProgram( prog );

  // get attribute locations
  const a_position = gl.getAttribLocation( prog, 'a_position' );

  // store line positions here
  const linePositions = [];

  // push line segment positions to array
  function pushLine( p0, p1 ) {
    linePositions.push( p0[0], p0[1], p1[0], p1[1] );
  }

  // draw triangle
  function drawTriangle( p0, p1, p2 ) {
    pushLine( p0, p1 );
    pushLine( p1, p2 );
    pushLine( p2, p0 );
  }

  // draw rectangle
  function drawRectangle( ul, lr ) {
    const ur = vec2( lr[0], ul[1] );
    const ll = vec2( ul[0], lr[1] );
    pushLine( ul, ur );
    pushLine( ur, lr );
    pushLine( lr, ll );
    pushLine( ll, ul );
  }

  // draw circle
  function drawCircle( center, radius, segments = 48 ) {
    let prev = null;
    for ( let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      const p = vec2( center[0] + radius * Math.cos(t),
                      center[1] + radius * Math.sin(t));
      if ( prev ) pushLine( prev, p );
      prev = p;
    }
  }

  // draw rocket
  function scene() {

    gl.clearColor( 1, 1, 1, 1 );

    gl.clear( gl.COLOR_BUFFER_BIT );

    // setup rocket positions in -1 to 1 space
    const bodyLeft   = -0.20;
    const bodyRight  =  0.20;
    const bodyTop    =  0.60;
    const bodyBottom = -0.55;
    const tipApexY   =  0.85; 
    const windowY    =  0.45;  
    const windowR    =  0.085;
    const lfTopOnBodyY    = -0.25;
    const lfBottomOnBodyY = -0.45;
    const lfOutX          = -0.45;
    const rfTopOnBodyY    = lfTopOnBodyY;
    const rfBottomOnBodyY = lfBottomOnBodyY;
    const rfOutX          =  0.45;

    // draw nose
    const tipApex = vec2( 0.0, tipApexY );
    const tipL    = vec2( bodyLeft,  bodyTop );
    const tipR    = vec2( bodyRight, bodyTop );
    drawTriangle( tipApex, tipL, tipR );

    // draw body
    drawRectangle( vec2( bodyLeft, bodyTop ), vec2( bodyRight, bodyBottom ) );

    // draw left fin
    const lfA = vec2( bodyLeft, lfTopOnBodyY );
    const lfB = vec2( lfOutX,   (lfTopOnBodyY + lfBottomOnBodyY) * 0.5 );
    const lfC = vec2( bodyLeft, lfBottomOnBodyY );
    drawTriangle( lfA, lfB, lfC );

    // draw right fin
    const rfA = vec2( bodyRight, rfTopOnBodyY );
    const rfB = vec2( rfOutX,    (rfTopOnBodyY + rfBottomOnBodyY) * 0.5 );
    const rfC = vec2( bodyRight, rfBottomOnBodyY );
    drawTriangle( rfA, rfB, rfC );

    // draw window
    drawCircle( vec2( 0.0, windowY ), windowR, 64 );
  }

  // flush to GPU and draw
  function flush() {
    const posBuf = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, posBuf );
    gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(linePositions), gl.STATIC_DRAW );

    gl.enableVertexAttribArray( a_position );
    gl.vertexAttribPointer( a_position, 2, gl.FLOAT, false, 0, 0 );

    gl.drawArrays( gl.LINES, 0, linePositions.length / 2 );
  }

// main
  function main() {
    scene();
    flush();
  }
  main();

})();
