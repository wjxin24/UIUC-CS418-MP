#version 300 es
precision highp float;

in vec4 vColor;

uniform float seconds;

out vec4 fragColor;

void main() {
    vec2 uv = gl_FragCoord.xy / vec2(500.0, 500.0);
    fragColor = vec4(
        0.5 + 0.5 * sin(seconds + uv.x * 100.0 * (sin(seconds))),
        0.5 + 0.5 * sin(seconds + uv.y * 100.0 * (cos(seconds))),
        0.5 + 0.5 * cos(seconds * 5.0),
        vColor.a
    );
}
