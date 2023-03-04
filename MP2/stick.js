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

function drawstick(milliseconds) {
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(program)
    // const connection = gl.LINES
    // const offset = 0
    // const count = 12
    // gl.drawArrays(gl.LINES, offset, count)
    let secondsBindPoint = gl.getUniformLocation(program, 'seconds')
    gl.uniform1f(secondsBindPoint, milliseconds/1000)



    gl.bindVertexArray(window.geom.vao)
    gl.drawElements(geom.mode, geom.count, geom.type, 0)
    window.pending = requestAnimationFrame(drawstick)
}

async function setupStick(event) {
    window.gl = document.querySelector('canvas').getContext('webgl2')
    let vs = await fetch('stick-vertex.glsl').then(res => res.text())
    let fs = await fetch('stick-fragment.glsl').then(res => res.text())
    compileAndLinkGLSL(vs,fs)
    let data = await fetch('stick-geometry.json').then(r=>r.json())
    window.geom = setupGeomeryStick(data)
    requestAnimationFrame(drawstick)
}

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
