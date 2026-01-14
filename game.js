/**
 * Bubble Pop - Main Game Engine
 * A satisfying stress-relief bubble popping game
 */

class BubblePopGame {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.rippleContainer = document.getElementById('rippleContainer');

        // Game state
        this.bubbles = [];
        this.particles = [];
        this.isRunning = false;
        this.isPaused = false;
        this.animationId = null;

        // Score tracking
        this.popCount = 0;
        this.combo = 1;
        this.comboTimer = null;
        this.bestScore = parseInt(localStorage.getItem('bubblePopBest')) || 0;

        // Settings
        this.settings = {
            speed: 2,
            size: 3,
            soundEnabled: true
        };

        // Bubble colors - vibrant and satisfying
        this.colors = [
            { main: '#f472b6', light: '#fce7f3', glow: 'rgba(244, 114, 182, 0.5)' }, // Pink
            { main: '#a855f7', light: '#f3e8ff', glow: 'rgba(168, 85, 247, 0.5)' },  // Purple
            { main: '#06b6d4', light: '#cffafe', glow: 'rgba(6, 182, 212, 0.5)' },   // Cyan
            { main: '#10b981', light: '#d1fae5', glow: 'rgba(16, 185, 129, 0.5)' },  // Green
            { main: '#f59e0b', light: '#fef3c7', glow: 'rgba(245, 158, 11, 0.5)' },  // Amber
            { main: '#ef4444', light: '#fee2e2', glow: 'rgba(239, 68, 68, 0.5)' },   // Red
            { main: '#8b5cf6', light: '#ede9fe', glow: 'rgba(139, 92, 246, 0.5)' },  // Violet
        ];

