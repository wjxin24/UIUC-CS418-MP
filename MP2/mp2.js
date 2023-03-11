// global variables
let jsondata  /* json data fetched from geometry.json */
let cpuBuf /* cpu buffer to store the result of gl.createBuffer() */
let posBuf  /* Float32Array for current vertex positions */


/**
 *Compiles and links vertex and fragment shaders to create a WebGL program.
 *@param {string} vs_source The source code of the vertex shader.
 *@param {string} fs_source The source code of the fragment shader.
*/
function compileAndLinkGLSL(vs_source, fs_source) { 
  let vs = gl.createShader(gl.VERTEX_SHADER)
  gl.shaderSource(vs, vs_source)
  gl.compileShader(vs)
  if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(vs))
      throw Error("Vertex shader compilation failed")
  }

  let fs = gl.createShader(gl.FRAGMENT_SHADER)
  gl.shaderSource(fs, fs_source)
  gl.compileShader(fs)
  if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(fs))
      throw Error("Fragment shader compilation failed")
  }

  window.program = gl.createProgram()
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program))
      throw Error("Linking failed")
  }
}


/**
 * Sets up a new geometry for rendering with WebGL.
 *
 * @param {object} geom The source code of the geometry.
 * @returns {object} The setup geometry.
 */
function setupGeomery(geom) {
  var triangleArray = gl.createVertexArray()
  gl.bindVertexArray(triangleArray)

  Object.entries(geom.attributes).forEach(([name,data]) => {
      let buf = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buf)
      let f32 = new Float32Array(data.flat())
      gl.bufferData(gl.ARRAY_BUFFER, f32, gl.STATIC_DRAW)
      
      let loc = gl.getAttribLocation(program, name)
      gl.vertexAttribPointer(loc, data[0].length, gl.FLOAT, false, 0, 0)
      gl.enableVertexAttribArray(loc)
      console.log(f32)
  })
  
  var indices = new Uint16Array(geom.triangles.flat())
  var indexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)

  return {
      mode: gl.TRIANGLES,
      count: indices.length,
      type: gl.UNSIGNED_SHORT,
      vao: triangleArray
  }
}


/**
 * Sets up a new geometry for CPU based rendering.
 * 
 * @param {object} geom The source code of the geometry.
 * @returns {object} The setup geometry.
 */
function setupGeomeryCPU(geom) {
  var triangleArray = gl.createVertexArray()
  gl.bindVertexArray(triangleArray)

  Object.entries(geom.attributes).forEach(([name,data]) => {
      console.log([name,data])
      if (name == "position") { // position buffer will have changing data
        cpuBuf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, cpuBuf)
        posBuf = new Float32Array(data.flat())
        console.log("posBuf",posBuf)
        gl.bufferData(gl.ARRAY_BUFFER, posBuf, gl.DYNAMIC_DRAW)
      }
      else {
        let buf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
        let f32 = new Float32Array(data.flat())
        gl.bufferData(gl.ARRAY_BUFFER, f32, gl.STATIC_DRAW)
      }

      let loc = gl.getAttribLocation(program, name)
      gl.vertexAttribPointer(loc, data[0].length, gl.FLOAT, false, 0, 0)
      gl.enableVertexAttribArray(loc)
  })
  
  var indices = new Uint16Array(geom.triangles.flat())
  var indexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)

  return {
      mode: gl.TRIANGLES,
      count: indices.length,
      type: gl.UNSIGNED_SHORT,
      vao: triangleArray
  }
}

function draw(milliseconds) {
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(program)
    let secondsBindPoint = gl.getUniformLocation(program, 'seconds')
    gl.uniform1f(secondsBindPoint, milliseconds/1000)
    gl.bindVertexArray(window.geom.vao)
    gl.drawElements(geom.mode, geom.count, geom.type, 0)
    window.animation = requestAnimationFrame(draw)
}



/**
 * Animation callback for the dancing logo.
 * The "I" logo with changing size moves along a clockwise path.
 */
