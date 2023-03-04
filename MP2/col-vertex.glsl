#version 300 es

in vec4 position;
in vec4 color;

uniform float seconds;
uniform mat4 m_up;
uniform mat4 m_down;
uniform bool gpuFlag;

out vec4 vColor;

void main() {
    vColor = color;
    if (position.y > 0.0) {
        gl_Position = m_up * position;
    } else {
        gl_Position = m_down * position;
    }
    
}

