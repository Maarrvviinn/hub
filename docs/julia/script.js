/**
 * JULIA'S BIRTHDAY SITE — MOBILE FIRST LOGIC
 */

document.addEventListener('DOMContentLoaded', () => {

  // ═════════════════════════════════════════════════════════════════
  // CHECK: AB DEM 1.11. NICHT MEHR AUFRUFBAR
  // ═════════════════════════════════════════════════════════════════
  const now = new Date();
  // getMonth() ist 0-basiert: 0=Januar ... 9=Oktober, 10=November, 11=Dezember
  const isExpired = now.getMonth() >= 10 || now.getFullYear() > 2026;

  if (isExpired) {
    document.querySelectorAll('.screen').forEach(s => {
      s.classList.remove('active');
      s.style.display = 'none';
    });
    const expScreen = document.getElementById('screen-expired');
    if (expScreen) {
      expScreen.style.display = 'flex';
      expScreen.classList.add('active');
    }
    return; // Weitere Ausführung stoppen
  }

  // ── Web Audio Synthesizer (Zero External Audio Dependencies) ──
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  function resumeAudio() {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSuccessChime() {
    resumeAudio();
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.07);

      gain.gain.setValueAtTime(0, audioCtx.currentTime + idx * 0.07);
      gain.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + idx * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.07 + 0.5);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(audioCtx.currentTime + idx * 0.07);
      osc.stop(audioCtx.currentTime + idx * 0.07 + 0.55);
    });
  }

  // Phone Ringtone (Synthesized Marimba)
  let ringInterval = null;
  function startPhoneRing() {
    resumeAudio();
    stopPhoneRing();

    function ring() {
      const seq = [
        { f: 1046.5, t: 0.0 },
        { f: 880.0,  t: 0.12 },
        { f: 1046.5, t: 0.24 },
        { f: 1318.5, t: 0.36 },
        { f: 1046.5, t: 0.52 },
        { f: 880.0,  t: 0.64 }
      ];

      seq.forEach(n => {
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

    ring();
    ringInterval = setInterval(ring, 1800);
  }

  function stopPhoneRing() {
    if (ringInterval) {
      clearInterval(ringInterval);
      ringInterval = null;
    }
  }

  function playConnectSound() {
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

  // ── Confetti Particle Cannon ──
  const confettiCanvas = document.getElementById('confetti-canvas');
  let confettiParticles = [];
  let confettiId = null;

  function fireConfetti(count = 90) {
    if (!confettiCanvas) return;
    const ctx = confettiCanvas.getContext('2d');
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;

    const colors = ['#f43f5e', '#fb7185', '#f59e0b', '#c084fc', '#38bdf8', '#ffffff', '#ffd1dc'];

    for (let i = 0; i < count; i++) {
      confettiParticles.push({
        x: window.innerWidth / 2 + (Math.random() - 0.5) * 160,
        y: window.innerHeight * 0.55,
        vx: (Math.random() - 0.5) * 12,
        vy: -(Math.random() * 12 + 6),
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        gravity: 0.35,
        opacity: 1
      });
    }

    if (!confettiId) {
      function anim() {
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

        for (let i = confettiParticles.length - 1; i >= 0; i--) {
          const p = confettiParticles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.gravity;
          p.rotation += p.rotSpeed;
          p.opacity -= 0.008;

          if (p.opacity <= 0 || p.y > confettiCanvas.height + 40) {
            confettiParticles.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
          ctx.restore();
        }

        if (confettiParticles.length > 0) {
          confettiId = requestAnimationFrame(anim);
        } else {
          confettiId = null;
          ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        }
      }
      anim();
    }
  }

  // ── Toast Note ──
  const toast = document.getElementById('toast-note');
  let toastTimer = null;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2400);
  }

  // ── Stage Switching ──
  function setScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');
  }

  // ═════════════════════════════════════════════════════════════════
  // SCREEN 1: GEBURTSTAGSEINGABE (31.10.2006)
  // ═════════════════════════════════════════════════════════════════
  const inDay = document.getElementById('in-day');
  const inMonth = document.getElementById('in-month');
  const inYear = document.getElementById('in-year');
  const btnConfirm = document.getElementById('btn-confirm-date');
  const lockError = document.getElementById('lock-error');
  const cardLock = document.querySelector('.card-lock');

  // Auto-advance inputs on mobile
  if (inDay && inMonth && inYear) {
    inDay.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 2);
      if (e.target.value.length === 2) inMonth.focus();
    });

    inMonth.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 2);
      if (e.target.value.length === 2) inYear.focus();
    });

    inMonth.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !inMonth.value) inDay.focus();
    });

    inYear.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
    });

    inYear.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !inYear.value) inMonth.focus();
    });

    [inDay, inMonth, inYear].forEach(inp => {
      inp.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') checkBirthday();
      });
    });
  }

  function checkBirthday() {
    const d = inDay.value.trim().padStart(2, '0');
    const m = inMonth.value.trim().padStart(2, '0');
    const y = inYear.value.trim();

    if (d === '31' && m === '10' && y === '2006') {
      lockError.textContent = '';
      playSuccessChime();
      fireConfetti(100);

      setTimeout(() => {
        setScreen('screen-cake');
        fireConfetti(80);
      }, 400);
    } else {
      cardLock.classList.remove('shake');
      void cardLock.offsetWidth;
      cardLock.classList.add('shake');
      lockError.textContent = 'Falsches Datum';
    }
  }

  btnConfirm?.addEventListener('click', checkBirthday);

  // ═════════════════════════════════════════════════════════════════
  // SCREEN 2: KUCHEN & ALLES GUTE
  // ═════════════════════════════════════════════════════════════════
  const cakeInteractive = document.getElementById('cake-interactive');
  const btnNextCall = document.getElementById('btn-next-call');
  let candlesOut = false;

  function toggleCandles() {
    if (candlesOut) {
      cakeInteractive.classList.remove('candles-extinguished');
      candlesOut = false;
      return;
    }
    candlesOut = true;
    cakeInteractive.classList.add('candles-extinguished');
    playSuccessChime();
    fireConfetti(120);
  }

  cakeInteractive?.addEventListener('click', toggleCandles);

  btnNextCall?.addEventListener('click', () => {
    setScreen('screen-call');
    startPhoneRing();
  });

  // ═════════════════════════════════════════════════════════════════
  // SCREEN 3: EINGEHENDER ANRUF (iPhone FaceTime Style)
  // ═════════════════════════════════════════════════════════════════
  const btnDecline = document.getElementById('btn-decline');
  const btnAccept = document.getElementById('btn-accept');
  const callScreen = document.querySelector('.iphone-call-screen');

  btnDecline?.addEventListener('click', () => {
    callScreen.classList.remove('shake');
    void callScreen.offsetWidth;
    callScreen.classList.add('shake');
    showToast('Geh ran jetzt 😂');
  });

  btnAccept?.addEventListener('click', () => {
    stopPhoneRing();
    playConnectSound();

    setTimeout(() => {
      setScreen('screen-video');
      startTimer();
      // Unmute/play YouTube short
      const frame = document.getElementById('yt-frame');
      if (frame && !frame.src.includes('autoplay=1')) {
        frame.src += '&autoplay=1';
      }
    }, 350);
  });

  // ═════════════════════════════════════════════════════════════════
  // SCREEN 4: YOUTUBE SHORT VIDEO
  // ═════════════════════════════════════════════════════════════════
  const timerEl = document.getElementById('call-counter');
  const btnReplayCake = document.getElementById('btn-replay-cake');
  let timerInterval = null;
  let seconds = 1;

  function startTimer() {
    seconds = 1;
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      seconds++;
      const m = String(Math.floor(seconds / 60)).padStart(2, '0');
      const s = String(seconds % 60).padStart(2, '0');
      if (timerEl) timerEl.textContent = `${m}:${s}`;
    }, 1000);
  }

  btnReplayCake?.addEventListener('click', () => {
    if (timerInterval) clearInterval(timerInterval);
    setScreen('screen-cake');
  });

});