function drawlogo(milliseconds) {
  gl.clear(gl.COLOR_BUFFER_BIT) 
  gl.useProgram(window.program)

  let secondsBindPoint = gl.getUniformLocation(program, 'seconds')
  gl.uniform1f(secondsBindPoint, milliseconds/1000)

  // transform matrix
  m = m4mul(m4trans(0.5*Math.sin(0.001*milliseconds),0.5*Math.cos(0.001*milliseconds),0), m4scale(0.5*Math.sin(0.0005*milliseconds),0.5*Math.sin(0.0005*milliseconds),0))
  let mBindPoint = gl.getUniformLocation(program, 'm')
  gl.uniformMatrix4fv(mBindPoint, false,  m)

  gl.bindVertexArray(window.geom.vao)
  gl.drawElements(geom.mode, geom.count, geom.type, 0)
  window.pending = requestAnimationFrame(drawlogo)
}

/**
 * Animation callback for CPU-based vertex movement
 */
function drawcpu(milliseconds) {
  gl.clear(gl.COLOR_BUFFER_BIT) 

  for (i=0; i<posBuf.length/2; i+=2) {
      posBuf[i] -= 0.005*Math.sin(0.005*milliseconds)
      posBuf[i+posBuf.length/2] += 0.005*Math.sin(0.005*milliseconds)
  }

  gl.bindVertexArray(window.cpugeom.vao)

  gl.bindBuffer(gl.ARRAY_BUFFER, cpuBuf)
  gl.bufferData(gl.ARRAY_BUFFER, posBuf, gl.DYNAMIC_DRAW)
  gl.drawElements(cpugeom.mode, cpugeom.count, cpugeom.type, 0)
  window.pending = requestAnimationFrame(drawcpu)
}

/**
 * Animation callback for GPU-based vertex movement
 */
function drawgpu(milliseconds) {
  gl.clear(gl.COLOR_BUFFER_BIT) 
  gl.useProgram(window.program)

  let secondsBindPoint = gl.getUniformLocation(program, 'seconds')
  gl.uniform1f(secondsBindPoint, milliseconds/500)

  // set gpuFlag in vertex shader to be true
  let gpuFlagBindPoint = gl.getUniformLocation(program, 'gpuFlag')
  gl.uniform1i(gpuFlagBindPoint, true)

  gl.bindVertexArray(window.geom.vao)
  gl.drawElements(geom.mode, geom.count, geom.type, 0)
  window.pending = requestAnimationFrame(drawgpu)
}


/** Callback for when the radio button selection changes */
function radioChanged() {
  let chosen = document.querySelector('input[name="example"]:checked').value
  cancelAnimationFrame(window.pending)

  if (chosen == "collision") {
    setupCollision()
  }
  if (chosen == "psychedelic") {
    setupPsychedelic()
  }
  if (chosen == "stick") {
    setupStick()
  }
  if (chosen == "cpu") {
    setup()
    cpuBasedSetup()
  }
  if (chosen == "logo" || chosen == "gpu") {
    setup()
  }
  window.pending = requestAnimationFrame(window['draw'+chosen])
}

/** Resizes the canvas to be a square that fits on the screen with at least 20% vertical padding */
function resizeCanvas() {
  let c = document.querySelector('canvas')
  c.width = c.parentElement.clientWidth
  c.height = document.documentElement.clientHeight * 0.8
  console.log(c.width, c.height)
  if (c.width > c.height) c.width = c.height
  else c.height = c.width
}

/** Initialize WebGL and load geometry and shaders */
async function setup() {
  window.gl = document.querySelector('canvas').getContext('webgl2')
  let vs = await fetch('vertex.glsl').then(res => res.text())
  let fs = await fetch('fragment.glsl').then(res => res.text())
  compileAndLinkGLSL(vs,fs)
  jsondata = await fetch('geometry.json').then(r=>r.json())
  window.geom = setupGeomery(jsondata)
  requestAnimationFrame(drawlogo)
}

/** Initialize geometry for CPU based vertex movement */
async function cpuBasedSetup() {
  window.cpugeom = setupGeomeryCPU(jsondata)
}


/**
 * Initializes WebGL and event handlers after page is fully loaded.
 * This example uses only `gl.clear` so it doesn't need any shaders, etc;
 * any real program would initialize models, shaders, and programs for each
 * display and store them for future use before calling `radioChanged` and
 * thus initializing the render.
 */
window.addEventListener('load',(event)=>{
  setup()
  resizeCanvas() 
  window.gl = document.querySelector('canvas').getContext('webgl2')
  document.querySelectorAll('input[name="example"]').forEach(elem => {
      elem.addEventListener('change', radioChanged)
  })
  // requestAnimationFrame(drawlogo)
  radioChanged()
})