#version 300 es
precision highp float;

uniform int fogFlag;
uniform vec3 fogColor;

out vec4 fcolor;

void main() {
    if (fogFlag==1) {
        fcolor = vec4(gl_FragCoord.w * (0.2,0.5,0.8) + (1.0-gl_FragCoord.w) * fogColor, 1.0);
    }
    else {
        fcolor = vec4(0.2,0.5,0.8, 1.0);
    }

}
