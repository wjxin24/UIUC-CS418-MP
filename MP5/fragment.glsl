#version 300 es
precision highp float;
uniform vec3 color;
uniform vec3 lightdir;
out vec4 fragColor;
in vec3 fnormal;
void main() {
    float lambert = dot(lightdir, fnormal);
    fragColor = vec4(color.rgb * lambert * 0.1, 1.0);
}