/**
 * Animation callback for the collisions.
 */
function drawcollision(milliseconds) {
  gl.clear(gl.COLOR_BUFFER_BIT) 
  gl.useProgram(window.program)

  let secondsBindPoint = gl.getUniformLocation(program, 'seconds')
  gl.uniform1f(secondsBindPoint, milliseconds/1000)
  
  // matrix to move the upper logo
  m_up = m4trans(0,0.275*Math.sin(0.005*milliseconds),0)
  // matrix to move the lower logo
  m_down = m4trans(0,-0.275*Math.sin(0.005*milliseconds),0)
  let mUpBindPoint = gl.getUniformLocation(program, 'm_up')
  gl.uniformMatrix4fv(mUpBindPoint, false,  m_up)
  let mDownBindPoint = gl.getUniformLocation(program, 'm_down')
  gl.uniformMatrix4fv(mDownBindPoint, false,  m_down)


  gl.bindVertexArray(window.geom.vao)
  gl.drawElements(geom.mode, geom.count, geom.type, 0)
  window.pending = requestAnimationFrame(drawcollision)
}


/** Initialize WebGL and load geometry and shaders for the collisions */
async function setupCollision() {
  window.gl = document.querySelector('canvas').getContext('webgl2')
  let vs = await fetch('col-vertex.glsl').then(res => res.text())
  let fs = await fetch('fragment.glsl').then(res => res.text())
  compileAndLinkGLSL(vs,fs)
  let data = await fetch('col-geometry.json').then(r=>r.json())
  window.geom = setupGeomery(data)
}

