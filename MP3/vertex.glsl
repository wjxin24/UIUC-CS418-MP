#version 300 es

in vec4 position;
in vec3 normal;

out vec3 fnormal;
out vec4 fposition;

uniform mat4 p;
uniform mat4 mv;

void main() {
    fposition = position;

    gl_Position = p * mv * position;
    fnormal = mat3(mv) * normal;
}

