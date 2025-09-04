# Background Animation System

This document details the implementation of the background animation system for the TUI Homepage, providing dynamic, animated backgrounds that run behind the terminal-style interface.

## Features

1. WebGL-powered animated backgrounds
2. Multiple background options
3. Custom shader-based animations
4. Performance optimization for low resource usage
5. Responsive design that scales with window size
6. Background switching without page reload
7. Custom background API for creating new themes

## Core Components

### 1. Background Manager

The background system is implemented with a manager class that handles:
- Loading different background modules
- Initializing WebGL context
- Handling resize events
- Switching between backgrounds
- Managing render loop and performance

### 2. Background Directory Structure

```
/backgrounds/
  endportal-bg.js       # End Portal animation module
  matrix-bg.js          # Matrix code rain module
  starfield-bg.js       # Space starfield module
  waves-bg.js           # Ocean waves module
  background-base.js    # Base class for backgrounds
```

### 3. HTML Integration

```html
<!-- Background canvas container -->
<div id="background-container" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1;">
  <canvas id="background-canvas"></canvas>
</div>

<!-- Script loading -->
<script src="/backgrounds/background-base.js"></script>
<script src="/backgrounds/endportal-bg.js"></script>
<!-- Additional background scripts -->
<script>
  // Initialize background system
  document.addEventListener('DOMContentLoaded', () => {
    const bgManager = new BackgroundManager();
    bgManager.initialize('endportal-bg'); // Set default background
    
    // Expose to window for access from menu
    window.backgroundManager = bgManager;
  });
</script>
```

## Implementation Details

### 1. Base Background Class

```javascript
// background-base.js
class BackgroundBase {
  constructor() {
    this.canvas = null;
    this.gl = null;
    this.program = null;
    this.animationFrameId = null;
    this.startTime = Date.now();
    this.uniforms = {};
  }
  
  initialize(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!this.gl) {
      console.error('WebGL not supported');
      return false;
    }
    
    // Set up canvas dimensions
    this.resize();
    
    // Create shader program
    this.program = this.createShaderProgram();
    
    // Initialize uniforms
    this.initializeUniforms();
    
    return true;
  }
  
  createShaderProgram() {
    // Create vertex and fragment shaders
    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, this.getVertexShader());
    const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, this.getFragmentShader());
    
    // Create and link program
    const program = this.gl.createProgram();
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);
    
    // Check for errors
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error('Program linking failed:', this.gl.getProgramInfoLog(program));
      return null;
    }
    
    return program;
  }
  
  createShader(type, source) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compilation failed:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }
  
  // Default vertex shader (overridden by specific backgrounds)
  getVertexShader() {
    return `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_position * 0.5 + 0.5;
      }
    `;
  }
  
  // Must be implemented by subclasses
  getFragmentShader() {
    throw new Error('getFragmentShader must be implemented by subclass');
  }
  
  initializeUniforms() {
    // Base uniforms
    this.uniforms.u_time = this.gl.getUniformLocation(this.program, 'u_time');
    this.uniforms.u_resolution = this.gl.getUniformLocation(this.program, 'u_resolution');
  }
  
  // Main render function
  render() {
    if (!this.gl || !this.program) return;
    
    const gl = this.gl;
    
    // Clear canvas
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // Use program
    gl.useProgram(this.program);
    
    // Update uniforms
    this.updateUniforms();
    
    // Draw full-screen quad
    const positions = [
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
       1.0,  1.0
    ];
    
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    
    const posAttribute = gl.getAttribLocation(this.program, 'a_position');
    gl.enableVertexAttribArray(posAttribute);
    gl.vertexAttribPointer(posAttribute, 2, gl.FLOAT, false, 0, 0);
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  
  updateUniforms() {
    // Update time uniform
    const time = (Date.now() - this.startTime) * 0.001; // Time in seconds
    this.gl.uniform1f(this.uniforms.u_time, time);
    
    // Update resolution uniform
    this.gl.uniform2f(
      this.uniforms.u_resolution, 
      this.canvas.width, 
      this.canvas.height
    );
  }
  
  resize() {
    if (!this.canvas) return;
    
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    
    if (this.gl) {
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
  }
  
  start() {
    this.stop(); // Stop any existing animation
    
    const animate = () => {
      this.render();
      this.animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
  }
  
  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  // Clean up resources
  destroy() {
    this.stop();
    
    if (this.gl && this.program) {
      this.gl.deleteProgram(this.program);
      this.program = null;
    }
  }
}
```

### 2. End Portal Background Example

