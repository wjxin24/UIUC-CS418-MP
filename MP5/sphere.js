class Sphere {
    constructor(radius, color, position, velocity, direction) {
      this.radius = radius; // radius
      this.color = color; // RGB color
      this.position = position; // XYZ position
      this.velocity = velocity; // Velocity vector
    }
    
    get radius() {
      return this._radius;
    }
  
    set radius(r) {
      this._radius = r;
    }

    get color() {
      return this._color;
    }
  
    set color(rgb) {
      this._color = rgb;
    }
  
    get position() {
      return this._position;
    }
  
    set position(pos) {
      this._position = pos;
    }
  
    get velocity() {
      return this._velocity;
    }
  
    set velocity(vel) {
      this._velocity = vel;
    }
  
  }
  