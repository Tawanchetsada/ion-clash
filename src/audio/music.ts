/**
 * ตัวสร้างเสียงดนตรีพื้นหลังแนวตื่นเต้น (Exciting Arcade / Synthwave BGM)
 * และเสียงเอฟเฟกต์การกดปุ่ม UI (Button Tap SFX)
 *
 * ทำงานผ่าน Web Audio API 100% — มีขนาดไฟล์ 0 KB, ไม่เปลืองเน็ต และเล่นได้ออฟไลน์
 */

// ตารางความถี่ของตัวโน้ต (Hz) ครอบคลุมทุกอ็อกเทฟ
const N: Record<string, number> = {
  // Octave 2
  C2: 65.41,
  D2: 73.42,
  E2: 82.41,
  F2: 87.31,
  Fs2: 92.5,
  G2: 98.0,
  Gs2: 103.83,
  A2: 110.0,
  As2: 116.54,
  B2: 123.47,

  // Octave 3
  C3: 130.81,
  Cs3: 138.59,
  D3: 146.83,
  Ds3: 155.56,
  E3: 164.81,
  F3: 174.61,
  Fs3: 185.0,
  G3: 196.0,
  Gs3: 207.65,
  A3: 220.0,
  As3: 233.08,
  B3: 246.94,

  // Octave 4
  C4: 261.63,
  Cs4: 277.18,
  D4: 293.66,
  Ds4: 311.13,
  E4: 329.63,
  F4: 349.23,
  Fs4: 369.99,
  G4: 392.0,
  Gs4: 415.3,
  A4: 440.0,
  As4: 466.16,
  B4: 493.88,

  // Octave 5
  C5: 523.25,
  Cs5: 554.37,
  D5: 587.33,
  Ds5: 622.25,
  E5: 659.25,
  F5: 698.46,
  Fs5: 739.99,
  G5: 783.99,
  Gs5: 830.61,
  A5: 880.0,
  As5: 932.33,
  B5: 987.77,

  // Octave 6
  C6: 1046.5,
};

type TimedNote = {
  freq: number;
  time: number; // วินาทีจากจุดเริ่มต้นลูป
  duration: number;
  type?: OscillatorType;
  gain?: number;
};

// จังหวะ 128 BPM (1 บีท = 60/128 = 0.46875 วินาที, 1 ห้อง = 1.875 วินาที)
const BEAT = 60 / 128; // ~0.46875s
const BAR = BEAT * 4; // ~1.875s
const TOTAL_BARS = 8;
const LOOP_DURATION = BAR * TOTAL_BARS; // 15.0 วินาทีต่อลูป

// สร้าง Bassline ขับเคลื่อนจังหวะ (Driving 8th-note Synth Bass)
function generateBassline(): TimedNote[] {
  const notes: TimedNote[] = [];
  // คอร์ด 8 ห้อง: Am -> F -> C -> G -> Am -> F -> Dm -> E
  const progression = [
    { root: N.A2 ?? 110, high: N.A3 ?? 220 },
    { root: N.F2 ?? 87.31, high: N.F3 ?? 174.61 },
    { root: N.C3 ?? 130.81, high: N.C4 ?? 261.63 },
    { root: N.G2 ?? 98, high: N.G3 ?? 196 },
    { root: N.A2 ?? 110, high: N.A3 ?? 220 },
    { root: N.F2 ?? 87.31, high: N.F3 ?? 174.61 },
    { root: N.D3 ?? 146.83, high: N.D4 ?? 293.66 },
    { root: N.E2 ?? 82.41, high: N.E3 ?? 164.81 },
  ];

  progression.forEach((chord, barIndex) => {
    const barStart = barIndex * BAR;
    for (let step = 0; step < 8; step++) {
      const time = barStart + step * (BEAT / 2);
      const isOctave = step % 2 === 1;
      notes.push({
        freq: isOctave ? chord.high : chord.root,
        time,
        duration: BEAT * 0.42,
        type: "sawtooth",
        gain: isOctave ? 0.18 : 0.24,
      });
    }
  });

  return notes;
}

