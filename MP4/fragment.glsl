#version 300 es
precision highp float;

in vec3 fnormal;
in vec2 vTexCoord;

uniform vec3 lightdir;

uniform int fogFlag;
uniform vec3 fogColor;

uniform sampler2D aTextureIPlanToUse;

out vec4 fcolor;



void main() {
    vec4 texColor = texture(aTextureIPlanToUse, vTexCoord);
    
    vec3 n = normalize(fnormal);
    float lambert = max(dot(lightdir, n), 0.0);
    if (fogFlag==1) {
        fcolor = vec4(min(gl_FragCoord.w,1.0) * texColor.rgb * lambert + (1.0-min(gl_FragCoord.w,1.0)) * fogColor, texColor.a);
    }
    else {
        fcolor = vec4(texColor.rgb * lambert, texColor.a);
    }
}
