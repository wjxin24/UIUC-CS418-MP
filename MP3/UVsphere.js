function createUVsphere(latitude, longitude) {
    position = []
    triangles = []
    position.push([0,0,1])  // upper polar
    for (let i = 1; i < latitude-1; i++) {
        for (let j = 0; j < longitude; j++) {
            let theta = Math.PI/(latitude-1) * i
            let phi = 2*Math.PI/longitude * j
            position.push([Math.sin(theta)*Math.cos(phi), Math.sin(theta)*Math.sin(phi), Math.cos(theta)])
            if (i == 1) {
                triangles.push([0, j+1, 1+(j+1)%longitude])
            }
            else {
                triangles.push([(i-2)*longitude+1+j, (i-1)*longitude+1+j, (i-1)*longitude+1+(j+1)%longitude])
                triangles.push([(i-2)*longitude+1+(j+1)%longitude, (i-2)*longitude+1+j, (i-1)*longitude+1+(j+1)%longitude])
            }
        }
    }
    position.push([0,0,-1])  // lower polar
    for (let j = 0; j < longitude; j++) {
        triangles.push([(latitude-2)*longitude+1, (latitude-3)*longitude+j+1, (latitude-3)*longitude+1+(j+1)%longitude])
    }
    attributes = {
        position: position
    }
    sphere = {
        attributes: attributes,
        triangles: triangles
    }
    return sphere
}

/**
 * Draw one UV-sphere
 */
function drawUVsphere() {
    cancelAnimationFrame(window.pending)
    gl.clearColor(...IlliniBlue) // f(...[1,2,3]) means f(1,2,3)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    gl.useProgram(window.UVsphereProgram)

    gl.bindVertexArray(window.geom.vao)

    let lightdir = normalize([1,1,1])
    let halfway = normalize(add(lightdir, [0,0,1]))
    gl.uniform3fv(gl.getUniformLocation(UVsphereProgram, 'lightdir'), lightdir)
    gl.uniform3fv(gl.getUniformLocation(UVsphereProgram, 'halfway'), halfway)
    gl.uniform3fv(gl.getUniformLocation(UVsphereProgram, 'lightcolor'), [1,1,1])
    gl.uniform4fv(gl.getUniformLocation(UVsphereProgram, 'color'), IlliniOrange)
    gl.uniformMatrix4fv(gl.getUniformLocation(UVsphereProgram, 'mv'), false, m4mul(window.v,window.m))
    gl.uniformMatrix4fv(gl.getUniformLocation(UVsphereProgram, 'p'), false, window.p)
    gl.drawElements(geom.mode, geom.count, geom.type, 0)

}

/** Compute any time-varying or animated aspects of the scene */
function timeStepSphere(milliseconds) {
    let seconds = milliseconds / 1000;

    window.m = m4mul(m4rotZ(seconds), m4scale(2,2,2))
    window.v = m4view([0,-5 ,0.1], [0,0,0], [0,1,0])
    
    drawUVsphere()
    requestAnimationFrame(timeStepSphere)
}