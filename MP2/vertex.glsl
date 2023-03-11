#version 300 es

in vec4 position;
in vec4 color;

uniform float seconds;
uniform mat4 m;


out vec4 vColor;

void main() {
    vColor = color;

    gl_Position = m * position;
    
}