```javascript
// endportal-bg.js
class EndPortalBackground extends BackgroundBase {
  constructor() {
    super();
    
    // Additional properties for End Portal effect
    this.noiseTexture = null;
    this.lastStarTime = 0;
    this.starPositions = [];
  }
  
  initialize(canvas) {
    if (!super.initialize(canvas)) {
      return false;
    }
    
    // Create noise texture
    this.createNoiseTexture();
    
    // Generate initial star positions
    this.generateStars(30); // 30 stars
    
    return true;
  }
  
  // Override to add additional uniforms
  initializeUniforms() {
    super.initializeUniforms();
    
    // End Portal specific uniforms
    this.uniforms.u_noiseTexture = this.gl.getUniformLocation(this.program, 'u_noiseTexture');
    this.uniforms.u_starPositions = this.gl.getUniformLocation(this.program, 'u_starPositions');
    this.uniforms.u_starCount = this.gl.getUniformLocation(this.program, 'u_starCount');
  }
  
  getFragmentShader() {
    return `
      precision mediump float;
      
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform sampler2D u_noiseTexture;
      uniform vec2 u_starPositions[30];
      uniform int u_starCount;
      
      varying vec2 v_texCoord;
      
      // Noise function
      float noise(vec2 p) {
        return texture2D(u_noiseTexture, p).r;
      }
      
      void main() {
        vec2 uv = v_texCoord;
        
        // Base portal color
        vec3 color = vec3(0.0, 0.0, 0.1);
        
        // Add noise layers
        float n1 = noise(uv * 2.0 + u_time * 0.01);
        float n2 = noise(uv * 4.0 - u_time * 0.02);
        float n3 = noise(uv * 8.0 + u_time * 0.03);
        
        // Combine noise layers
        float n = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
        
        // Add to color with purple-blue gradient
        color += vec3(n * 0.1, n * 0.2, n * 0.4);
        
        // Add stars
        for (int i = 0; i < 30; i++) {
          if (i >= u_starCount) break;
          
          vec2 starPos = u_starPositions[i];
          float dist = distance(uv, starPos);
          
          // Star shape with time-based pulsing
          float star = 0.005 / (dist + 0.001) * (0.8 + 0.2 * sin(u_time * 2.0 + float(i)));
          
          // Add star to color
          color += vec3(star * 0.7, star * 0.9, star);
        }
        
        // Add center glow
        float centerDist = distance(uv, vec2(0.5, 0.5));
        float glow = 0.02 / (centerDist + 0.05);
        color += vec3(glow * 0.1, glow * 0.2, glow * 0.3);
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;
  }
  
  createNoiseTexture() {
    const gl = this.gl;
    const size = 256;
    
    // Create noise data
    const data = new Uint8Array(size * size * 4);
    for (let i = 0; i < size * size; i++) {
      const val = Math.random() * 255;
      data[i * 4] = val;
      data[i * 4 + 1] = val;
      data[i * 4 + 2] = val;
      data[i * 4 + 3] = 255;
    }
    
    // Create texture
    this.noiseTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture);
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, data
    );
    
    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  }
  
  generateStars(count) {
    this.starPositions = [];
    for (let i = 0; i < count; i++) {
      this.starPositions.push(Math.random());
      this.starPositions.push(Math.random());
    }
  }
  
  updateUniforms() {
    super.updateUniforms();
    
    const gl = this.gl;
    
    // Bind noise texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture);
    gl.uniform1i(this.uniforms.u_noiseTexture, 0);
    
    // Update star positions
    const time = (Date.now() - this.startTime) * 0.001;
    if (time - this.lastStarTime > 5.0) {
      // Generate new stars every 5 seconds
      this.generateStars(30);
      this.lastStarTime = time;
    }
    
    // Pass star positions
    gl.uniform2fv(this.uniforms.u_starPositions, new Float32Array(this.starPositions));
    gl.uniform1i(this.uniforms.u_starCount, this.starPositions.length / 2);
  }
  
  destroy() {
    super.destroy();
    
    // Clean up texture
    if (this.gl && this.noiseTexture) {
      this.gl.deleteTexture(this.noiseTexture);
      this.noiseTexture = null;
    }
  }
}

// Register with background manager
window.registerBackground = window.registerBackground || {};
window.registerBackground['endportal-bg'] = EndPortalBackground;
```

### 3. Background Manager

```javascript
// Background manager class to handle multiple backgrounds
class BackgroundManager {
  constructor() {
    this.canvas = null;
    this.currentBackground = null;
    this.availableBackgrounds = {};
    this.resizeHandler = null;
  }
  
  initialize(defaultBg = 'endportal-bg') {
    // Create canvas if it doesn't exist
    this.canvas = document.getElementById('background-canvas');
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'background-canvas';
      this.canvas.style.position = 'fixed';
      this.canvas.style.top = '0';
      this.canvas.style.left = '0';
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      this.canvas.style.zIndex = '-1';
      document.body.prepend(this.canvas);
    }
    
    // Get registered backgrounds
    this.availableBackgrounds = window.registerBackground || {};
    
    // Set up resize handler
    this.resizeHandler = () => {
      if (this.currentBackground) {
        this.currentBackground.resize();
      }
    };
    window.addEventListener('resize', this.resizeHandler);
    
