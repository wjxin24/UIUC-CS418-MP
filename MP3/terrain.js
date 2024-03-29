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
    let halfway = normalize(add(lightdir, [0,0,1]))

    gl.uniform3fv(gl.getUniformLocation(program, 'lightdir'), lightdir)
    gl.uniform3fv(gl.getUniformLocation(program, 'halfway'), halfway)
    gl.uniform3fv(gl.getUniformLocation(program, 'lightcolor'), [1,1,1])


    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'mv'), false, m4mul(v,m))
    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'p'), false, p)
    gl.drawElements(geom.mode, geom.count, geom.type, 0)

}

/** Compute any time-varying or animated aspects of the scene */
function timeStep(milliseconds) {
    let seconds = milliseconds / 1000;
    

    const angle = 0.25* Math.PI * Math.sin(seconds/2);
    window.m = m4mul(m4rotZ(angle), m4scale(2,2,2))
    window.v = m4view([0,-5 ,1.5], [0,0,0], [0,1,0])
    
    draw()
    requestAnimationFrame(timeStep)
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
        window.p = IdentityMatrix
        window.p = m4perspNegZ(0.1, 10, 1, canvas.width, canvas.height)
    }
}

/**
 * Create an n*n grid, initial z=0 for all vertices
 * @param {int} n   grid size
 * @returns     grid geometry
 */
function createGrid(n) {
    position = []
    triangles = []
    for (let x = 0; x < n; x++) {
        for (let y = 0; y < n; y++) {
            position.push([-1+y*2/(n-1), 1-x*2/(n-1), 0])
            if (x != n-1 && y != n-1) {
                let i = x*n + y
                triangles.push([i, i+n, i+1])
                triangles.push([i+1, i+n, i+n+1])
            }
        }
    }
    attributes = {
        position: position
    }
    grid = {
        attributes: attributes,
        triangles: triangles
    }
    
    return grid
}

/**
 * Generate random fault planes
 * @param geom   grid geometry
 * @param n      grid size
 * @param frac   number of fractures
 * @returns      grid geometry
 */
function faultPlane(geom, n, frac) {
    let delta = 1   // initial delta
    for (let i=0; i<frac; i++) {
        // generate a random point
        let x = Math.floor(Math.random() * (n-1))
        let y = Math.floor(Math.random() * (n-1))
        const p = geom.attributes.position[x*n+y]   // random point p
        let theta = Math.random() * 360
        let vn = [Math.cos(theta), Math.sin(theta), 0]  // random normal vector n
        for (let i=0; i<geom.attributes.position.length; i+=1) {
            // test which side of plane that vertex falls on
            let b = geom.attributes.position[i]
            if (dot(sub(b, p), vn) >= 0) {
                geom.attributes.position[i][2] += delta
            }
            else {geom.attributes.position[i][2] -= delta}
        }
        delta *= 0.95    // scale down delta for every slice
    }

    // control vertical separation
    let h = 1 // constant
    let zmax = 0
    let zmin = 0
    for (let i=0; i<geom.attributes.position.length; i+=1) {
        zmax = Math.max(geom.attributes.position[i][2], zmax)
        zmin = Math.min(geom.attributes.position[i][2], zmin)
    }
    for (let i=0; i<geom.attributes.position.length; i+=1) {
        geom.attributes.position[i][2] = (geom.attributes.position[i][2]-zmin)/(zmax-zmin)*h-h/2
    }

    return geom
}

/**
 * Perform Spheroidal Weathering
 * @param {*} geom      geometry of the grid
 * @param {*} gridsize  grid size
 * @param {*} n         number of iterations
 */
