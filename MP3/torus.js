/**
 * Create the geometry of a torus
 * @param {int} r       number of rings
 * @param {int} p       number of points per ring
 * @param {float} ir    minor radius
 * @param {float} or    major radius
 * @returns             geometry of torus
 */
function createTorus(r, p, ir, or) {
    let mr = (ir+or)/2  // radius from center to center of each ring
    let rr = (or-ir)/2  // radius of each ring
    position = []
    triangles = []
    
    for (let i = 0; i < p; i++) {
        let theta = 2*Math.PI/p*i
        let pr = mr+Math.cos(theta)*rr
        // let v = [mr+Math.cos(theta), 0, Math.sin(theta)]
        // let c = [mr*Math.cos(phi), mr*Math.sin(phi),0]
        for (let j = 0; j < r; j++) {
            let phi = 2*Math.PI/r * j
            position.push([pr*Math.cos(phi),pr*Math.sin(phi),Math.sin(theta)*rr])
            triangles.push([i*r+j, i*r+(1+j)%r, ((i+1)%p)*r+j])
            triangles.push([i*r+(1+j)%r, i*r+j, ((i-1+p)%p)*r+(1+j)%r])
        }
    }
    attributes = {
        position: position
    }
    torus = {
        attributes: attributes,
        triangles: triangles
    }
    return torus
}

/**
 * Draw one torus
 */
function drawTorus() {
    cancelAnimationFrame(window.pending)
    gl.clearColor(...IlliniBlue) // f(...[1,2,3]) means f(1,2,3)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    gl.useProgram(window.torusProgram)

    gl.bindVertexArray(window.geom.vao)

    let lightdir = normalize([1,1,1])
    let halfway = normalize(add(lightdir, [0,0,1]))
    gl.uniform3fv(gl.getUniformLocation(torusProgram, 'lightdir'), lightdir)
    gl.uniform3fv(gl.getUniformLocation(torusProgram, 'halfway'), halfway)
    gl.uniform3fv(gl.getUniformLocation(torusProgram, 'lightcolor'), [1,1,1])
    gl.uniform4fv(gl.getUniformLocation(torusProgram, 'color'), IlliniOrange)
    
    gl.uniformMatrix4fv(gl.getUniformLocation(torusProgram, 'mv'), false, m4mul(window.v,window.m))
    gl.uniformMatrix4fv(gl.getUniformLocation(torusProgram, 'p'), false, window.p)
    gl.drawElements(geom.mode, geom.count, geom.type, 0)

}

/** Compute any time-varying or animated aspects of the torus scene */
function timeStepTorus(milliseconds) {
    let seconds = milliseconds / 1000;

    window.m = m4rotZ(seconds)
    window.v = m4view([0,-2 , 1.5], [0,0,0], [0,1,0])
    
    drawTorus()
    requestAnimationFrame(timeStepTorus)
}