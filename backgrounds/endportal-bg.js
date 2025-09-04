// Get canvas context for end portal effect
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Set canvas size to window size and update when window resizes
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Create a WebGL-like shader effect
const particles = [];
const numParticles = 50;
const maxSpeed = 0.5;
const particleSize = 2;
const trailLength = 20;

// Initialize particles
for (let i = 0; i < numParticles; i++) {
    particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() * 2 - 1) * maxSpeed,
        vy: (Math.random() * 2 - 1) * maxSpeed,
        trail: []
    });
}

// Animation loop
function animate() {
    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update and draw particles
    for (let particle of particles) {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // Add current position to trail
        particle.trail.push({ x: particle.x, y: particle.y });
        if (particle.trail.length > trailLength) {
            particle.trail.shift();
        }

        // Draw trail
        ctx.beginPath();
        ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
        for (let i = 1; i < particle.trail.length; i++) {
            ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
        }
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + Math.random() * 0.2})`;
        ctx.lineWidth = particleSize;
        ctx.lineCap = 'round';
        ctx.stroke();
    }

    // Add some random noise
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.1})`;
        ctx.fillRect(x, y, 1, 1);
    }

    requestAnimationFrame(animate);
}

// Start animation
animate();
