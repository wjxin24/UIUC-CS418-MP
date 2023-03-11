/**
 * Animation callback for the psychedelic.
 */
function drawpsychedelic(milliseconds) {
  gl.clear(gl.COLOR_BUFFER_BIT) 
  gl.useProgram(window.program)

  let secondsBindPoint = gl.getUniformLocation(program, 'seconds')
  gl.uniform1f(secondsBindPoint, milliseconds/1000)

  gl.bindVertexArray(window.geom.vao)
  gl.drawElements(geom.mode, geom.count, geom.type, 0)
  window.pending = requestAnimationFrame(drawpsychedelic)
}


/** Initialize WebGL and load geometry and shaders for the psychedelic */
async function setupPsychedelic() {
  window.gl = document.querySelector('canvas').getContext('webgl2')
  let vs = await fetch('psy-vertex.glsl').then(res => res.text())
  let fs = await fetch('psy-fragment.glsl').then(res => res.text())
  compileAndLinkGLSL(vs,fs)
  let data = await fetch('psy-geometry.json').then(r=>r.json())
  window.geom = setupGeomery(data)
}