// สร้าง Lead Arpeggio & Melody ที่สนุกสนานและตื่นเต้น
function generateMelody(): TimedNote[] {
  const notes: TimedNote[] = [];

  // เมโลดี้ท่อน 1 (ห้อง 0-3)
  const pattern1: [number, number, number][] = [
    [0.0, N.E4 ?? 329.63, 0.4],
    [0.5, N.A4 ?? 440, 0.4],
    [1.0, N.C5 ?? 523.25, 0.4],
    [1.5, N.E5 ?? 659.25, 0.6],
    [2.5, N.D5 ?? 587.33, 0.4],
    [3.0, N.C5 ?? 523.25, 0.4],
    [3.5, N.B4 ?? 493.88, 0.4],

    [4.0, N.A4 ?? 440, 0.4],
    [4.5, N.C5 ?? 523.25, 0.4],
    [5.0, N.E5 ?? 659.25, 0.4],
    [5.5, N.A5 ?? 880, 0.8],
    [6.5, N.G5 ?? 783.99, 0.4],
    [7.0, N.E5 ?? 659.25, 0.4],
    [7.5, N.D5 ?? 587.33, 0.4],

    [8.0, N.E5 ?? 659.25, 0.4],
    [8.5, N.G5 ?? 783.99, 0.4],
    [9.0, N.C5 ?? 523.25, 0.4],
    [9.5, N.E5 ?? 659.25, 0.6],
    [10.5, N.D5 ?? 587.33, 0.4],
    [11.0, N.C5 ?? 523.25, 0.4],
    [11.5, N.B4 ?? 493.88, 0.4],

    [12.0, N.G4 ?? 392, 0.4],
    [12.5, N.B4 ?? 493.88, 0.4],
    [13.0, N.D5 ?? 587.33, 0.4],
    [13.5, N.G5 ?? 783.99, 0.6],
    [14.5, N.F5 ?? 698.46, 0.4],
    [15.0, N.E5 ?? 659.25, 0.4],
    [15.5, N.D5 ?? 587.33, 0.4],
  ];

  // เมโลดี้ท่อน 2 (ห้อง 4-7: ท่อนฮุคเร่งความตื่นเต้น)
  const pattern2: [number, number, number][] = [
    [16.0, N.E5 ?? 659.25, 0.35],
    [16.5, N.E5 ?? 659.25, 0.35],
    [17.0, N.D5 ?? 587.33, 0.35],
    [17.5, N.C5 ?? 523.25, 0.5],
    [18.5, N.D5 ?? 587.33, 0.35],
    [19.0, N.E5 ?? 659.25, 0.35],
    [19.5, N.A5 ?? 880, 0.8],

    [20.0, N.A5 ?? 880, 0.35],
    [20.5, N.G5 ?? 783.99, 0.35],
    [21.0, N.F5 ?? 698.46, 0.35],
    [21.5, N.E5 ?? 659.25, 0.5],
    [22.5, N.D5 ?? 587.33, 0.35],
    [23.0, N.C5 ?? 523.25, 0.35],
    [23.5, N.B4 ?? 493.88, 0.5],

    [24.0, N.D5 ?? 587.33, 0.35],
    [24.5, N.F5 ?? 698.46, 0.35],
    [25.0, N.A5 ?? 880, 0.5],
    [25.5, N.D5 ?? 587.33, 0.5],
    [26.5, N.F5 ?? 698.46, 0.35],
    [27.0, N.E5 ?? 659.25, 0.35],
    [27.5, N.D5 ?? 587.33, 0.35],

    [28.0, N.E5 ?? 659.25, 0.4],
    [28.5, N.B4 ?? 493.88, 0.4],
    [29.0, N.Gs4 ?? 415.3, 0.4],
    [29.5, N.E4 ?? 329.63, 0.4],
    [30.0, N.E5 ?? 659.25, 0.4],
    [30.5, N.B4 ?? 493.88, 0.4],
    [31.0, N.C5 ?? 523.25, 0.4],
    [31.5, N.B4 ?? 493.88, 0.4],
  ];

  [...pattern1, ...pattern2].forEach(([beatTime, freq, beatDur]) => {
    notes.push({
      freq,
      time: beatTime * BEAT,
      duration: beatDur * BEAT,
      type: "square",
      gain: 0.16,
    });
  });

  return notes;
}