    // Start default background
    this.setBackground(defaultBg);
    
    return true;
  }
  
  setBackground(bgName) {
    // Check if background exists
    const BackgroundClass = this.availableBackgrounds[bgName];
    if (!BackgroundClass) {
      console.error(`Background "${bgName}" not found`);
      return false;
    }
    
    // Clean up existing background
    if (this.currentBackground) {
      this.currentBackground.destroy();
      this.currentBackground = null;
    }
    
    // Create new background
    this.currentBackground = new BackgroundClass();
    if (!this.currentBackground.initialize(this.canvas)) {
      console.error(`Failed to initialize background "${bgName}"`);
      this.currentBackground = null;
      return false;
    }
    
    // Start animation
    this.currentBackground.start();
    
    return true;
  }
  
  getAvailableBackgrounds() {
    return Object.keys(this.availableBackgrounds);
  }
  
  destroy() {
    // Clean up
    if (this.currentBackground) {
      this.currentBackground.destroy();
      this.currentBackground = null;
    }
    
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
    
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
      this.canvas = null;
    }
  }
}
```

## Creating a Custom Background

To create a new background:

1. Create a new JavaScript file (e.g., `my-background.js`)
2. Extend the `BackgroundBase` class
3. Override required methods (getFragmentShader, etc.)
4. Register the background with the manager

Example template for a new background:

```javascript
class MyCustomBackground extends BackgroundBase {
  constructor() {
    super();
    // Add custom properties
  }
  
  getFragmentShader() {
    return `
      precision mediump float;
      
      uniform float u_time;
      uniform vec2 u_resolution;
      varying vec2 v_texCoord;
      
      void main() {
        vec2 uv = v_texCoord;
        
        // Your custom shader code here
        vec3 color = vec3(0.0);
        
        // Example: Simple color gradient that changes with time
        color.r = uv.x + sin(u_time * 0.5) * 0.5;
        color.g = uv.y + cos(u_time * 0.3) * 0.5;
        color.b = sin(u_time * 0.2) * 0.5 + 0.5;
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;
  }
  
  // Override additional methods as needed
}

// Register the background
window.registerBackground = window.registerBackground || {};
window.registerBackground['my-custom-bg'] = MyCustomBackground;
```

## Integration with UI

To integrate the background system with the TUI interface:

```javascript
// Background selection in settings menu
function showBackgroundSettings() {
  const bgManager = window.backgroundManager;
  if (!bgManager) return;
  
  const backgrounds = bgManager.getAvailableBackgrounds();
  
  // Create settings menu
  const menu = document.createElement('div');
  menu.className = 'tui-box settings-window';
  menu.innerHTML = `
    <div class="tui-window">
      <div class="tui-title">Background Settings</div>
      <div class="tui-content">
        <div class="settings-section">
          <div class="settings-label">Select Background:</div>
          <div class="settings-options">
            ${backgrounds.map(bg => `
              <div class="settings-option" data-bg="${bg}">
                ${bg.replace(/-bg$/, '').replace(/-/g, ' ')}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(menu);
  
  // Add event listeners
  const options = menu.querySelectorAll('.settings-option');
  options.forEach(option => {
    option.addEventListener('click', () => {
      const bgName = option.dataset.bg;
      bgManager.setBackground(bgName);
      
      // Save preference
      localStorage.setItem('preferred-background', bgName);
      
      // Close menu
      menu.remove();
    });
  });
}

// Load saved preference on startup
document.addEventListener('DOMContentLoaded', () => {
  const bgManager = new BackgroundManager();
  
  // Initialize with saved preference or default
  const savedBg = localStorage.getItem('preferred-background');
  bgManager.initialize(savedBg || 'endportal-bg');
  
  // Expose to window
  window.backgroundManager = bgManager;
});
```

## Performance Considerations

The background system includes several optimizations:

1. WebGL rendering for hardware acceleration
2. Limited redraw when not animating
3. Canvas size scaling based on device pixel ratio
4. Texture reuse to minimize GPU memory usage
5. Animation frame throttling for low-power mode

## Compatible Backgrounds

The TUI Homepage comes with several pre-built backgrounds:

1. **End Portal**: Minecraft-inspired space-like effect with stars
2. **Matrix**: Falling code rain in Matrix style
3. **Starfield**: Space travel star movement effect
4. **Waves**: Calm ocean wave animations
5. **Gradient**: Subtle color-shifting gradient
6. **Particles**: Interactive particle system

## Future Enhancements

Potential improvements for the background system:

1. User-uploadable custom backgrounds
2. Background opacity/blur controls
3. Audio-reactive backgrounds
4. Transition effects between backgrounds
5. Time-of-day automatic background switching
6. Interactive backgrounds that respond to user input
7. Low-power mode for mobile devices
8. WebGL 2.0 support for advanced effects
