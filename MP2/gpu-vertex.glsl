#version 300 es

in vec4 position;
in vec4 color;

uniform float seconds;

out vec4 vColor;

void main() {
    vColor = color;
    if (gl_VertexID < 6) {  // movement for the upper half of the logo
        gl_Position.x = position.x + 0.1*sin(seconds);
    } else {    // movement for the lower half of the logo
        gl_Position.x = position.x - 0.1*sin(seconds);
    }
    gl_Position.yzw = position.yzw;
}

