#version 300 es
precision highp float;

in vec3 fnormal;
in vec4 fposition;
in float init_norm_z;

uniform vec3 lightdir;
uniform vec3 lightcolor;
uniform vec3 halfway;
uniform float zmax;
uniform float zmin;

out vec4 fragColor;

vec3 rainbowColor(float z) {
  float h = fposition.z+0.5;    // fposition.z is between -0.5 and 0.5 after vertical separation control
  vec3 color;
  if (h < 0.2) {
    color = vec3(h * 5.0, 0.0, 0.0); // Black to Red 
  } else if (h < 0.4) {
    color = vec3(1.0, (h - 0.2) * 5.0, 0.0); // Red to Yellow
  } else if (h < 0.6) {
    color = vec3(1.0 - (h - 0.4) * 5.0, 1.0, 0.0); // Yellow to Green
  } else if (h < 0.8) {
    color = vec3(0.0, 1.0, (h - 0.6) * 5.0); // Green to Cyan
  } else {
    color = vec3(0.0, 1.0 - (h - 0.8) * 5.0, 1.0); // Cyan to Blue
  }
  return color;
}


void main() {
    vec3 n = normalize(fnormal);
    vec3 color;
    float lambert = max(dot(lightdir, n), 0.0);
    float blinn = pow(max(dot(halfway, n), 0.0), 150.0);
    float blinnBrightness = 5.0;
    if (init_norm_z < 0.5 && init_norm_z > -0.5) {    // cliff
        blinn = pow(max(dot(halfway, n), 0.0), 5.0);
        blinnBrightness = 0.3;
        color = vec3(0.5,0.5,0.5);
    }
    else {
        color = rainbowColor(fposition.z);
    }
    fragColor = vec4(color * lambert + (lightcolor*blinn)*blinnBrightness, 1.0);
}
