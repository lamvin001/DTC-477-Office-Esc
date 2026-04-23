// ─────────────────────────────────────────────────────────
// ROOM 4 — WATER ROOM
// ─────────────────────────────────────────────────────────

function buildBuckets() {
  G.bucketsFilled = Array(TOTAL_BUCKETS).fill(false);
  G.bucketCount   = 0;
  G.faucetOff     = false;
  G.waterDone     = false;

  document.getElementById('puddle-overlay').style.opacity = '1';

  const faucet = document.getElementById('faucet-hs');
  if (faucet) {
    faucet.classList.remove('off');
    faucet.style.pointerEvents = '';
  }

  for (let i = 0; i < TOTAL_BUCKETS; i++) {
    const el = document.getElementById(`bucket-${i}`);
    if (el) el.classList.remove('filled');
  }
}

function clickBucket(index) {
  if (G.bucketsFilled[index]) return;
  if (G.faucetOff) {
    showToast('The faucet is off. No water to collect.');
    return;
  }

  G.bucketsFilled[index] = true;
  G.bucketCount++;
  document.getElementById(`bucket-${index}`).classList.add('filled');

  if (G.bucketCount === TOTAL_BUCKETS) {
    showToast('All buckets filled. Now turn off the faucet.');
  } else {
    showToast(`Bucket filled. ${G.bucketCount} / ${TOTAL_BUCKETS}`);
  }
}

function clickFaucet() {
  if (G.faucetOff) {
    showToast('Already off.');
    return;
  }
  if (G.bucketCount < TOTAL_BUCKETS) {
    showToast(`Fill all ${TOTAL_BUCKETS} buckets first.`);
    return;
  }

  G.faucetOff = true;
  G.waterDone = true;
  document.getElementById('faucet-hs').classList.add('off');
  document.getElementById('puddle-overlay').style.opacity = '0';
  showToast('Faucet off. The flood subsides.');
}


// ─────────────────────────────────────────────────────────
// ROOM 5 — WHITEBOARD ROOM
// ─────────────────────────────────────────────────────────

const WB_ITEMS = ['wbo-clock', 'wbo-window', 'wbo-folder'];

function resetWhiteboard() {
  G.wbDone = false;
  document.getElementById('wb-blank-text').textContent = '';

  WB_ITEMS.forEach(id => {
    document.getElementById(id).classList.remove('sel');
  });
}

function pickWb(word, id) {
  if (G.wbDone) return;

  WB_ITEMS.forEach(btnId => {
    document.getElementById(btnId).classList.remove('sel');
  });
  document.getElementById(id).classList.add('sel');
  document.getElementById('wb-blank-text').textContent = word;

  if (word === 'TIME') {
    G.wbDone = true;
    G.hasKey = true;
    updateInventory();
    setTimeout(() => {
      showModal('CORRECT',
        'Watchers see everything, but they cannot see TIME. ' +
        'A key drops from behind the eraser tray. ' +
        'You now have a key. Use it to unlock the drawer in the first room.');
    }, 400);

  } else {
    setTimeout(() => {
      showToast('That does not feel right.');
      document.getElementById(id).classList.remove('sel');
      document.getElementById('wb-blank-text').textContent = '';
    }, 900);
  }
}


// ─────────────────────────────────────────────────────────
// ROOM 6 — END / QUIZ
// ─────────────────────────────────────────────────────────

function startQuiz() {
  G.quizIdx    = 0;
  G.quizFailed = false;
  showQuestion();
}

function showQuestion() {
  const q = QUIZ[G.quizIdx];

  document.getElementById('quiz-num').textContent = `Question ${G.quizIdx + 1} of ${QUIZ.length}`;
  document.getElementById('quiz-q').textContent   = q.question;
  document.getElementById('quiz-fb').textContent  = '';
  document.getElementById('quiz-fb').style.color  = '';

  const optsDiv = document.getElementById('quiz-opts');
  optsDiv.innerHTML = '';

  q.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className   = 'qopt';
    btn.textContent = opt;
    btn.onclick     = () => answerQuestion(opt, btn);
    optsDiv.appendChild(btn);
  });
}

function answerQuestion(chosen, btn) {
  const q       = QUIZ[G.quizIdx];
  const correct = (chosen === q.answer);

  document.querySelectorAll('.qopt').forEach(b => { b.onclick = null; });

  if (correct) {
    btn.classList.add('correct-flash');
    document.getElementById('quiz-fb').textContent = 'Correct.';
    document.getElementById('quiz-fb').style.color = '#6fec7f';
    setTimeout(nextQuestion, 1000);

  } else {
    btn.classList.add('wrong-flash');

    document.querySelectorAll('.qopt').forEach(b => {
      if (b.textContent === q.answer) b.classList.add('correct-flash');
    });

    document.getElementById('quiz-fb').textContent = `Wrong. The answer was: ${q.answer}`;
    document.getElementById('quiz-fb').style.color = '#ff8080';
    setTimeout(failQuiz, 1800);
  }
}

function nextQuestion() {
  G.quizIdx++;
  if (G.quizIdx < QUIZ.length) {
    showQuestion();
  } else {
    setTimeout(() => showScreen('screen-outro'), 800);
  }
}

function failQuiz() {
  G.quizFailed = true;
  document.getElementById('denied-msg').textContent = 'You were unable to get through the sudden and inane quiz that was thrown at you when you entered the final room. Before you knew it, more shutters closed down over the only way in and out. Trapped. Just like your brother. What now? A third person gets roped into this? You can only hope they do better than you did.';
  document.getElementById('denied-inv').innerHTML   = '<p style="color:#cc4444;margin-top:8px;">YOU FAILED.</p>';
  document.getElementById('denied-ov').classList.add('on');
}