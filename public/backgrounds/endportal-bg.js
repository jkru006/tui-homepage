
// ASCII Minecraft End Portal screensaver
document.addEventListener('DOMContentLoaded', function() {

    // Ensure particle count is always defined
    window.ENDPORTAL_PARTICLE_COUNT = typeof window.ENDPORTAL_PARTICLE_COUNT === 'number' && window.ENDPORTAL_PARTICLE_COUNT > 0 ? window.ENDPORTAL_PARTICLE_COUNT : 64;
    let canvas = document.getElementById('canvas');
    if (!canvas) {
        console.warn('[EndPortalBG] No #canvas found, creating one.');
        canvas = document.createElement('canvas');
        canvas.id = 'canvas';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.zIndex = '-1000';
        canvas.style.pointerEvents = 'none';
        canvas.style.display = 'block';
        document.body.insertBefore(canvas, document.body.firstChild);
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('[EndPortalBG] Could not get 2D context for canvas!');
        return;
    }
    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;
    console.log('[EndPortalBG] Script loaded, canvas found, context OK.');

window.addEventListener('resize', () => {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;
});

// Settings for end portal effect (1-100 scale)
let ENDPORTAL_SETTINGS = {
    particle_speed: 50,
    particle_size: 30,
    particle_brightness: 80,
    colored_particles: true,
    particle_glow: 80,
    particle_count: 48, // reduce for performance
    particle_size: 18, // slightly smaller
};

// Try to load from cookies
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

function safeNum(val, def) {
    val = Number(val);
    return isNaN(val) ? def : def;
}
let cookieData = getCookie('endportal_settings');
if (cookieData) {
    try {
        const data = JSON.parse(cookieData);
        ENDPORTAL_SETTINGS.particle_speed = safeNum(data.particle_speed, 50);
        ENDPORTAL_SETTINGS.particle_size = safeNum(data.particle_size, 30);
        ENDPORTAL_SETTINGS.particle_brightness = safeNum(data.particle_brightness, 80);
        ENDPORTAL_SETTINGS.colored_particles = (typeof data.colored_particles === 'boolean') ? data.colored_particles : true;
        ENDPORTAL_SETTINGS.particle_glow = typeof data.particle_glow === 'number' ? data.particle_glow : 80;
    } catch (e) {}
}

// Particle system
class Particle {
    constructor() {
        this.reset();
    }
    reset() {
        this.x = Math.random() * W;
        this.y = Math.random() * H;
        this.size = Math.round(2 + (ENDPORTAL_SETTINGS.particle_size-1)*0.18); // 2-20
        this.speed = Math.round(0.5 + (ENDPORTAL_SETTINGS.particle_speed-1)*0.03); // 0.5-3
        this.brightness = Math.round(100 + (ENDPORTAL_SETTINGS.particle_brightness-1)*1.5); // 100-250
        this.angle = Math.random() * Math.PI * 2;
        this.char = ['*','o','O','@','+','x'][Math.floor(Math.random()*6)];
    // Animate color: start with a random hue in blue-purple range
    this.baseHue = 210 + Math.random() * 60;
    this.sat = 65 + Math.random() * 35;
    this.baseLight = 60 + Math.random() * 20;
    this.lightPhase = Math.random() * Math.PI * 2; // phase offset for pulsing
    this.pulseSpeed = 0.8 + Math.random() * 2.2; // random speed for twinkle (0.8–3.0)
    this.pulseAmp = 22 + Math.random() * 18; // random amplitude (22–40) for more obvious twinkle
    this.hueOffset = Math.random() * 60; // phase offset for smooth cycling within blue-purple
    }
    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        // Wrap
        if (this.x < 0) this.x = W;
        if (this.x > W) this.x = 0;
        if (this.y < 0) this.y = H;
        if (this.y > H) this.y = 0;
        // Occasionally randomize
        if (Math.random() < 0.01) this.angle = Math.random() * Math.PI * 2;
    }
    draw() {
        ctx.save();
        // Animate hue and brightness (lightness) over time
        const now = Date.now() / 1000;
        // Cycle only within 210-270 for hue
        let cycleRange = 60;
        let hue = 210 + ((this.baseHue - 210 + (now * 18) + this.hueOffset) % cycleRange);
    // Animate brightness (lightness) in a smooth pulse (sinusoidal), with random speed and amplitude for twinkling
    let pulse = Math.sin(now * this.pulseSpeed + this.lightPhase) * 0.5 + 0.5; // 0 to 1
    let light = this.baseLight + pulse * this.pulseAmp;
        let color = ENDPORTAL_SETTINGS.colored_particles
            ? `hsl(${hue},${this.sat}%,${light}%)`
            : '#fff';
        // Draw a much wider, softer glow using a radial gradient ellipse
        let glowRadius = this.size * 5.5;
        let grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowRadius);
        grad.addColorStop(0, color.replace('hsl', 'hsla').replace('%)', '%,0.18)'));
        grad.addColorStop(0.25, color.replace('hsl', 'hsla').replace('%)', '%,0.08)'));
        grad.addColorStop(0.7, color.replace('hsl', 'hsla').replace('%)', '%,0.02)'));
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = 1.0;
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowRadius, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
        // Draw main particle at normal size
        ctx.font = `${this.size}px monospace`;
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = color;
        ctx.fillText(this.char, this.x, this.y);
        ctx.restore();
    }
}


let particles = [];
function initParticles() {
    particles = [];
    for (let i=0; i<ENDPORTAL_PARTICLE_COUNT; ++i) particles.push(new Particle());
}
initParticles();

function animate() {
    ctx.clearRect(0,0,W,H);
    for (let p of particles) {
        p.update();
        p.draw();
    }
    setTimeout(animate, 30);
}
animate();

window.reloadEndportalSettings = function() {
    let cookieData = getCookie('endportal_settings');
    if (cookieData) {
        try {
            const data = JSON.parse(cookieData);
            ENDPORTAL_SETTINGS.particle_speed = safeNum(data.particle_speed, 50);
            ENDPORTAL_SETTINGS.particle_size = safeNum(data.particle_size, 30);
            ENDPORTAL_SETTINGS.particle_brightness = safeNum(data.particle_brightness, 80);
            ENDPORTAL_SETTINGS.colored_particles = (typeof data.colored_particles === 'boolean') ? data.colored_particles : true;
            ENDPORTAL_SETTINGS.particle_glow = typeof data.particle_glow === 'number' ? data.particle_glow : 80;
        } catch (e) {}
    }
    initParticles();
};

// Export settings schema for settings window
window.ENDPORTAL_SETTINGS_SCHEMA = [
    { key: 'particle_speed', name: 'Particle Speed', type: 'slider', min: 0, max: 100, default: 50 },
    { key: 'particle_size', name: 'Particle Size', type: 'slider', min: 0, max: 100, default: 30 },
    { key: 'particle_brightness', name: 'Particle Brightness', type: 'slider', min: 0, max: 100, default: 80 },
    { key: 'colored_particles', name: 'Colored Particles', type: 'toggle', default: true },
    { key: 'particle_glow', name: 'Particle Glow', type: 'slider', min: 0, max: 100, default: 80 }
];
});
