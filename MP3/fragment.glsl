#version 300 es
precision highp float;

in vec3 fnormal;

uniform vec4 color;
uniform vec3 lightdir;

out vec4 fragColor;

void main() {
    float lambert = max(dot(lightdir, fnormal), 0.0);
    fragColor = vec4(color.rgb * lambert *2.0, color.a);
}
