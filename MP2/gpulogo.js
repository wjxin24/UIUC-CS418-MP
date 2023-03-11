/**
 * Animation callback for GPU-based vertex movement
 */
function drawgpu(milliseconds) {
  gl.clear(gl.COLOR_BUFFER_BIT) 
  gl.useProgram(window.program)

  let secondsBindPoint = gl.getUniformLocation(program, 'seconds')
  gl.uniform1f(secondsBindPoint, milliseconds/500)

  gl.bindVertexArray(window.geom.vao)
  gl.drawElements(geom.mode, geom.count, geom.type, 0)
  window.pending = requestAnimationFrame(drawgpu)
}


/** Initialize WebGL and load geometry and shaders for the gpu based vertex movement */
async function gpuBasedSetup() {
  window.gl = document.querySelector('canvas').getContext('webgl2')
  let vs = await fetch('gpu-vertex.glsl').then(res => res.text())
  let fs = await fetch('fragment.glsl').then(res => res.text())
  compileAndLinkGLSL(vs,fs)
  let data = await fetch('geometry.json').then(r=>r.json())
  window.geom = setupGeomery(data)
}

