const IlliniBlue = new Float32Array([0.075, 0.16, 0.292, 1])
const IlliniOrange = new Float32Array([1, 0.373, 0.02, 1])
const IdentityMatrix = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1])

window.OBJFLAG = 0  // object flag: 0: no object, 1: v only
window.FOGFLAG = 0

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

function setupGeomery(geom,program) {
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
    console.log("triangleArray")

    
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

    let bindPoint = gl.getUniformLocation(program, 'aTextureIPlanToUse')
    gl.uniform1i(bindPoint, 0) // where `slot` is same it was in step 2 above

    let lightdir = normalize([1,1,1])
    gl.uniform3fv(gl.getUniformLocation(program, 'lightdir'), lightdir)

    let fogBind = gl.getUniformLocation(program, 'fogFlag')
    if (FOGFLAG) {
        gl.uniform1i(fogBind, 1)
        let fogColor = [0.7,0.7,0.7]
        gl.uniform3fv(gl.getUniformLocation(program, 'fogColor'), fogColor)
    } else {
        gl.uniform1i(fogBind, 0)
    }
    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'mv'), false, m4mul(v,m))
    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'p'), false, p)
    gl.drawElements(geom.mode, geom.count, geom.type, 0)

    if (OBJFLAG > 0) {
        gl.useProgram(window.objprogram)
        gl.bindVertexArray(window.objgeom.vao)
        objm = m4trans(0,0,getZ(0,0)-window.groundCamHeight-window.obj_min_z)
        gl.uniformMatrix4fv(gl.getUniformLocation(window.objprogram, 'mv'), false, m4mul(v,objm))
        gl.uniformMatrix4fv(gl.getUniformLocation(window.objprogram, 'p'), false, p)
        let fogBind = gl.getUniformLocation(objprogram, 'fogFlag')
        if (FOGFLAG) {
            gl.uniform1i(fogBind, 1)
            let fogColor = [0.7,0.7,0.7]
            gl.uniform3fv(gl.getUniformLocation(objprogram, 'fogColor'), fogColor)
        } else {
            gl.uniform1i(fogBind, 0)
        }
        gl.drawElements(objgeom.mode, objgeom.count, objgeom.type, 0)
    }
}

