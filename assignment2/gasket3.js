"use strict";

var canvas;
var gl;

var points = [];
var colors = [];

var NumTimesToSubdivide = 4;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    gl.enable( gl.DEPTH_TEST );
    gl.depthFunc( gl.LEQUAL );
    gl.clearDepth( 1.0 );

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Load the data into the GPU (positions)

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    // Load the data into the GPU (colors)

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var uMVP = gl.getUniformLocation( program, "uModelViewProj" );

    // Regular tetrahedron vertices (Angel & Shreiner convention)

    var va = vec3(  0.0,       0.0,        1.0      );
    var vb = vec3(  0.0,       0.942809,  -0.333333 );
    var vc = vec3( -0.816497, -0.471405,  -0.333333 );
    var vd = vec3(  0.816497, -0.471405,  -0.333333 );

    // Build geometry
    rebuild();

    function rebuild()
    {
        points = [];
        colors = [];

        divideTetra( va, vb, vc, vd, NumTimesToSubdivide );

        gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, flatten( points ), gl.STATIC_DRAW );

        gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, flatten( colors ), gl.STATIC_DRAW );

        render();
    }

    function triangle( a, b, c, color )
    {
        points.push( a, b, c );
        colors.push( color, color, color );
    }

    // Emit a solid tetrahedron with 4 differently colored faces
    function tetra( a, b, c, d )
    {
        var face0 = vec3( 0.95, 0.25, 0.25 ); // red
        var face1 = vec3( 0.25, 0.70, 0.35 ); // green
        var face2 = vec3( 0.25, 0.45, 0.95 ); // blue
        var face3 = vec3( 0.95, 0.85, 0.35 ); // yellow


        triangle( a, c, b, face0 ); 
        triangle( a, b, d, face1 );
        triangle( a, d, c, face2 );
        triangle( b, c, d, face3 );
    }

    // Volume subdivision into 4 tetrahedra via edge midpoints
    function divideTetra( a, b, c, d, count )
    {
        if ( count === 0 ) {
            tetra( a, b, c, d );
            return;
        }

        var ab = mix( a, b, 0.5 );
        var ac = mix( a, c, 0.5 );
        var ad = mix( a, d, 0.5 );
        var bc = mix( b, c, 0.5 );
        var bd = mix( b, d, 0.5 );
        var cd = mix( c, d, 0.5 );

        --count;

        divideTetra( a,  ab, ac, ad, count );
        divideTetra( ab, b,  bc, bd, count );
        divideTetra( ac, bc, c,  cd, count );
        divideTetra( ad, bd, cd, d,  count );
    }

    function computeMVP()
    {
        // Position the camera just above the apex so the tip dominates the frame
        var eye = vec3( 0.0, 0.0, 2.4 );
        var at  = vec3( 0.0, 0.0, 1.0 );
        var up  = vec3( 0.0, 1.0, 0.0 );

        var view = lookAt( eye, at, up );
        var model = mult( rotateX( -18.0 ), rotateZ( 20.0 ) );
        var mv = mult( view, model );

        var aspect = canvas.width / canvas.height;
        var proj = perspective( 40.0, aspect, 0.1, 10.0 );

        return mult( proj, mv );
    }

    function render()
    {
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
        var mvp = computeMVP();
        gl.uniformMatrix4fv( uMVP, false, flatten( mvp ) );
        gl.drawArrays( gl.TRIANGLES, 0, points.length );
    }
}
