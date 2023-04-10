#version 300 es

in vec4 position;
in vec3 normal;
in vec2 aTexCoord;

out vec3 fnormal;
out vec2 vTexCoord;

uniform mat4 p;
uniform mat4 mv;

void main() {
    gl_Position = p * mv * position;
    fnormal = mat3(mv) * normal;
    vTexCoord = aTexCoord;
}
