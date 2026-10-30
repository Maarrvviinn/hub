/**
 * ═══════════════════════════════════════════════════════════════════
 * JULIA'S BIRTHDAY CELEBRATION — INTERACTION & AUDIO LOGIC
 * Follows modern web guidance, taste-skill & interaction-design
 * ═══════════════════════════════════════════════════════════════════
 */

document.addEventListener('DOMContentLoaded', () => {
  // ── Web Audio Synthesizer (No external sound files required) ──
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  function resumeAudio() {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Sweet success chime
  function playSuccessChime() {
    resumeAudio();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0, audioCtx.currentTime + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.08 + 0.6);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(audioCtx.currentTime + idx * 0.08);
      osc.stop(audioCtx.currentTime + idx * 0.08 + 0.65);
    });
  }

  // Sparkle harp glissando
  function playSparkleSound() {
    resumeAudio();
    const freqs = [659.25, 783.99, 987.77, 1174.66, 1318.51, 1567.98];
    freqs.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.05);

      gain.gain.setValueAtTime(0.001, audioCtx.currentTime + i * 0.05);
      gain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + i * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + i * 0.05 + 0.8);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(audioCtx.currentTime + i * 0.05);
      osc.stop(audioCtx.currentTime + i * 0.05 + 0.85);
    });
  }

  // Realistic Marimba / iPhone-like phone ringtone
  let ringInterval = null;
  function startPhoneRing() {
    resumeAudio();
    stopPhoneRing();

    function ringSequence() {
      const pattern = [
        { f: 1046.5, t: 0.0 },
        { f: 880.0,  t: 0.12 },
        { f: 1046.5, t: 0.24 },
        { f: 1318.5, t: 0.36 },
        { f: 1046.5, t: 0.52 },
        { f: 880.0,  t: 0.64 }
      ];

      pattern.forEach(n => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.f, audioCtx.currentTime + n.t);

        gain.gain.setValueAtTime(0, audioCtx.currentTime + n.t);
        gain.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + n.t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + n.t + 0.18);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(audioCtx.currentTime + n.t);
        osc.stop(audioCtx.currentTime + n.t + 0.2);
      });
    }

    ringSequence();
    ringInterval = setInterval(ringSequence, 1800);
  }

  function stopPhoneRing() {
    if (ringInterval) {
      clearInterval(ringInterval);
      ringInterval = null;
    }
  }

  // Call connected chime
  function playConnectedSound() {
    resumeAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.35);
  }

  // Ambient gentle music box melody (Happy Birthday theme)
  let musicBoxPlaying = false;
  let musicBoxTimer = null;
  const birthdayMelody = [
    { n: 523.25, d: 0.35 }, { n: 523.25, d: 0.25 }, { n: 587.33, d: 0.6 }, { n: 523.25, d: 0.6 },
    { n: 698.46, d: 0.6 },  { n: 659.25, d: 1.0 },
    { n: 523.25, d: 0.35 }, { n: 523.25, d: 0.25 }, { n: 587.33, d: 0.6 }, { n: 523.25, d: 0.6 },
    { n: 783.99, d: 0.6 },  { n: 698.46, d: 1.0 },
    { n: 523.25, d: 0.35 }, { n: 523.25, d: 0.25 }, { n: 1046.5, d: 0.6 }, { n: 880.0, d: 0.6 },
    { n: 698.46, d: 0.6 },  { n: 659.25, d: 0.6 },  { n: 587.33, d: 0.8 },
    { n: 932.33, d: 0.35 }, { n: 932.33, d: 0.25 }, { n: 880.0, d: 0.6 },  { n: 698.46, d: 0.6 },
    { n: 783.99, d: 0.6 },  { n: 698.46, d: 1.4 }
  ];

  function toggleMusicBox() {
    resumeAudio();
    const btn = document.getElementById('music-toggle-btn');
    if (musicBoxPlaying) {
      clearTimeout(musicBoxTimer);
      musicBoxPlaying = false;
      btn.classList.remove('active');
      btn.innerHTML = '🎵 Musik: Aus';
    } else {
      musicBoxPlaying = true;
      btn.classList.add('active');
      btn.innerHTML = '🎶 Musik: An';
      playMelodyLoop(0);
    }
  }

  function playMelodyLoop(noteIndex) {
    if (!musicBoxPlaying) return;
    const note = birthdayMelody[noteIndex];
    
    // Play single music box bell
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(note.n, audioCtx.currentTime);

    // Harmonic overtone for celeste/bell richness
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(note.n * 2, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + note.d * 1.5);

    gain2.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + note.d * 1.2);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);

    osc.start();
    osc2.start();
    osc.stop(audioCtx.currentTime + note.d * 1.6);
    osc2.stop(audioCtx.currentTime + note.d * 1.3);

    const nextIndex = (noteIndex + 1) % birthdayMelody.length;
    const delay = note.d * 680;
    musicBoxTimer = setTimeout(() => {
      playMelodyLoop(nextIndex);
    }, delay);
  }

  document.getElementById('music-toggle-btn')?.addEventListener('click', toggleMusicBox);

  // ── Ambient Background Canvas Particles ──
  const ambientCanvas = document.getElementById('ambient-canvas');
  if (ambientCanvas) {
    const actx = ambientCanvas.getContext('2d');
    let width = (ambientCanvas.width = window.innerWidth);
    let height = (ambientCanvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = ambientCanvas.width = window.innerWidth;
      height = ambientCanvas.height = window.innerHeight;
    });

    const particles = Array.from({ length: 32 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 8 + 4,
      speedX: (Math.random() - 0.5) * 0.6,
      speedY: Math.random() * 0.7 + 0.3,
      opacity: Math.random() * 0.5 + 0.25,
      type: Math.random() > 0.4 ? 'petal' : 'sparkle',
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 2
    }));

    function renderAmbient() {
      actx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotSpeed;

        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * width;
        }
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;

        actx.save();
        actx.translate(p.x, p.y);
        actx.rotate((p.rotation * Math.PI) / 180);
        actx.globalAlpha = p.opacity;

        if (p.type === 'petal') {
          actx.fillStyle = '#fda4af';
          actx.beginPath();
          actx.ellipse(0, 0, p.size, p.size * 1.6, 0.4, 0, Math.PI * 2);
          actx.fill();
        } else {
          actx.fillStyle = '#fde047';
          actx.beginPath();
          actx.arc(0, 0, p.size * 0.4, 0, Math.PI * 2);
          actx.fill();
        }
        actx.restore();
      });

      requestAnimationFrame(renderAmbient);
    }
    renderAmbient();
  }

  // ── Confetti Particle Engine ──
  const confettiCanvas = document.getElementById('confetti-canvas');
  let confettiParticles = [];
  let confettiAnimationId = null;

  function fireConfetti(count = 100) {
    if (!confettiCanvas) return;
    const cctx = confettiCanvas.getContext('2d');
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;

    const colors = ['#f43f5e', '#fb7185', '#f59e0b', '#c084fc', '#38bdf8', '#ffffff', '#ffd1dc'];

    for (let i = 0; i < count; i++) {
      confettiParticles.push({
        x: window.innerWidth / 2 + (Math.random() - 0.5) * 200,
        y: window.innerHeight * 0.65,
        vx: (Math.random() - 0.5) * 14,
        vy: -(Math.random() * 14 + 8),
        size: Math.random() * 9 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        gravity: 0.38,
        shape: Math.random() > 0.4 ? 'rect' : 'circle',
        opacity: 1
      });
    }

    if (!confettiAnimationId) {
      animateConfetti(cctx);
    }
  }

  function animateConfetti(cctx) {
    cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    for (let i = confettiParticles.length - 1; i >= 0; i--) {
      const p = confettiParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.99;
      p.rotation += p.rotSpeed;
      p.opacity -= 0.007;

      if (p.opacity <= 0 || p.y > confettiCanvas.height + 50) {
        confettiParticles.splice(i, 1);
        continue;
      }

      cctx.save();
      cctx.translate(p.x, p.y);
      cctx.rotate((p.rotation * Math.PI) / 180);
      cctx.globalAlpha = p.opacity;
      cctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        cctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
      } else {
        cctx.beginPath();
        cctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        cctx.fill();
      }
      cctx.restore();
    }

    if (confettiParticles.length > 0) {
      confettiAnimationId = requestAnimationFrame(() => animateConfetti(cctx));
    } else {
      confettiAnimationId = null;
      cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
  }

  document.getElementById('confetti-trigger-btn')?.addEventListener('click', () => {
    fireConfetti(120);
    playSparkleSound();
  });

  // ── Toast Messenger ──
  const toastEl = document.getElementById('toast');
  let toastTimer = null;
  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 2800);
  }

  // ── Stage Navigation State Machine ──
  function switchStage(stageId) {
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });
    const target = document.getElementById(stageId);
    if (target) {
      target.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // STAGE 1: BIRTHDAY VAULT DATE VERIFICATION (Must match 31.10.2006)
  // ═════════════════════════════════════════════════════════════════
  const inputDay = document.getElementById('input-day');
  const inputMonth = document.getElementById('input-month');
  const inputYear = document.getElementById('input-year');
  const btnUnlock = document.getElementById('btn-unlock');
  const vaultHint = document.getElementById('vault-hint');
  const vaultCard = document.querySelector('.vault-card');

  // Segment inputs auto-advance
  if (inputDay && inputMonth && inputYear) {
    inputDay.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 2);
      if (e.target.value.length === 2) {
        inputMonth.focus();
      }
      checkAutoSubmit();
    });

    inputMonth.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 2);
      if (e.target.value.length === 2) {
        inputYear.focus();
      }
      checkAutoSubmit();
    });

    inputMonth.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !inputMonth.value) {
        inputDay.focus();
      }
    });

    inputYear.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
      checkAutoSubmit();
    });

    inputYear.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !inputYear.value) {
        inputMonth.focus();
      }
    });

    // Enter key submits
    [inputDay, inputMonth, inputYear].forEach(inp => {
      inp.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') validateBirthday();
      });
    });
  }

  function checkAutoSubmit() {
    if (inputDay.value.length === 2 && inputMonth.value.length === 2 && inputYear.value.length === 4) {
      validateBirthday();
    }
  }

  function validateBirthday() {
    const day = inputDay.value.trim().padStart(2, '0');
    const month = inputMonth.value.trim().padStart(2, '0');
    const year = inputYear.value.trim();

    // The required secret date: 31.10.2006
    if (day === '31' && month === '10' && year === '2006') {
      vaultHint.textContent = '🎀 Richtige Identität bestätigt! Alles Gute Julia!';
      vaultHint.style.color = '#22c55e';
      playSuccessChime();
      fireConfetti(140);

      setTimeout(() => {
        switchStage('stage-celebration');
        fireConfetti(80);
      }, 750);
    } else {
      // Wrong date: playful error hint & shake
      vaultCard.classList.remove('shake');
      void vaultCard.offsetWidth; // force reflow
      vaultCard.classList.add('shake');

      vaultHint.textContent = 'Oopsie! Nur das echte Geburtstagskind darf hinein... 🎂';
      vaultHint.style.color = '#e11d48';
      showToast('Tipp: Wann feiert Julia ihren Ehrentag? 🎀 (31.10.2006)');
    }
  }

  btnUnlock?.addEventListener('click', validateBirthday);

  // ═════════════════════════════════════════════════════════════════
  // STAGE 2: CAKE ANIMATION & CANDLE BLOW OUT
  // ═════════════════════════════════════════════════════════════════
  const cakeScene = document.getElementById('cake-scene');
  const btnBlowCandles = document.getElementById('btn-blow-candles');
  const cakePrompt = document.getElementById('cake-prompt');
  const btnGoToCall = document.getElementById('btn-trigger-call');
  let candlesExtinguished = false;

  function blowOutCandles() {
    if (candlesExtinguished) {
      // Re-light option
      cakeScene.classList.remove('candles-out');
      candlesExtinguished = false;
      cakePrompt.innerHTML = '✨ Puste die Kerzen aus oder tippe darauf! 🕯️';
      showToast('Kerzen wieder angezündet! Wünsch dir noch was! 🕯️');
      return;
    }

    candlesExtinguished = true;
    cakeScene.classList.add('candles-out');
    playSparkleSound();
    fireConfetti(160);

    cakePrompt.innerHTML = '🎉 Dein Wunsch ist auf dem Weg ins Universum! ✨';
    showToast('Wunsch abgegeben! 🌟');

    // Auto-prompt incoming call after 3 seconds if not clicked
    setTimeout(() => {
      btnGoToCall?.classList.add('btn-bounce-call');
    }, 1800);
  }

  cakeScene?.addEventListener('click', blowOutCandles);
  btnBlowCandles?.addEventListener('click', blowOutCandles);

  btnGoToCall?.addEventListener('click', () => {
    switchStage('stage-call');
    startPhoneRing();
  });

  // ═════════════════════════════════════════════════════════════════
  // STAGE 3: INCOMING FACETIME CALL SCREEN
  // ═════════════════════════════════════════════════════════════════
  const btnDeclineCall = document.getElementById('btn-decline-call');
  const btnAcceptCall = document.getElementById('btn-accept-call');
  const phoneCard = document.querySelector('.phone-modal-card');

  btnDeclineCall?.addEventListener('click', () => {
    phoneCard.classList.remove('shake');
    void phoneCard.offsetWidth;
    phoneCard.classList.add('shake');
    showToast('Hey! Am Geburtstag wird nicht weggedrückt! 😜 Drück auf Grün 🟢');
  });

  btnAcceptCall?.addEventListener('click', () => {
    stopPhoneRing();
    playConnectedSound();
    showToast('Anruf verbunden... 💕');

    setTimeout(() => {
      switchStage('stage-video');
      startCallTimer();
      // Ensure iframe autoplays
      const iframe = document.getElementById('yt-player');
      if (iframe && !iframe.src.includes('autoplay=1')) {
        iframe.src += '&autoplay=1';
      }
    }, 450);
  });

  // ═════════════════════════════════════════════════════════════════
  // STAGE 4: YOUTUBE SHORT VIDEO THEATER & FACETIME
  // ═════════════════════════════════════════════════════════════════
  const callTimerEl = document.getElementById('call-timer');
  const btnEndCall = document.getElementById('btn-end-call');
  let callTimerInterval = null;
  let callSeconds = 0;

  function startCallTimer() {
    callSeconds = 0;
    if (callTimerInterval) clearInterval(callTimerInterval);
    callTimerInterval = setInterval(() => {
      callSeconds++;
      const mins = String(Math.floor(callSeconds / 60)).padStart(2, '0');
      const secs = String(callSeconds % 60).padStart(2, '0');
      if (callTimerEl) callTimerEl.textContent = `${mins}:${secs}`;
    }, 1000);
  }

  btnEndCall?.addEventListener('click', () => {
    if (callTimerInterval) clearInterval(callTimerInterval);
    switchStage('stage-lounge');
    fireConfetti(100);
    showToast('Willkommen in Julias Geburtstags-Lounge! 💌');
  });

  // ═════════════════════════════════════════════════════════════════
  // STAGE 5: THE COMPLETE BIRTHDAY LOUNGE & EXTRAS
  // ═════════════════════════════════════════════════════════════════

  // Letter Modal with Native <dialog> (Complies with Modern Web Guidance)
  const letterCard = document.getElementById('open-letter-card');
  const letterDialog = document.getElementById('letter-dialog');

  letterCard?.addEventListener('click', () => {
    playSuccessChime();
    if (typeof letterDialog?.showModal === 'function') {
      letterDialog.showModal();
    }
  });

  // Light dismiss for dialog fallback as per modern-web-guidance
  if (letterDialog) {
    letterDialog.addEventListener('click', (e) => {
      const rect = letterDialog.getBoundingClientRect();
      const isInDialog = (
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width
      );
      if (!isInDialog) {
        letterDialog.close();
      }
    });
  }

  // Fortune Cookie / Compliment Generator
  const btnFortune = document.getElementById('btn-fortune-cookie');
  const fortuneDisplay = document.getElementById('fortune-display');

  const fortunes = [
    '✨ Prophezeiung: Dein 20. Lebensjahr wird das glücklichste, magischste und erfolgreichste bisher!',
    '💖 Fakt: Niemand rockt diesen Geburtstag so wie du! Bleib genau so herzlich und wunderbar.',
    '🍰 Tagesregel: Mindestens zwei Stücke Geburtstagstorte essen – heute zählen keine Kalorien!',
    '🌟 Glückskeks: Ein großer Herzenswunsch von dir wird schneller wahr als du denkst.',
    '🥂 Kosmischer Rat: Tanze heute, lache laut und lass dich von jedem auf Händen tragen!',
    '🎀 Kompliment: Du strahlst mehr Positivität aus als ein ganzes Feuerwerk!'
  ];

  let lastFortuneIndex = -1;
  btnFortune?.addEventListener('click', () => {
    playSparkleSound();
    fireConfetti(40);

    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * fortunes.length);
    } while (nextIndex === lastFortuneIndex && fortunes.length > 1);

    lastFortuneIndex = nextIndex;
    if (fortuneDisplay) {
      fortuneDisplay.style.opacity = 0;
      setTimeout(() => {
        fortuneDisplay.textContent = fortunes[nextIndex];
        fortuneDisplay.style.opacity = 1;
      }, 150);
    }
  });

  // Navigation back buttons from lounge
  document.getElementById('nav-to-cake')?.addEventListener('click', () => {
    switchStage('stage-celebration');
  });

  document.getElementById('nav-to-video')?.addEventListener('click', () => {
    switchStage('stage-video');
  });

  document.getElementById('nav-to-lock')?.addEventListener('click', () => {
    switchStage('stage-vault');
  });
});
