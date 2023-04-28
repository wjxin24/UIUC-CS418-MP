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

    // check if all spheres have settled down
    let settle = 1
    for (let i=0; i<50; i++) {
        if (mag(spheres[i].velocity) > 0.0008) {
            settle = 0
            break
        }
    }

    if (settle) {
        init50spheres()
        console.log("reset")
    }

    for (let i=0; i<50; i++) {
        // load a model matrix for this particle's position and size
        let radius = spheres[i].radius
        let size = m4scale(radius,radius,radius)
        let pos = add(spheres[i].position, spheres[i].velocity)
        // bound off the wall
        if (pos[0] >= 1 || pos[0] <= -1) {
            pos[0] = pos[0] >= 1 ? 1 : -1
            spheres[i].velocity = mul([-spheres[i].velocity[0],spheres[i].velocity[1],spheres[i].velocity[2]], 0.5)
        }
        if (pos[1] >= 1 || pos[1] <= -1) {
            pos[1] = pos[1] >= 1 ? 1 : -1
            spheres[i].velocity = mul([spheres[i].velocity[0],-spheres[i].velocity[1],spheres[i].velocity[2]], 0.5)
        }
        if (pos[2] >= 1 || pos[2] <= -1) {
            pos[2] = pos[2] >= 1 ? 1 : -1
            spheres[i].velocity = mul([spheres[i].velocity[0],spheres[i].velocity[1],-spheres[i].velocity[2]], 0.5)
        }

        // collision
        for (let j=i+1; j<50; j++) {
            if (checkCollide(spheres[i], spheres[j], radius, spheres[j].radius)) {
                noCollision = 0
                applyCollision(i,j)
                pos = add(spheres[i].position, spheres[i].velocity)
            }
            
        }
        spheres[i].position = pos

        let m = m4mul(m4trans(...pos), size)
        gl.uniformMatrix4fv(gl.getUniformLocation(program, 'mv'), false, m4mul(v,m))
        // apply gravity to the sphere's velocity
        if (spheres[i].position[1] > -1) {
            spheres[i].velocity = add(spheres[i].velocity, [0,-0.0002,0])
        }
        // apply drag to the sphere's velocity
        spheres[i].velocity = mul(spheres[i].velocity, 0.99)
        // load a color for this particle
        let color = spheres[i].color
        gl.uniform3fv(gl.getUniformLocation(program, 'color'), color)
        
        gl.drawElements(geom.mode, geom.count, geom.type, 0)
    }
}


/** Compute any time-varying or animated aspects of the scene */
async function timeStep(milliseconds) {
    let seconds = milliseconds / 1000;

    window.v = m4view([0,0,4], [0,0,0], [0,1,0])

    draw()

    document.querySelector('#fps').innerHTML = seconds.toFixed(3)

    requestAnimationFrame(timeStep)
}

function checkCollide(sphere1, sphere2, r1, r2) {
    // Calculate the distance between the centers of the two spheres
    let distance = Math.sqrt(
      (sphere1.position[0] - sphere2.position[0]) ** 2 +
      (sphere1.position[1] - sphere2.position[1]) ** 2 +
      (sphere1.position[2] - sphere2.position[2]) ** 2)
    
    if (distance <= r1 + r2) {
        return true;
    } else {
        return false;
    }
}
  
function applyCollision(i, j) {
    // Calculate the vector of the line along the two centers
    let line = normalize(sub(spheres[i].position, spheres[j].position))
    // Relative velocity of the two spheres along the line
    let relativeVelocity = mul(line, dot(spheres[i].velocity, line)-dot(spheres[j].velocity, line))
    // mass of spheres are propotional to their radii
    let m1 = spheres[i].radius ** 3
    let m2 = spheres[j].radius ** 3
    let w1 = m2/(m1+m2)
    let w2 = m1/(m1+m2)
    spheres[i].velocity = sub(spheres[i].velocity, mul(relativeVelocity, w1*2))
    spheres[j].velocity = add(spheres[j].velocity, mul(relativeVelocity, w2*2))
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

    init50spheres()

    requestAnimationFrame(timeStep)
}


// initialize sphere properties
function init50spheres() {
    window.spheres = []
    for (let i=0; i<50; i++) {
        let radius = Math.random() * 0.1 + 0.05   // radius range from 0.05 to 0.2
        let color = [Math.random() * 255, Math.random() * 255, Math.random() * 255]
        let position = [Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1]
        let velocity = [(Math.random() * 2 - 1) * 0.1, (Math.random() * 2 - 1) * 0.1, (Math.random() * 2 - 1) * 0.1]
        let sphere = new Sphere(radius, color, position, velocity)
        
        spheres.push(sphere)
    }
}


window.addEventListener('load', setup)
window.addEventListener('resize', fillScreen)