#version 300 es

in vec4 position;
in vec3 normal;

out vec3 fnormal;
out vec4 fposition;
out float init_norm_z;

uniform mat4 p;
uniform mat4 mv;

void main() {
    fposition = position;
    init_norm_z = normal.z;
    gl_Position = p * mv * position;
    fnormal = mat3(mv) * normal;
    
}