        this.init();
    }

    init() {
        this.resizeCanvas();
        this.setupEventListeners();
        this.updateDisplay();

        // Initial render
        this.render();
    }

    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.width = rect.width;
        this.height = rect.height;
    }

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => this.resizeCanvas());

        // Canvas click/touch
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleClick(touch);
        });

        // Control buttons
        document.getElementById('startBtn').addEventListener('click', () => this.toggleStart());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());

        // Settings
        document.getElementById('speedSlider').addEventListener('input', (e) => {
            this.settings.speed = parseInt(e.target.value);
        });

        document.getElementById('sizeSlider').addEventListener('input', (e) => {
            this.settings.size = parseInt(e.target.value);
        });

        document.getElementById('soundToggle').addEventListener('change', (e) => {
            this.settings.soundEnabled = e.target.checked;
            soundManager.toggle(e.target.checked);
        });

        // Initialize sound on first user interaction
        document.addEventListener('click', () => soundManager.init(), { once: true });
        document.addEventListener('touchstart', () => soundManager.init(), { once: true });
    }

    toggleStart() {
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');

        if (this.isRunning) {
            this.stop();
            startBtn.innerHTML = '<span class="btn-icon">▶</span> Start Game';
            pauseBtn.disabled = true;
        } else {
            this.start();
            startBtn.innerHTML = '<span class="btn-icon">■</span> Stop Game';
            pauseBtn.disabled = false;
        }
    }

    togglePause() {
        const pauseBtn = document.getElementById('pauseBtn');

        if (this.isPaused) {
            this.resume();
            pauseBtn.innerHTML = '<span class="btn-icon">⏸</span> Pause';
        } else {
            this.pause();
            pauseBtn.innerHTML = '<span class="btn-icon">▶</span> Resume';
        }
    }

    start() {
        this.isRunning = true;
        this.isPaused = false;
        this.gameLoop();
        this.spawnBubbles();
    }

    stop() {
        this.isRunning = false;
        this.isPaused = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.spawnInterval) {
            clearInterval(this.spawnInterval);
        }
        this.bubbles = [];
        this.particles = [];
        this.render();
    }

    pause() {
        this.isPaused = true;
        if (this.spawnInterval) {
            clearInterval(this.spawnInterval);
        }
    }

    resume() {
        this.isPaused = false;
        this.spawnBubbles();
    }

    spawnBubbles() {
        if (this.spawnInterval) {
            clearInterval(this.spawnInterval);
        }

        const spawnRate = 2000 / this.settings.speed;

        this.spawnInterval = setInterval(() => {
            if (!this.isPaused && this.isRunning) {
                this.createBubble();
            }
        }, spawnRate);

        // Initial bubbles
        for (let i = 0; i < 3 + this.settings.speed; i++) {
            setTimeout(() => this.createBubble(), i * 200);
        }
    }

    createBubble() {
        const baseSize = 25 + (this.settings.size * 10);
        const size = baseSize + Math.random() * 20;
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];

        const bubble = {
            x: Math.random() * (this.width - size * 2) + size,
            y: this.height + size,
            size: size,
            color: color,
            speed: (0.5 + Math.random() * 0.5) * this.settings.speed,
            wobbleOffset: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.02 + Math.random() * 0.02,
            opacity: 0.8 + Math.random() * 0.2
        };

        this.bubbles.push(bubble);
    }

    handleClick(e) {
        if (!this.isRunning || this.isPaused) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check bubble hits (in reverse to check top bubbles first)
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const bubble = this.bubbles[i];
            const distance = Math.sqrt(
                Math.pow(x - bubble.x, 2) + Math.pow(y - bubble.y, 2)
            );

            if (distance < bubble.size) {
                this.popBubble(bubble, i, x, y);
                break; // Only pop one bubble per click
            }
        }
    }

    popBubble(bubble, index, clickX, clickY) {
        // Remove bubble
        this.bubbles.splice(index, 1);

        // Update score
        this.popCount++;
        this.updateCombo();

        // Update best score
        if (this.popCount > this.bestScore) {
            this.bestScore = this.popCount;
            localStorage.setItem('bubblePopBest', this.bestScore);
        }

        this.updateDisplay();

        // Play sound
        soundManager.playPop(0.8 + (bubble.size / 100));
        if (this.combo > 2) {
            soundManager.playCombo(this.combo);
        }

        // Create particle explosion
        this.createParticles(bubble.x, bubble.y, bubble.color, bubble.size);

        // Create ripple effect
        this.createRipple(clickX, clickY, bubble.color);

        // Show pop text
        this.showPopText(bubble.x, bubble.y, bubble.color);
    }

    updateCombo() {
        this.combo++;

        // Reset combo after inactivity
        if (this.comboTimer) {
            clearTimeout(this.comboTimer);
        }

        this.comboTimer = setTimeout(() => {
            this.combo = 1;
            this.updateDisplay();
        }, 1500);
    }

    createParticles(x, y, color, size) {
        const particleCount = Math.floor(size / 5) + 10;

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i + Math.random() * 0.5;
            const velocity = 2 + Math.random() * 4;

            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                size: 3 + Math.random() * 5,
                color: Math.random() > 0.5 ? color.main : color.light,
                life: 1,
                decay: 0.02 + Math.random() * 0.02
            });
        }
    }

    createRipple(x, y, color) {
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.width = '100px';
        ripple.style.height = '100px';
        ripple.style.background = `radial-gradient(circle, ${color.glow} 0%, transparent 70%)`;

        this.rippleContainer.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    }

    showPopText(x, y, color) {
        const text = document.createElement('div');
        text.className = 'pop-text';
        text.textContent = this.combo > 1 ? `+${this.combo}` : 'Pop!';
        text.style.left = x + 'px';
        text.style.top = y + 'px';
        text.style.color = color.main;

        const wrapper = this.canvas.parentElement;
        wrapper.appendChild(text);

        setTimeout(() => text.remove(), 800);
    }

    updateDisplay() {
        document.getElementById('popCount').textContent = this.popCount;
        document.getElementById('comboCount').textContent = `x${this.combo}`;
        document.getElementById('bestScore').textContent = this.bestScore;

        // Animate combo display when high
        const comboEl = document.getElementById('comboCount');
        if (this.combo > 3) {
            comboEl.style.transform = 'scale(1.2)';
            comboEl.style.textShadow = '0 0 20px rgba(244, 114, 182, 0.8)';
            setTimeout(() => {
                comboEl.style.transform = 'scale(1)';
                comboEl.style.textShadow = 'none';
            }, 100);
        }
    }

    gameLoop() {
        if (!this.isRunning) return;

        if (!this.isPaused) {
            this.update();
        }

        this.render();
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        // Update bubbles
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const bubble = this.bubbles[i];

            // Move up
            bubble.y -= bubble.speed;

            // Wobble side to side
            bubble.wobbleOffset += bubble.wobbleSpeed;
            bubble.x += Math.sin(bubble.wobbleOffset) * 0.5;

            // Remove if off screen
            if (bubble.y < -bubble.size * 2) {
                this.bubbles.splice(i, 1);
            }
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];

            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1; // Gravity
            particle.life -= particle.decay;

            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw particles (behind bubbles)
        this.particles.forEach(particle => {
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life;
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        });

        // Draw bubbles
        this.bubbles.forEach(bubble => {
            this.drawBubble(bubble);
        });

        // Draw instructions if not running
        if (!this.isRunning) {
            this.drawInstructions();
        } else if (this.isPaused) {
            this.drawPausedOverlay();
        }
    }

    drawBubble(bubble) {
        const { x, y, size, color, opacity } = bubble;

        // Glow effect
        this.ctx.beginPath();
        this.ctx.arc(x, y, size + 5, 0, Math.PI * 2);
        const glowGradient = this.ctx.createRadialGradient(x, y, size * 0.5, x, y, size + 10);
        glowGradient.addColorStop(0, color.glow);
        glowGradient.addColorStop(1, 'transparent');
        this.ctx.fillStyle = glowGradient;
        this.ctx.fill();

        // Main bubble
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);

        // Gradient fill
        const gradient = this.ctx.createRadialGradient(
            x - size * 0.3, y - size * 0.3, 0,
            x, y, size
        );
        gradient.addColorStop(0, color.light);
        gradient.addColorStop(0.5, color.main);
        gradient.addColorStop(1, color.main);

        this.ctx.fillStyle = gradient;
        this.ctx.globalAlpha = opacity;
        this.ctx.fill();
        this.ctx.globalAlpha = 1;

        // Highlight/shine
        this.ctx.beginPath();
        this.ctx.arc(x - size * 0.3, y - size * 0.3, size * 0.25, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.fill();

        // Secondary shine
        this.ctx.beginPath();
        this.ctx.arc(x - size * 0.15, y - size * 0.5, size * 0.1, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.fill();
    }

    drawInstructions() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.font = '20px Outfit';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Press "Start Game" to begin!', this.width / 2, this.height / 2);

        this.ctx.font = '14px Outfit';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.fillText('Click or tap bubbles to pop them', this.width / 2, this.height / 2 + 30);
    }

    drawPausedOverlay() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = 'bold 32px Outfit';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.width / 2, this.height / 2);
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new BubblePopGame();
});
