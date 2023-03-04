#version 300 es

in vec4 position;
in vec4 color;

uniform float seconds;
uniform mat4 m;
uniform bool gpuFlag;

out vec4 vColor;

void main() {
    vColor = color;
    if (gpuFlag) {
        if (position.y > float(0)) {    // movement for the upper logo
            gl_Position.x = position.x + 0.1*sin(seconds);
        } else {
            gl_Position.x = position.x - 0.1*sin(seconds);
        }
        gl_Position.yzw = position.yzw;
    }
    else {
        gl_Position = m * position;
    }
}

