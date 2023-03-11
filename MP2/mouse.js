// global variables
let logoX = 0 // current position of the logo
let logoY = 0
let mouseX = 0 // current mouse position on the canvas
let mouseY = 0
let lastTime = 0 // the time of the last frame
let speed = 1 // controls the speed for logo motion

/**
 * Animation callback for mouse response.
 * The logo will smoothly follows the mouse position.
*/
function drawmouse(milliseconds) {
  gl.clear(gl.COLOR_BUFFER_BIT) 
  gl.useProgram(window.program)

  // calculate the time since last frame
  let deltaTime = milliseconds - lastTime
  lastTime = milliseconds

  // calculate the target position based on the mouse position on canvas
  targetX = (mouseX-250)/500
  targetY = (mouseY-250)/500

  // interpolate the logo position towards the target position
  let dx = targetX - logoX
  let dy = targetY - logoY
  logoX += dx * speed * deltaTime/1000
  logoY += dy * speed * deltaTime/1000

  // set up transform matrix for moving the logo
  m = m4trans(logoX, -logoY, 0) // move the logo by (logoX, -logoY)
  let mBindPoint = gl.getUniformLocation(program, 'm')
  gl.uniformMatrix4fv(mBindPoint, false,  m)

  gl.bindVertexArray(window.geom.vao)
  gl.drawElements(geom.mode, geom.count, geom.type, 0)
  
  window.pending = requestAnimationFrame(drawmouse)
}

/** Get current mouse position */ 
document.addEventListener('mousemove', function(event) {
  mouseX = event.clientX
  mouseY = event.clientY
})


/** Initialize WebGL and load geometry and shaders for the mouse response animation */
async function setupMouse() {
  window.gl = document.querySelector('canvas').getContext('webgl2')
  let vs = await fetch('vertex.glsl').then(res => res.text())
  let fs = await fetch('fragment.glsl').then(res => res.text())
  compileAndLinkGLSL(vs,fs)
  let data = await fetch('geometry.json').then(r=>r.json())
  window.geom = setupGeomery(data)
}

