#version 300 es
precision highp float;

in vec3 fnormal;

uniform vec4 color;
uniform vec3 lightdir;

out vec4 fragColor;

void main() {
    vec3 n = normalize(fnormal);
    float lambert = max(dot(lightdir, n), 0.0);
    fragColor = vec4(
        color.rgb *  lambert,
        color.a);
}
