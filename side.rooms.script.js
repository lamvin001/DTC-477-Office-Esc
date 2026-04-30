/*
  ═══════════════════════════════════════════════════════════════
  OFFICE ESC — side.rooms.script.js
  Puzzle logic for rooms 4–5 and the end quiz:
    Room 4 — Fire Room   (fill buckets → faucet → throw on fire)
    Room 5 — Whiteboard  (click the correct word object)
    Room 6 — End / Quiz  (3-question sudden quiz)

  LOGIC STEPS:
  - Room 4: Three-step loop per bucket: (1) click a bucket to grab
    it (fireStep → 1), (2) click the faucet to fill it (fireStep → 2),
    (3) click the fire to throw it (fireStep → 0, fireRound++).
    After FIRE_ROUNDS (3) throws the fire opacity fades to 0 and
    G.waterDone is set. nudgeNextRoom() fires on completion.
  - Room 5: pickWb() checks the clicked object's word against 'TIME'.
    Correct → sets G.hasKey = true, updates inventory, shows modal,
    and calls nudgeNextRoom(). Wrong → brief red flash + revert.
  - Room 6: startQuiz() initialises the index and calls showQuestion().
    answerQuestion() compares chosen vs q.answer. Correct advances;
    wrong calls failQuiz() which shows the denied overlay (fully
    black background, z-index above the quiz layer).
  ═══════════════════════════════════════════════════════════════
*/



// ─────────────────────────────────────────────────────────
// ROOM 4 — FIRE ROOM
// ─────────────────────────────────────────────────────────

let fireStep  = 0;
let fireRound = 0;
const FIRE_ROUNDS = 3;

function buildBuckets() {
  G.bucketsFilled = Array(TOTAL_BUCKETS).fill(false);
  G.bucketCount   = 0;
  G.faucetOff     = false;
  G.waterDone     = false;
  fireStep        = 0;
  fireRound       = 0;

  const fire = document.getElementById('puddle-overlay');
  if (fire) fire.style.opacity = '1';

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
  if (G.waterDone) return;

  if (G.bucketsFilled[index]) {
    showToast('This bucket is already filled.');
    return;
  }
  if (fireStep !== 0) {
    showToast(fireStep === 1
      ? 'Now fill it at the water cooler.'
      : 'Now throw the water on the fire!');
    return;
  }

  G.bucketsFilled[index] = true;
  G.bucketCount++;
  document.getElementById(`bucket-${index}`).classList.add('filled');
  fireStep = 1;
  showToast('Bucket grabbed. Now fill it at the water cooler.');
}

function clickFaucet() {
  if (G.waterDone) return;
  if (fireStep !== 1) {
    showToast(fireStep === 0
      ? 'Grab a bucket first.'
      : 'Now throw the water on the fire!');
    return;
  }

  fireStep = 2;
  showToast('Bucket filled! Now throw it on the fire.');
}

function clickFire() {
  if (G.waterDone) return;
  if (fireStep !== 2) {
    showToast(fireStep === 0
      ? 'Grab a bucket first.'
      : 'Fill the bucket at the water cooler first.');
    return;
  }

  fireRound++;
  fireStep = 0;

  const fire = document.getElementById('puddle-overlay');

  if (fireRound >= FIRE_ROUNDS) {
    // Fire is fully extinguished
    G.waterDone = true;
    G.faucetOff = true;
    document.getElementById('faucet-hs').classList.add('off');
    document.getElementById('fire-hs').style.pointerEvents = 'none';
    if (fire) fire.style.opacity = '0';
    showToast('The fire is out. The exit is clear.');
    nudgeNextRoom(3200);
  } else {
    // Partial — reduce opacity proportionally
    if (fire) fire.style.opacity = String(1 - (fireRound / FIRE_ROUNDS));
    showToast(`Fire weakening... ${fireRound} / ${FIRE_ROUNDS} buckets thrown.`);
  }
}


// ─────────────────────────────────────────────────────────
// ROOM 5 — WHITEBOARD ROOM
// ─────────────────────────────────────────────────────────

const WB_ITEMS = ['wbo-clock', 'wbo-window', 'wbo-folder'];

function resetWhiteboard() {
  G.wbDone = false;
  document.getElementById('wb-blank-text').textContent = '';
  WB_ITEMS.forEach(id => document.getElementById(id).classList.remove('sel'));
}

function pickWb(word, id) {
  if (G.wbDone) return;
  WB_ITEMS.forEach(btnId => {
    document.getElementById(btnId).classList.remove('sel', 'sel-wrong');
  });

  if (word === 'TIME') {
    document.getElementById(id).classList.add('sel');
    document.getElementById('wb-blank-text').textContent = word;
    G.wbDone  = true;
    G.hasKey  = true;
    updateInventory();
    setTimeout(() => {
      showModal('CORRECT',
        'Watchers see everything, but they cannot see TIME. ' +
        'A key drops from behind the eraser tray. ' +
        'You now have a key. Use it to unlock the drawer in the first room.');
    }, 400);
    nudgeNextRoom(3200);

  } else {
    // Wrong answer — flash red then revert
    document.getElementById(id).classList.add('sel-wrong');
    document.getElementById('wb-blank-text').textContent = word;
    setTimeout(() => {
      showToast('That does not feel right.');
      document.getElementById(id).classList.remove('sel-wrong');
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
    const btn       = document.createElement('button');
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
    // Reveal the correct answer
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
  document.getElementById('denied-msg').textContent =
    'You were unable to get through the sudden and inane quiz that was thrown at you when ' +
    'you entered the final room. Before you knew it, more shutters closed down over the only ' +
    'way in and out. Trapped. Just like your brother. What now? A third person gets roped into ' +
    'this? You can only hope they do better than you did.';
  document.getElementById('denied-inv').innerHTML =
    '<p style="color:#cc4444;margin-top:8px;">YOU FAILED.</p>';
  document.getElementById('denied-ov').classList.add('on');
}