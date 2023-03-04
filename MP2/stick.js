/**
 * Animation callback for the walking stick.
 */
function drawstick(milliseconds) {
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(program)

    let secondsBindPoint = gl.getUniformLocation(program, 'seconds')
    gl.uniform1f(secondsBindPoint, (milliseconds/1000)%50)

    gl.bindVertexArray(window.geom.vao)
    gl.drawElements(geom.mode, geom.count, geom.type, 0)
    window.pending = requestAnimationFrame(drawstick)
}

/** Initialize WebGL and load geometry and shaders for the walking stick*/
async function setupStick(event) {
    window.gl = document.querySelector('canvas').getContext('webgl2')
    let vs = await fetch('stick-vertex.glsl').then(res => res.text())
    let fs = await fetch('stick-fragment.glsl').then(res => res.text())
    compileAndLinkGLSL(vs,fs)
    let data = await fetch('stick-geometry.json').then(r=>r.json())
    window.geom = setupGeomeryStick(data)
    requestAnimationFrame(drawstick)
}

/**
 * Sets up a new geometry for rendering the stick figure.
 *
 * @param {object} geom The source code of the geometry.
 * @returns {object} The setup geometry.
 */
function setupGeomeryStick(geom) {
  var lineArray = gl.createVertexArray()
  gl.bindVertexArray(lineArray)

  Object.entries(geom.attributes).forEach(([name, data]) => {
    let buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    let f32 = new Float32Array(data.flat())
    gl.bufferData(gl.ARRAY_BUFFER, f32, gl.STATIC_DRAW)

    let loc = gl.getAttribLocation(program, name)
    gl.vertexAttribPointer(loc, data[0].length, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(loc)
  })

  var indices = new Uint16Array(geom.lines.flat())
  var indexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)

  return {
    mode: gl.LINES,
    count: indices.length,
    type: gl.UNSIGNED_SHORT,
    vao: lineArray
  }
}

window.addEventListener('load',setupStick)
