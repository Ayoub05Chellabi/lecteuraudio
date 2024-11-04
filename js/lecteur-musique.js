class LecteurMusique extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Création de la structure du lecteur
        this.shadowRoot.innerHTML = `
            <div class="lecteur">
        <audio src="${this.getAttribute('src')}"></audio>
        <canvas class="visualizer"></canvas>
        <div class="controls">
            <button class="play">▶️</button>
            <button class="pause">⏸️</button>
            <button class="backward">⏪ 10s</button>
            <button class="forward">⏩ 10s</button>
            <button class="slow-down">🐢</button>
            <button class="speed-up">🐇</button>
        </div>
        <webaudio-knob
            src="/assets/images/knob.png" 
            value="0.5" 
            min="0" 
            max="1" 
            step="0.01" 
            class="volume-control"
            diameter="60"
            tooltip="Volume: %s"
            width="60"
            height="60">
        </webaudio-knob>
        <input type="range" class="progress" value="0" max="100">
        <span class="time">00:00 / 00:00</span>
    </div>
            <style>
                .lecteur {
                    background-color: #f0f0f0;
                    border-radius: 10px;
                    padding: 20px;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 15px;
                    max-width: 500px;
                    margin: auto;
                }

                .visualizer {
                    width: 100%;
                    height: 100px;
                    background: #fff;
                    border-radius: 5px;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                }

                .controls {
                    display: flex;
                    gap: 10px;
                }

                .controls button {
                    background: #6a82fb;
                    color: white;
                    border: none;
                    padding: 10px;
                    border-radius: 5px;
                    cursor: pointer;
                    transition: background 0.3s;
                }

                .controls button:hover {
                    background: #fc5c7d;
                }

                .progress {
                    width: 100%;
                    appearance: none;
                    height: 5px;
                    border-radius: 5px;
                    background: #ddd;
                }

                .progress::-webkit-slider-thumb {
                    appearance: none;
                    width: 15px;
                    height: 15px;
                    border-radius: 50%;
                    background: #6a82fb;
                    cursor: pointer;
                }

                .time {
                    font-size: 14px;
                    color: #555;
                }
            </style>
        `;

        this.audio = this.shadowRoot.querySelector('audio');
        this.playButton = this.shadowRoot.querySelector('.play');
        this.pauseButton = this.shadowRoot.querySelector('.pause');
        this.backwardButton = this.shadowRoot.querySelector('.backward');
        this.forwardButton = this.shadowRoot.querySelector('.forward');
        this.slowDownButton = this.shadowRoot.querySelector('.slow-down');
        this.speedUpButton = this.shadowRoot.querySelector('.speed-up');
        this.progressBar = this.shadowRoot.querySelector('.progress');
        this.timeDisplay = this.shadowRoot.querySelector('.time');
        this.canvas = this.shadowRoot.querySelector('.visualizer');
        this.canvasContext = this.canvas.getContext('2d');

        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.playButton.addEventListener('click', () => {
            this.audio.play();
            if (!this.audioContext) {
                this.setupAudioContext();
            }
        });
        this.pauseButton.addEventListener('click', () => this.audio.pause());
        
        this.backwardButton.addEventListener('click', () => {
            this.audio.currentTime = Math.max(0, this.audio.currentTime - 10);
        });

        this.forwardButton.addEventListener('click', () => {
            this.audio.currentTime = Math.min(this.audio.duration, this.audio.currentTime + 10);
        });

        this.slowDownButton.addEventListener('click', () => {
            this.audio.playbackRate = Math.max(0.5, this.audio.playbackRate - 0.25);
        });

        this.speedUpButton.addEventListener('click', () => {
            this.audio.playbackRate = Math.min(2.0, this.audio.playbackRate + 0.25);
        });

        this.audio.addEventListener('timeupdate', () => {
            const progress = (this.audio.currentTime / this.audio.duration) * 100;
            this.progressBar.value = progress;

            const currentTime = this.formatTime(this.audio.currentTime);
            const duration = this.formatTime(this.audio.duration);
            this.timeDisplay.textContent = `${currentTime} / ${duration}`;
        });

        this.progressBar.addEventListener('input', (event) => {
            const seekTime = (event.target.value / 100) * this.audio.duration;
            this.audio.currentTime = seekTime;
        });
    }

    setupAudioContext() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        const source = this.audioContext.createMediaElementSource(this.audio);
        source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        this.analyser.fftSize = 256;

        const bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(bufferLength);

        this.drawVisualizer();
    }

    drawVisualizer() {
        requestAnimationFrame(() => this.drawVisualizer());

        this.analyser.getByteFrequencyData(this.dataArray);
        this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const barWidth = (this.canvas.width / this.dataArray.length) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < this.dataArray.length; i++) {
            barHeight = this.dataArray[i];

            this.canvasContext.fillStyle = `rgb(${barHeight + 100}, 50, 150)`;
            this.canvasContext.fillRect(x, this.canvas.height - barHeight / 2, barWidth, barHeight / 2);

            x += barWidth + 1;
        }
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }
}

customElements.define('lecteur-musique', LecteurMusique);