function weathering(geom, gridsize, n) {
    let k = 0.1 // ratio of moving each vertex towards the average of its neighbors
    for (let iter = 0; iter<n; iter++) {
        for (let i=0; i<geom.attributes.position.length; i+=1) {
            let x = Math.floor(i/gridsize)
            let y = i%gridsize
            let z_neigh = []  // z of neighbors for vertex(x,y)
            for (let nx = x-1; nx <= x+1; nx++) {
                for (let ny = y-1; ny <= y+1; ny++) {
                    let pos = nx*gridsize+ny
                    if (pos>=0 && pos<geom.attributes.position.length && pos!=i) {
                        z_neigh.push(geom.attributes.position[pos][2])
                    }
                }
            }
            let sum = 0
            for (let k=0; k<z_neigh.length; k++) {
                sum += z_neigh[k]
            }
            let avg = sum/z_neigh.length  // average z of neighbors
            geom.attributes.position[i][2] += k*(avg - geom.attributes.position[i][2])
        }
    }
    return geom
}

function addNormals(geom) {
    geom.attributes.normal = []
    for(let i=0; i<geom.attributes.position.length; i+=1) {
        geom.attributes.normal.push([0,0,0])
    }
    for(let i=0; i<geom.triangles.length; i+=1) {
        let tri = geom.triangles[i]
        let p0 = geom.attributes.position[tri[0]]
        let p1 = geom.attributes.position[tri[1]]
        let p2 = geom.attributes.position[tri[2]]
        let e1 = sub(p1,p0)
        let e2 = sub(p2,p0)
        let n = cross(e1,e2)
        geom.attributes.normal[tri[0]] = add(geom.attributes.normal[tri[0]], n)
        geom.attributes.normal[tri[1]] = add(geom.attributes.normal[tri[1]], n)
        geom.attributes.normal[tri[2]] = add(geom.attributes.normal[tri[2]], n)
    }
    for(let i=0; i<geom.attributes.position.length; i+=1) {
        geom.attributes.normal[i] = normalize(geom.attributes.normal[i] )
    }
    return geom
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
    
}

/**
 * Generate geometry, render the scene
 */
async function setupScene(scene, options) {
    console.log("To do: render",scene,"with options",options)
    if (scene == "terrain") {
        let gridsize = options["resolution"]
        let fractures = options["slices"]
        let iter = options["weathering"]
        let geom = createGrid(gridsize)
        geom = faultPlane(geom, gridsize, fractures)
        geom = addNormals(geom)
        geom = weathering(geom, gridsize, iter)
        window.geom = setupGeomery(geom)
        window.addEventListener('resize', fillScreen)
        requestAnimationFrame(timeStep)
    }
    else if (scene == "UV-sphere") {
        let vs = await fetch('UVsphere-vertex.glsl').then(res => res.text())
        let fs = await fetch('UVsphere-fragment.glsl').then(res => res.text())
        window.UVsphereProgram = compileAndLinkGLSL(vs,fs)
        let latitude = options["latitude"]
        let longitude = options["longitude"]
        let geom = createUVsphere(latitude, longitude)
        geom = addNormals(geom)
        window.geom = setupGeomery(geom)
        window.addEventListener('resize', fillScreen)
        requestAnimationFrame(timeStepSphere)
    }
    else if (scene == "torus") {
        let vs = await fetch('UVsphere-vertex.glsl').then(res => res.text())
        let fs = await fetch('UVsphere-fragment.glsl').then(res => res.text())
        window.torusProgram = compileAndLinkGLSL(vs,fs)
        let r = options["res1"]
        let p = options["res2"]
        let or = options["r1"]
        let ir = options["r2"]
        let geom = createTorus(r, p, ir, or)
        geom = addNormals(geom)
        window.geom = setupGeomery(geom)
        window.addEventListener('resize', fillScreen)
        requestAnimationFrame(timeStepTorus)
    }
    else if (scene == "icosphere") {
        let vs = await fetch('icosphere-vertex.glsl').then(res => res.text())
        let fs = await fetch('icosphere-fragment.glsl').then(res => res.text())
        window.icosphereProgram = compileAndLinkGLSL(vs,fs)
        let n = options["n"]
        let geom = createIcosphere(n)
        geom = addNormals(geom)
        window.geom = setupGeomery(geom)
        window.addEventListener('resize', fillScreen)
        requestAnimationFrame(timeStepIcosphere)
    }
}

window.addEventListener('load', setup)
window.addEventListener('resize', fillScreen)