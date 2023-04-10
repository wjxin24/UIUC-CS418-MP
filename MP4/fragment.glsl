#version 300 es
precision highp float;

in vec3 fnormal;
in vec2 vTexCoord;

uniform vec3 lightdir;

uniform sampler2D aTextureIPlanToUse;

out vec4 fcolor;



void main() {
    vec4 texColor = texture(aTextureIPlanToUse, vTexCoord);
    vec3 n = normalize(fnormal);
    float lambert = max(dot(lightdir, n), 0.0);
    fcolor = vec4(texColor.rgb * lambert, texColor.a);
}
