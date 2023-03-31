#version 300 es
precision highp float;

in vec3 fnormal;

uniform vec4 color;
uniform vec3 lightdir;
uniform vec3 lightcolor;
uniform vec3 halfway;

out vec4 fragColor;

void main() {
    vec3 n = normalize(fnormal);
    float lambert = max(dot(lightdir, n), 0.0);
    float blinn = pow(max(dot(halfway, n), 0.0), 150.0);
    fragColor = vec4(
        color.rgb * (lightcolor * lambert)
        + lightcolor*blinn *20.5,
        color.a);
}
