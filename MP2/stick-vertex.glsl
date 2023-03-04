#version 300 es

in vec4 position;
in vec4 color;

uniform float seconds;

out vec4 vColor;

void main() {
    if (mod(seconds, 2.0) < 1.0) {  // move left leg
        if (gl_VertexID == 8) {
            gl_Position.x = position.x+0.08*(floor(seconds/2.0)+seconds-floor(seconds));
        } 
        else if (gl_VertexID == 9) {
            gl_Position.x = position.x+0.08*floor(seconds/2.0);
        }
        else {
            gl_Position.x = position.x+0.04 *seconds;
        }
    }
    else {  // move right leg
        if (gl_VertexID == 9) {
            gl_Position.x = position.x+0.08*(floor(seconds/2.0)+seconds-floor(seconds));
        } 
        else if (gl_VertexID == 8) {
            gl_Position.x = position.x+0.08*ceil(seconds/2.0);
        }
        else {
            gl_Position.x = position.x+0.04*seconds;
        }
    }
    gl_Position.yzw = position.yzw;
    
    vColor = color;
}


