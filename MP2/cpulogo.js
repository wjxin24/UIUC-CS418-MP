// global variables
let cpuBuf /* cpu buffer to store the result of gl.createBuffer() */
let posBuf  /* Float32Array for current vertex positions */

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

/**
 * Animation callback for CPU-based vertex movement
 */
function drawcpu(milliseconds) {
    gl.clear(gl.COLOR_BUFFER_BIT) 
    // console.log("posBuf",posBuf)
    for (i=0; i<12; i+=2) {
        posBuf[i] -= 0.005*Math.sin(0.005*milliseconds)
        posBuf[i+posBuf.length/2] += 0.005*Math.sin(0.005*milliseconds)
    }
    // console.log("posBuf",posBuf)
    gl.bindVertexArray(window.cpugeom.vao)
  
    gl.bindBuffer(gl.ARRAY_BUFFER, cpuBuf)
    gl.bufferData(gl.ARRAY_BUFFER, posBuf, gl.DYNAMIC_DRAW)
    gl.drawElements(cpugeom.mode, cpugeom.count, cpugeom.type, 0)
    window.pending = requestAnimationFrame(drawcpu)
}

/** Initialize geometry for CPU based vertex movement */
async function cpuBasedSetup() {
    window.gl = document.querySelector('canvas').getContext('webgl2')
    let vs = await fetch('vertex.glsl').then(res => res.text())
    let fs = await fetch('fragment.glsl').then(res => res.text())
    compileAndLinkGLSL(vs,fs)
    let data = await fetch('geometry.json').then(r=>r.json())
    window.cpugeom = setupGeomeryCPU(data)
    requestAnimationFrame(drawcpu)
}

