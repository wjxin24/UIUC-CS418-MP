/**
 * Create the geometry of a icosphere
 * @param {int} n       number of subdivision level
 * @returns             geometry of icosphere
 */
function createIcosphere(n) {
    const phi = Math.pow(5,0.5)*0.5-0.5
    const radius = Math.sqrt(1+Math.pow(phi,2)) // distance from each vertex to the center
    position = [
        [1, phi, 0], [1, -phi, 0], [-1, -phi, 0], [-1, phi, 0], 
        [0, 1, phi], [0, 1, -phi], [0, -1, -phi], [0, -1, phi],
        [phi, 0, 1], [phi, 0, -1], [-phi, 0, -1], [-phi, 0, 1], 
    ]
    triangles = [
        [1, 0, 8], [0, 1, 9], [0, 4, 8], [0, 5, 4], [0, 9, 5],
        [1, 8, 7], [1, 7, 6], [1, 6, 9], [2, 6, 7], [2, 7, 11],
        [2, 10, 6], [2, 3, 10], [2, 11, 3], [3, 11, 4], [3, 4, 5],
        [3, 5, 10], [5, 9, 10], [4, 11, 8], [5, 11, 8], [7, 8, 11]
    ]
    
    for (let iter = 0; iter < n; iter++) {
        new_triangles = []
        for (let i=0; i<triangles.length; i+=1) {
            let tri = triangles[i]
            let p0 = position[tri[0]]
            let p1 = position[tri[1]]
            let p2 = position[tri[2]]
            // mid points on each edge
            let m0 = div(add(p1,p2),2)
            let m1 = div(add(p0,p2),2)
            let m2 = div(add(p0,p1),2)
            // move the mid points away from center
            let d0 = Math.sqrt(Math.pow(m0[0],2)+Math.pow(m0[1],2)+Math.pow(m0[2],2))
            let d1 = Math.sqrt(Math.pow(m1[0],2)+Math.pow(m1[1],2)+Math.pow(m1[2],2))
            let d2 = Math.sqrt(Math.pow(m2[0],2)+Math.pow(m2[1],2)+Math.pow(m2[2],2))
            m0 = mul(m0, radius/d0)
            m1 = mul(m1, radius/d1)
            m2 = mul(m2, radius/d2)
            position.push(...[m0, m1, m2])
            // index of the mid points
            let i0 = position.length-3
            let i1 = position.length-2
            let i2 = position.length-1
            new_triangles.push(...[[i0, i1, i2],[tri[0], i2, i1], [tri[1], i0, i2], [tri[2], i1, i0]])
        }
        triangles = new_triangles
    }
    attributes = {
        position: position
    }
    icosphere = {
        attributes: attributes,
        triangles: triangles
    }
    // console.log(icosphere)
    return icosphere
}

/**
 * Draw one torus
 */
function drawIcosphere() {
    cancelAnimationFrame(window.pending)
    gl.clearColor(...IlliniBlue) // f(...[1,2,3]) means f(1,2,3)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    gl.useProgram(window.icosphereProgram)

    gl.bindVertexArray(window.geom.vao)

    let lightdir = normalize([1,1,1])
    gl.uniform3fv(gl.getUniformLocation(icosphereProgram, 'lightdir'), lightdir)
    gl.uniform4fv(gl.getUniformLocation(icosphereProgram, 'color'), IlliniOrange)
    
    gl.uniformMatrix4fv(gl.getUniformLocation(icosphereProgram, 'mv'), false, m4mul(window.v,window.m))
    gl.uniformMatrix4fv(gl.getUniformLocation(icosphereProgram, 'p'), false, window.p)
    gl.drawElements(geom.mode, geom.count, geom.type, 0)

}

/** Compute any time-varying or animated aspects of the torus scene */
function timeStepIcosphere(milliseconds) {
    let seconds = milliseconds / 1000;

    window.m = m4rotZ(seconds)
    window.v = m4view([0,-2 , 1.5], [0,0,0], [0,1,0])
    
    drawIcosphere()
    requestAnimationFrame(timeStepIcosphere)
}