const IlliniBlue = new Float32Array([0.075, 0.16, 0.292, 1])
const IlliniOrange = new Float32Array([1, 0.373, 0.02, 1])
const IdentityMatrix = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1])



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

    let program = gl.createProgram()
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program))
        throw Error("Linking failed")
    }
    
    return program
}

function supplyDataBuffer(data, program, vsIn, mode) {
    if (mode === undefined) mode = gl.STATIC_DRAW
    
    let buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    let f32 = new Float32Array(data.flat())
    gl.bufferData(gl.ARRAY_BUFFER, f32, mode)
    
    let loc = gl.getAttribLocation(program, vsIn)
    gl.vertexAttribPointer(loc, data[0].length, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(loc)
    
    return buf;
}

function setupGeomery(geom) {
    var triangleArray = gl.createVertexArray()
    gl.bindVertexArray(triangleArray)

    for(let name in geom.attributes) {
        let data = geom.attributes[name]
        supplyDataBuffer(data, program, name)
    }

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
 * Draw one frame
 */
function draw() {
    cancelAnimationFrame(window.pending)
    gl.clearColor(...IlliniBlue) // f(...[1,2,3]) means f(1,2,3)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    gl.useProgram(program)

    gl.bindVertexArray(geom.vao)

    let lightdir = normalize([1,1,1])
    gl.uniform3fv(gl.getUniformLocation(program, 'lightdir'), lightdir)

    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'p'), false, p)
    for (let i=0; i<50; i++) {
        // load a model matrix for this particle's position and size
        let size = m4scale(0.05,0.05,0.05)
        let pos = add(spheres[i].position, spheres[i].velocity)
        console.log(pos)
        // bound off the wall
        if (pos[0] >= 1 || pos[0] <= -1) {
            pos[0] = pos[0] >= 1 ? 1 : -1
            spheres[i].velocity = [-0.9*spheres[i].velocity[0],spheres[i].velocity[1],spheres[i].velocity[2]]
        }
        if (pos[1] >= 1 || pos[1] <= -1) {
            pos[1] = pos[1] >= 1 ? 1 : -1
            spheres[i].velocity = [spheres[i].velocity[0],-0.9*spheres[i].velocity[1],spheres[i].velocity[2]]
        }
        if (pos[2] >= 1 || pos[2] <= -1) {
            pos[2] = pos[2] >= 1 ? 1 : -1
            spheres[i].velocity = [spheres[i].velocity[0],spheres[i].velocity[1],-0.9*spheres[i].velocity[2]]
        }

        // collision
        for (let j=0; j<50; j++) {
            if (i==j) {
                continue
            }
            if (checkCollide(spheres[i], spheres[j], 0.05)) {
                applyCollision(i,j)
            }
        }
        

        spheres[i].position = pos
        let m = m4mul(m4trans(...pos), size)
        console.log(m)
        gl.uniformMatrix4fv(gl.getUniformLocation(program, 'mv'), false, m4mul(v,m))
        // apply gravity to the sphere's velocity
        spheres[i].velocity = add(spheres[i].velocity, [0,-0.001,0])
        // apply drag to the sphere's velocity
        spheres[i].velocity = mul(spheres[i].velocity, 0.98)
        // load a color for this particle
        let color = spheres[i].color

        gl.uniform3fv(gl.getUniformLocation(program, 'color'), color)
        
        gl.drawElements(geom.mode, geom.count, geom.type, 0)
    }
}

/** Compute any time-varying or animated aspects of the scene */
function timeStep(milliseconds) {
    let seconds = milliseconds / 1000;

    window.v = m4view([0,0,5], [0,0,0], [0,1,0])

    draw()
    requestAnimationFrame(timeStep)
}

function checkCollide(sphere1, sphere2, r) {
    // Calculate the distance between the centers of the two spheres
    let distance = Math.sqrt(
      (sphere1.position[0] - sphere2.position[0]) ** 2 +
      (sphere1.position[1] - sphere2.position[1]) ** 2 +
      (sphere1.position[2] - sphere2.position[2]) ** 2)
    
    if (distance <= 2 * r) {
        return true;
    } else {
        return false;
    }
}
  
function applyCollision(i, j) {
    // Calculate the vector of the line along the two centers
    let line = normalize([
      spheres[i].position[0] - spheres[j].position[0],
      spheres[i].position[1] - spheres[j].position[1],
      spheres[i].position[2] - spheres[j].position[2]])
  
    // Calculate the relative velocity of the two spheres
    let relativeVelocity = [
      spheres[i].velocity[0] - spheres[j].velocity[0],
      spheres[i].velocity[1] - spheres[j].velocity[1],
      spheres[i].velocity[2] - spheres[j].velocity[2]]
    

    // to do: relative velo change should be along the line
    spheres[i].velocity = sub(spheres[i].velocity, div(relativeVelocity,2))
    spheres[j].velocity = add(spheres[j].velocity, div(relativeVelocity,2))
}
  
/**
 * Resizes the canvas to completely fill the screen
 */
function fillScreen() {
    let canvas = document.querySelector('canvas')
    document.body.style.margin = '0'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight
    canvas.style.width = ''
    canvas.style.height = ''
    // to do: update aspect ratio of projection matrix here
    if (window.gl) {
        gl.viewport(0,0, canvas.width, canvas.height)
        window.p = m4perspNegZ(1, 10, 1, canvas.width, canvas.height)
    }
}

/**
 * Compile, link, other option-independent setup
 */
async function setup(event) {
    window.gl = document.querySelector('canvas').getContext('webgl2',
        // optional configuration object: see https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext
        {antialias: false, depth:true, preserveDrawingBuffer:true}
    )
    // to do: more setup here
    let vs = await fetch('vertex.glsl').then(res => res.text())
    let fs = await fetch('fragment.glsl').then(res => res.text())
    window.program = compileAndLinkGLSL(vs,fs)

    gl.enable(gl.DEPTH_TEST)
    // enable alpha
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    fillScreen()

    let sphere = await fetch('sphere80.json').then(res => res.json())
    window.geom = setupGeomery(sphere, program)
    fillScreen()
    
    window.addEventListener('resize', fillScreen)

    // initialize sphere properties
    window.spheres = []
    for (let i=0; i<50; i++) {
        let color = [Math.random() * 255, Math.random() * 255, Math.random() * 255]
        let position = [Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1]
        let velocity = [(Math.random() * 2 - 1) * 0.05, (Math.random() * 2 - 1) * 0.05, (Math.random() * 2 - 1) * 0.05]
        let sphere = new Sphere(color, position, velocity)
        
        spheres.push(sphere)
    }

    requestAnimationFrame(timeStep)
}






window.addEventListener('load', setup)
window.addEventListener('resize', fillScreen)