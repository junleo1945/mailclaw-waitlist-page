/* ===== Glow mouse-follow ===== */
(function() {
  const container = document.getElementById('glow-container');
  if (!container) return;
  const parent = container.parentElement;

  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;
  let rafId = null;

  parent.addEventListener('mousemove', e => {
    const rect = parent.getBoundingClientRect();
    targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 60;
    targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 40;
    if (!rafId) rafId = requestAnimationFrame(animate);
  });

  parent.addEventListener('mouseleave', () => {
    targetX = 0;
    targetY = 0;
    if (!rafId) rafId = requestAnimationFrame(animate);
  });

  function animate() {
    currentX += (targetX - currentX) * 0.06;
    currentY += (targetY - currentY) * 0.06;

    container.style.transform = `translate(${currentX}px, ${currentY}px)`;

    if (Math.abs(targetX - currentX) > 0.1 || Math.abs(targetY - currentY) > 0.1) {
      rafId = requestAnimationFrame(animate);
    } else {
      rafId = null;
    }
  }
})();

/* ===== Terminal Typing Animation ===== */
let typingAnimationId = null;
let waitlistCount = 718;

function startTypingAnimation(userEmail) {
  // 清空之前的内容
  const lineElements = ['line1', 'line2', 'line3', 'line4', 'line5'];
  lineElements.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });

  // 动态生成打字内容
  const newCount = waitlistCount + 1;
  const lines = [
    `mailclaw --register "${userEmail}"`,
    '✓ Registration successful',
    '[inbox] Received email from Mailclaw.io',
    '  └─ welcome to the new world',
    `you are now on the waitlist [${newCount}/1000]`
  ];

  let currentLine = 0;
  let currentChar = 0;

  function typeNextChar() {
    if (currentLine >= lines.length) {
      waitlistCount = newCount;
      return;
    }

    const element = document.getElementById(lineElements[currentLine]);
    const text = lines[currentLine];

    if (currentChar < text.length) {
      element.textContent += text[currentChar];
      currentChar++;
      typingAnimationId = setTimeout(typeNextChar, 40);
    } else {
      currentLine++;
      currentChar = 0;
      typingAnimationId = setTimeout(typeNextChar, 250);
    }
  }

  // 延迟开始打字
  typingAnimationId = setTimeout(typeNextChar, 400);
}

function stopTypingAnimation() {
  if (typingAnimationId) {
    clearTimeout(typingAnimationId);
    typingAnimationId = null;
  }
}

/* ===== Waitlist form ===== */
const form = document.getElementById('waitlist-form');
const modal = document.getElementById('success-modal');
const modalClose = document.getElementById('modal-close');

form.addEventListener('submit', async e => {
  e.preventDefault();
  const input = document.getElementById('email-input');
  const email = input.value.trim();
  if (!email) return;

  const btn = form.querySelector('.submit-btn');
  btn.disabled = true;
  btn.style.opacity = '.5';

  try {
    // Send email to Cloudflare Pages Function endpoint
    const response = await fetch('/api/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    // Check if the request was successful
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Success! Show animations and modal
    btn.disabled = false;
    btn.style.opacity = '1';
    input.value = '';

    // Show modal
    modal.classList.add('show');

    // Start confetti
    launchConfetti();

    // Start typing animation with user email
    startTypingAnimation(email);
  } catch (error) {
    console.error('Submission failed:', error);
    alert('Oops! Something went wrong. Please try again.');
    btn.disabled = false;
    btn.style.opacity = '1';
  }
});

// Close modal
modalClose.addEventListener('click', () => {
  modal.classList.remove('show');
  stopTypingAnimation();
});

modal.addEventListener('click', e => {
  if (e.target === modal) {
    modal.classList.remove('show');
    stopTypingAnimation();
  }
});

/* ===== Confetti Effect ===== */
function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4'];
  const shapes = ['square', 'circle', 'strip'];

  // Create particles
  for (let i = 0; i < 150; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 25,
      vy: (Math.random() - 0.5) * 25 - 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      size: Math.random() * 8 + 4,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      gravity: 0.3,
      friction: 0.99,
      opacity: 1
    });
  }

  let animationId;

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let activeParticles = 0;

    particles.forEach(p => {
      if (p.opacity <= 0) return;
      activeParticles++;

      p.vy += p.gravity;
      p.vx *= p.friction;
      p.vy *= p.friction;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;

      // Fade out when near bottom
      if (p.y > canvas.height * 0.8) {
        p.opacity -= 0.02;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation * Math.PI / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;

      if (p.shape === 'square') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      }

      ctx.restore();
    });

    if (activeParticles > 0) {
      animationId = requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animationId);
    }
  }

  animate();

  // Second burst after a small delay
  setTimeout(() => {
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -20,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 5 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        size: Math.random() * 6 + 3,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        gravity: 0.2,
        friction: 0.99,
        opacity: 1
      });
    }
  }, 300);
}
