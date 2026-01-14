/**
 * Bubble Pop - Sound Effects Module
 * Uses Web Audio API to generate satisfying pop sounds
 */

class SoundManager {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    }

    toggle(enabled) {
        this.enabled = enabled;
    }

    // Satisfying bubble pop sound
    playPop(pitch = 1) {
        if (!this.enabled || !this.audioContext) return;

        // Resume context if suspended (needed for autoplay policies)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const now = this.audioContext.currentTime;

        // Create oscillator for the "pop" sound
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // Pop characteristics - slightly randomized for variety
        const baseFreq = 400 + Math.random() * 200;
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(baseFreq * pitch, now);
        oscillator.frequency.exponentialRampToValueAtTime(
            (baseFreq * pitch) * 0.5,
            now + 0.1
        );

        // Volume envelope - quick attack, fast decay
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        // Connect and play
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start(now);
        oscillator.stop(now + 0.15);

        // Add a secondary "splash" sound
        this.playSplash(pitch);
    }

    // Water splash effect
    playSplash(pitch = 1) {
        if (!this.enabled || !this.audioContext) return;

        const now = this.audioContext.currentTime;

        // White noise for splash
        const bufferSize = this.audioContext.sampleRate * 0.1;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;

        // Filter to make it sound more like water
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1500 * pitch, now);
        filter.Q.setValueAtTime(5, now);

        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        noise.start(now);
        noise.stop(now + 0.1);
    }

    // Combo sound - higher pitch celebration
    playCombo(comboLevel) {
        if (!this.enabled || !this.audioContext) return;

        const now = this.audioContext.currentTime;
        const pitch = 1 + (comboLevel * 0.1);

        // Multiple notes for celebration effect
        for (let i = 0; i < Math.min(comboLevel, 5); i++) {
            setTimeout(() => {
                this.playChime(pitch + (i * 0.2));
            }, i * 50);
        }
    }

    // Celebration chime
    playChime(pitch = 1) {
        if (!this.enabled || !this.audioContext) return;

        const now = this.audioContext.currentTime;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(800 * pitch, now);

        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start(now);
        oscillator.stop(now + 0.3);
    }
}

// Global sound manager instance
const soundManager = new SoundManager();