/** Compute any time-varying or animated aspects of the scene */
function timeStep(milliseconds) {
    let seconds = milliseconds / 1000;
    let speed = 0.005;
    let groundspeed = 0.0005;


    if (keysBeingPressed['W'] || keysBeingPressed['w']) {    // move the camera forward
        console.log("pressing W")
        if (FLIGHT==1) {
            window.eye = add(eye, mul(window.forward,speed))
        }
        if (FLIGHT==0) {
            window.eye = add(eye, mul(window.forward,groundspeed))
            if (eye[0]<-1 || eye[0]>1 || eye[1]<-1 || eye[1]>1) {
                console.log("back to flight mode")
                FLIGHT = 1
                window.eye = [0,-5 ,1]
                window.forward = normalize(sub(window.center,eye))
            }
            else {
                eye[2] = getZ(eye[0],eye[1])
            }
        }
        window.v = m4view2(eye, forward, up)
    }
    if (keysBeingPressed['S'] || keysBeingPressed['s']) {    // move the camera backward
        console.log("pressing S")
        if (FLIGHT==1) {
            window.eye = sub(eye, mul(window.forward,speed))
        }
        
        if (FLIGHT==0) {
            window.eye = sub(eye, mul(window.forward,groundspeed))
            if (eye[0]<-1 || eye[0]>1 || eye[1]<-1 || eye[1]>1) {
                console.log("back to flight mode")
                FLIGHT = 1
                window.eye = [0,-5 ,1]
                window.forward = normalize(sub(window.center,eye))
            }
            else {
                eye[2] = getZ(eye[0],eye[1])
            }
        }
        window.v = m4view2(eye, forward, up)
    }
    if (keysBeingPressed['A'] || keysBeingPressed['a']) {    // move the camera to its left (move, not turn)
        console.log("pressing A")
        right = normalize(cross(window.forward, up))
        if (FLIGHT==1) {
            window.eye = sub(eye, mul(right,speed))
        }
        
        if (FLIGHT==0) {
            window.eye = sub(eye, mul(right, groundspeed))
            if (eye[0]<-1 || eye[0]>1 || eye[1]<-1 || eye[1]>1) {
                console.log("back to flight mode")
                FLIGHT = 1
                window.eye = [0,-5 ,1]
                window.forward = normalize(sub(window.center,eye))
            }
            else {
                eye[2] = getZ(eye[0],eye[1])
            }
        }
        window.v = m4view2(eye, forward, up)
    }
    if (keysBeingPressed['D'] || keysBeingPressed['d']) {    // move the camera to its right (move, not turn)
        console.log("pressing D")
        right = normalize(cross(window.forward, up))
        if (FLIGHT==1) {
            window.eye = add(eye, mul(right,speed))
        }
        
        if (FLIGHT==0) {
            window.eye = add(eye, mul(right, groundspeed))
            if (eye[0]<-1 || eye[0]>1 || eye[1]<-1 || eye[1]>1) {
                console.log("back to flight mode")
                FLIGHT = 1
                window.eye = [0,-5 ,1]
                window.forward = normalize(sub(window.center,eye))
            }
            else {
                eye[2] = getZ(eye[0],eye[1])
            }
        }
        window.v = m4view2(eye, forward, up)
    }

    // camera rotation
    if (keysBeingPressed['ArrowUp']) {
        console.log("pressing ArrowUp")
        right = normalize(cross(window.forward, window.up))
        window.forward = m4mul(m4rotAxis(speed,...right),[...forward,0]).slice(0, 3)
        window.v = m4view2(window.eye, forward, up)
    }
    if (keysBeingPressed['ArrowDown']) { 
        console.log("pressing ArrowDown")
        right = normalize(cross(window.forward, window.up))
        window.forward = m4mul(m4rotAxis(-speed,...right),[...forward,0]).slice(0, 3)
        window.v = m4view2(window.eye, forward, up)
    }
    if (keysBeingPressed['ArrowLeft']) { 
        console.log("pressing ArrowLeft")
        window.forward = m4mul(m4rotZ(speed),[...forward,0]).slice(0, 3)
        window.v = m4view2(window.eye, forward, up)
    }
    if (keysBeingPressed['ArrowRight']) {
        console.log("pressing ArrowRight")
        window.forward = m4mul(m4rotZ(-speed),[...forward,0]).slice(0, 3)
        window.v = m4view2(window.eye, forward, up)
    }

    // flight or ground mode
    if (keysPressed['G'] || keysPressed['g']) { 
        console.log("press G")
        keysPressed['G'] = 0
        keysPressed['g'] = 0
        if (window.FLIGHT) {
            FLIGHT = 0
            x = Math.random()*2-1
            y = Math.random()*2-1
            z = getZ(x,y)
            window.m = IdentityMatrix
            window.eye = [x,y,z]
            window.forward = normalize([0,2,-1])
            window.v = m4view2(eye, forward, up)
        }
        else {
            FLIGHT = 1;
            window.m = m4scale(2,2,2)
            window.eye = [0,-5 ,1]
            window.forward = normalize(sub(window.center,eye))
            window.v = m4view(eye, forward, up)
        }
    }
    

    // fog mode
    if (keysPressed['F'] || keysPressed['f']) { 
        console.log("press F")
        keysPressed['F'] = 0
        keysPressed['f'] = 0
        if (FOGFLAG) {
            FOGFLAG = 0
        }
        else {
            FOGFLAG = 1;
        }
    }

    draw()
    requestAnimationFrame(timeStep)
}

