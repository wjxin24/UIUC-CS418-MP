#version 300 es

in vec4 position;

uniform mat4 p;
uniform mat4 mv;

void main() {
    gl_Position =  p * mv * position;
}
