#version 300 es
precision highp float;

in vec4 vColor;

uniform int fogFlag;
uniform vec3 fogColor;

out vec4 fcolor;

void main() {
    if (fogFlag==1) {
        fcolor = vec4(gl_FragCoord.w * vColor.rgb + (1.0-gl_FragCoord.w) * fogColor, 1.0);
    }
    else {
        fcolor = vColor;
    }
}