function getZ(x, y) {
    n = window.gridsize
    gx = (1-y)*(n-1)/2
    gy = (x+1)*(n-1)/2

    offset_x = gx-Math.floor(gx)
    offset_y = gy-Math.floor(gy)
    avg_z = (1-offset_x)*(1-offset_y)*window.geometry.attributes.position[Math.floor(gx)*n+Math.floor(gy)][2] + 
            offset_x*(1-offset_y)*window.geometry.attributes.position[(Math.floor(gx)+1)*n+Math.floor(gy)][2] + 
            (1-offset_x)*offset_y*window.geometry.attributes.position[Math.floor(gx)*n+Math.floor(gy)+1][2] + 
            offset_x*offset_y*window.geometry.attributes.position[(Math.floor(gx)+1)*n+Math.floor(gy)+1][2]
   
    return avg_z + window.groundCamHeight
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
        window.p = m4perspNegZ(0.001, 10, 1, canvas.width, canvas.height)
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
    aTexCoord = []
    for (let x = 0; x < n; x++) {
        for (let y = 0; y < n; y++) {
            position.push([-1+y*2/(n-1), 1-x*2/(n-1), 0])
            aTexCoord.push([y/(n-1),x/(n-1)])
            if (x != n-1 && y != n-1) {
                let i = x*n + y
                triangles.push([i, i+n, i+1])
                triangles.push([i+1, i+n, i+n+1])
            }
        }
    }
    attributes = {
        position: position,
        aTexCoord: aTexCoord
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

    await objSetup()

    // set up terrain scene
    window.gridsize = 100
    let fractures = 100
    window.geometry = createGrid(gridsize)
    geometry = faultPlane(geometry, gridsize, fractures)
    geometry = addNormals(geometry)
    window.geom = setupGeomery(geometry,program)
    loadTexture("farm.jpg")
    window.addEventListener('resize', fillScreen)
    window.keysBeingPressed = {}
    window.addEventListener('keydown', event => keysBeingPressed[event.key] = true)
    window.addEventListener('keyup', event => keysBeingPressed[event.key] = false)

    window.FLIGHT = 1 // default flight mode
    
    window.keysPressed = {}
    window.addEventListener('keydown', event => keysPressed[event.key] = true)

    // initial setup for view matrix
    window.m = m4scale(2,2,2)
    window.eye = [0,-5,1]
    window.center = [0,0,0]
    window.forward = normalize(sub(center, eye))
    window.up = [0,0,1]
    window.v = m4view2(eye, forward, up)
    window.groundCamHeight = 2/gridsize * 2

    requestAnimationFrame(timeStep)
}

async function objSetup(event){
    let objFile = 'example.obj'
    if (window.location.hash.substr(1)) {
        objFile = window.location.hash.substr(1)
        console.log('window.location.hash.substr(1) is defined:', window.location.hash.substr(1));
    }
    response = await fetch(objFile)
    if (response.ok) {
        objString = await response.text()
        window.OBJFLAG = 1
    } else {
        response = await fetch('example.obj')
        if (response.ok) {
            objString = await response.text()
            window.OBJFLAG = 1
        }
        else {
        console.log("Obj not found")
        window.OBJFLAG = 0
        }
    }

    if (window.OBJFLAG > 0) {
        window.objgeometry = parseOBJ(objString)
        console.log(objgeometry)
        

        let vs2 = await fetch('vertex'+OBJFLAG+'.glsl').then(res => res.text())
        let fs2 = await fetch('fragment'+OBJFLAG+'.glsl').then(res => res.text())
        window.objprogram = compileAndLinkGLSL(vs2,fs2)

        window.objgeom = setupGeomery(objgeometry,objprogram)
        console.log(objgeom)

    }
}


function loadTexture(urlOfImageAsString) {
    let img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = urlOfImageAsString;
    img.addEventListener('load', (event) => {
        let slot = 0; // or a larger integer if this isn't the only texture
        let texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + slot);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    
        gl.texImage2D(
            gl.TEXTURE_2D, // destination slot
            0, // the mipmap level this data provides; almost always 0
            gl.RGBA, // how to store it in graphics memory
            gl.RGBA, // how it is stored in the image object
            gl.UNSIGNED_BYTE, // size of a single pixel-color in HTML
            img, // source data
        );
        gl.generateMipmap(gl.TEXTURE_2D) // lets you use a mipmapping min filter
    })
}

function parseOBJ(objString) {
    OBJFLAG = 1
    const lines = objString.split('\n')
    vertices = []
    color = []
    normals = []
    aTexCoord = []
    indices = []
    triangles = []
    
    window.obj_min_z = 999 // lowest point of the object

    for (let i = 0; i < lines.length; i++) {
      line = lines[i].trim()
      if (line == '' || line.startsWith('#')) {
        continue
      }
  
      parts = line.split(/\s+/)
      type = parts[0]
    //   console.log(parts)
      switch (type) {
        case 'v':
            vertices.push(
                [Number(parts[1]), // x
                Number(parts[2]), // y
                Number(parts[3])] // z
            )
            obj_min_z = Math.min(obj_min_z,Number(parts[3]))
            if (parts.length==7) {
                OBJFLAG = 2
                color.push(
                    [Number(parts[4]), // x
                    Number(parts[5]), // y
                    Number(parts[6])] // z
                )
            }
            break
        case 'vn':
          normals.push(
            [Number(parts[1]), // x
            Number(parts[2]), // y
            Number(parts[3])] // z
          )
        case 'vt':
          aTexCoord.push(
            [Number(parts[1]), // u
            Number(parts[2])] // v
          )
        case 'f':
            if (parts.length - 1 < 3) {
                console.error('Invalid face: ' + line)
                continue
            }
            for (let j = 2; j < parts.length; j+=2) {
                triangles.push([Number(parts[1]),Number(parts[j]),Number(parts[j+1])])
            }
      }
    }
    console.log(OBJFLAG)
    switch (OBJFLAG) {
        case 1:
            attributes = {
                position: vertices
            }
            break
        case 2:
            attributes = {
                position: vertices,
                color: color
                // aTexCoord: aTexCoord,
                // normal: normals
                // indices: indices
            }
            break
    }
    console.log(attributes)
    return {
        attributes: attributes,
        triangles: triangles
    }
}


window.addEventListener('load', setup)
window.addEventListener('resize', fillScreen)