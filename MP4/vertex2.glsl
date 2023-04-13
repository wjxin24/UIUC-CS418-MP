#version 300 es

in vec4 position;
in vec4 color;

out vec4 vColor;

uniform mat4 p;
uniform mat4 mv;

void main() {
    gl_Position =  p * mv * position;
    vColor = color;
}