const BASSLINE = generateBassline();
const MELODY = generateMelody();

export class MusicSynthesizer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicFilter: BiquadFilterNode | null = null;
  private isPlaying = false;
  private loopTimer: ReturnType<typeof setInterval> | null = null;
  private nextLoopStartTime = 0;

  private initAudio() {
    if (this.ctx || typeof window === "undefined") return;
    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;
      this.ctx = new AudioCtxClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.09, this.ctx.currentTime);

      this.musicFilter = this.ctx.createBiquadFilter();
      this.musicFilter.type = "lowpass";
      this.musicFilter.frequency.setValueAtTime(2400, this.ctx.currentTime); // โทนเสียงสดใส คมชัดสไตล์ Arcade

      this.masterGain.connect(this.musicFilter);
      this.musicFilter.connect(this.ctx.destination);
    } catch {
      // Fallback safe
    }
  }

  /** เล่นเสียงกลอง Kick สังเคราะห์ */
  private playKick(time: number) {
    if (!this.ctx || !this.masterGain || !Number.isFinite(time)) return;
    try {
      const playTime = Math.max(this.ctx.currentTime, time);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.frequency.setValueAtTime(140, playTime);
      osc.frequency.exponentialRampToValueAtTime(36, playTime + 0.08);

      gain.gain.setValueAtTime(0.28, playTime);
      gain.gain.exponentialRampToValueAtTime(0.001, playTime + 0.09);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(playTime);
      osc.stop(playTime + 0.1);
    } catch {
      // Safe fallback
    }
  }

  /** เล่นเสียงกลอง Snare สังเคราะห์ */
  private playSnare(time: number) {
    if (!this.ctx || !this.masterGain || !Number.isFinite(time)) return;

    try {
      const playTime = Math.max(this.ctx.currentTime, time);

      // Tonal punch
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.frequency.setValueAtTime(180, playTime);
      osc.frequency.exponentialRampToValueAtTime(80, playTime + 0.06);
      oscGain.gain.setValueAtTime(0.18, playTime);
      oscGain.gain.exponentialRampToValueAtTime(0.001, playTime + 0.06);
      osc.connect(oscGain);
      oscGain.connect(this.masterGain);
      osc.start(playTime);
      osc.stop(playTime + 0.07);

      // Noise snap
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.08);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = "highpass";
      noiseFilter.frequency.setValueAtTime(1000, playTime);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.14, playTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, playTime + 0.08);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      noise.start(playTime);
    } catch {
      // Safe fallback
    }
  }

  /** เล่นเสียง Hi-Hat สังเคราะห์ */
  private playHiHat(time: number, isAccent: boolean) {
    if (!this.ctx || !this.masterGain || !Number.isFinite(time)) return;

    try {
      const playTime = Math.max(this.ctx.currentTime, time);
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.03);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.setValueAtTime(7000, playTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(isAccent ? 0.08 : 0.04, playTime);
      gain.gain.exponentialRampToValueAtTime(0.001, playTime + 0.025);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(playTime);
    } catch {
      // Safe fallback
    }
  }

  /** เล่นโน้ตดนตรี */
  private playNote(note: TimedNote, baseTime: number) {
    if (!this.ctx || !this.masterGain) return;
    if (typeof note.freq !== "number" || !Number.isFinite(note.freq) || note.freq <= 0) return;
    if (typeof baseTime !== "number" || !Number.isFinite(baseTime)) return;
    if (typeof note.time !== "number" || !Number.isFinite(note.time)) return;
    if (typeof note.duration !== "number" || !Number.isFinite(note.duration) || note.duration <= 0)
      return;

    try {
      const startTime = Math.max(this.ctx.currentTime, baseTime + note.time);
      const stopTime = startTime + note.duration;

      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      osc.type = note.type ?? "sawtooth";
      osc.frequency.setValueAtTime(note.freq, startTime);

      const maxGain =
        typeof note.gain === "number" && Number.isFinite(note.gain) ? note.gain : 0.2;
      noteGain.gain.setValueAtTime(0.0001, startTime);
      noteGain.gain.linearRampToValueAtTime(maxGain, startTime + 0.015);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, stopTime);

      osc.connect(noteGain);
      noteGain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(stopTime + 0.05);
    } catch {
      // Safe fallback
    }
  }

  /** จัดตารางเล่นลูป 1 รอบ */
  private scheduleLoop(startTime: number) {
    if (!Number.isFinite(startTime)) return;

    // 1. เล่นจังหวะกลอง (Drums)
    const totalBeats = TOTAL_BARS * 4;
    for (let b = 0; b < totalBeats; b++) {
      const beatTime = startTime + b * BEAT;

      // Kick ทุกจังหวะ 1, 2, 3, 4 (Driving pulse)
      this.playKick(beatTime);

      // Snare จังหวะที่ 2 และ 4
      if (b % 2 === 1) {
        this.playSnare(beatTime);
      }

      // Hi-Hat ทุก 8th note
      this.playHiHat(beatTime, true);
      this.playHiHat(beatTime + BEAT / 2, false);
    }

    // 2. เล่น Bassline
    for (const note of BASSLINE) {
      this.playNote(note, startTime);
    }

    // 3. เล่น Melody & Lead
    for (const note of MELODY) {
      this.playNote(note, startTime);
    }
  }

  /** ตัวตรวจและจัดตารางโน้ตล่วงหน้า (Lookahead Loop Scheduler) */
  private tick() {
    if (!this.isPlaying || !this.ctx) return;
    const current = this.ctx.currentTime;

    // หากเวลาลูปถัดไปตกค้างอยู่ในอดีต ให้ปรับมาเริ่มจากปัจจุบัน
    if (this.nextLoopStartTime < current) {
      this.nextLoopStartTime = current + 0.05;
    }

    // จัดตารางเล่นล่วงหน้า 3 วินาทีเสมอ เพื่อให้ลูปต่อกันอย่างแนบเนียนไม่มีสะดุด
    while (this.nextLoopStartTime < current + 3.0) {
      this.scheduleLoop(this.nextLoopStartTime);
      this.nextLoopStartTime += LOOP_DURATION;
    }
  }

  start() {
    this.initAudio();
    if (!this.ctx) return;
    if (this.isPlaying) return;

    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }

    this.isPlaying = true;

    // คืนค่าระดับเสียง Master Gain ให้ดังตามปกติ (กรณีเคยถูก Fade out ใน stop())
    if (this.masterGain) {
      try {
        this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.masterGain.gain.setValueAtTime(0.09, this.ctx.currentTime);
      } catch {
        // Safe fallback
      }
    }

    const now = this.ctx.currentTime;
    this.nextLoopStartTime = now + 0.05;
    this.tick();

    if (this.loopTimer) {
      clearInterval(this.loopTimer);
    }
    this.loopTimer = setInterval(() => this.tick(), 200);
  }

  stop() {
    this.isPlaying = false;
    if (this.loopTimer) {
      clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime);
        this.masterGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.15);
      } catch {
        // Safe fallback
      }
    }
  }

  /** เล่นเสียงคลิก/แตะปุ่ม UI (Button Tap Click Sound) */
  playButtonTap() {
    this.initAudio();
    if (!this.ctx) return;

    try {
      if (this.ctx.state === "suspended") {
        void this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.035);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // Safe fallback
    }
  }
}

export const backgroundMusic = new MusicSynthesizer();
