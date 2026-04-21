// CHAT URLS

/* OFFICE ESC — SETUP

  SECTIONS:
  1. SETUP      — constants and game state
  2. SCREENS    — show/hide intro, game, outro
  3. NAVIGATION — move between rooms
  4. INVENTORY  — keycards and key
  5. PHONE      — chat bubbles
  6. HELPERS    — modal, toast, access denied
*/



// ─────────────────────────────────────────────────────────
// 1. SETUP
// ─────────────────────────────────────────────────────────

const ROOMS = ['r-cubicle', 'r-paper', 'r-updown', 'r-chairs', 'r-water', 'r-wb', 'r-end'];

const TOTAL_KEYCARDS = 3;
const TOTAL_CHAIRS   = 14;
const ODD_PAPER      = 16;
const TOTAL_BUCKETS  = 6;
const TOTAL_UD_ITEMS = 5;

const QUIZ = [
  { question: 'How many chairs did you stack?',      options: ['10','12','14','16'], answer: '14'   },
  { question: 'How many buckets did you fill?',      options: ['4','5','6','8'],    answer: '6'    },
  { question: 'What word completed the whiteboard?', options: ['OUT','TRUTH','TIME','SPACE'], answer: 'TIME' }
];

const PAPERS = [
  [5,68,6,12],[10,76,6,12],[16,70,6,12],[8,83,6,11],[22,72,5,11],
  [27,63,5,10],[32,74,5,10],[30,83,5,10],[37,68,5,11],[42,58,5,10],
  [43,72,5,10],[48,64,5,10],[51,76,5,10],[53,60,5,10],[56,72,5,10],
  [58,82,5,10],
  [55,60,6,11],  // the ! paper (has keycard)
  [63,74,5,10],[67,66,5,10],[70,76,5,10],[74,60,5,10],[76,72,5,10],
  [80,66,5,10],[83,76,5,10],[87,56,5,10],[89,66,5,10],[91,74,5,10],[93,82,5,10]
];

const CHAIRS = [
[15,70,10,26,0,1],
[15,10,10,26,60,1],
[23,47,10,26,0,-1],
[30,70,10,30,270,1],
[35,10,8,24,90,-1],
[37,45,10,26,0,1],
[45,30,8,24,180,-1],
[50,50,10,26,0,-1],
[55,5,10,26,330,1],
[65,30,8,24,45,1],
[65,50,8,24,225,-1],
[65,60,10,26,0,1],
[70,0,8,24,180,1],
[75,48,8,24,90,-1],
[80,57,10,30,0,-1]
]; // [left, top, width, height, rotation {0 = normal, 180 = upsidedown, 90 = sideways}, flip {1 = normal, -1 flipped}]

const BUCKETS = [
  [55,40,12,19],[67,41,12,19],[50,54,12,19],[62,55,12,19],[55,67,11,18],[66,68,11,18]
];

const UD_ITEMS = ['ud-lamp1','ud-lamp2','ud-desk','ud-cabinet','ud-desklamp'];

let G = {};

function resetGame() {
  G = {
    room:          0,
    keycards:      0,
    hasKey:        false,
    keyUsed:       false,
    phonePickedUp: false,
    paperDone:     false,
    udCount:       0,
    udDone:        false,
    chairCount:    0,
    chairsDone:    false,
    bucketsFilled: Array(TOTAL_BUCKETS).fill(false),
    bucketCount:   0,
    faucetOff:     false,
    waterDone:     false,
    wbDone:        false,
    messages:      [],
    visited:       [],
    quizIdx:       0,
    quizFailed:    false
  };
}


// ─────────────────────────────────────────────────────────
// 2. SCREENS
// ─────────────────────────────────────────────────────────

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
  });
  document.getElementById(id).classList.add('active');
}

function startGame() {
  resetGame();
  buildPapers();
  resetChairs();
  buildBuckets();
  resetWhiteboard();
  resetUpsideDown();

  document.getElementById('ph-msgs').innerHTML =
    '<div class="bbl placeholder">Pick up the phone...</div>';

  document.getElementById('hs-phone').style.display = '';
  document.getElementById('hs-drawer').style.pointerEvents = '';

  showScreen('screen-game');
  goToRoom(0);
  updateInventory();
}

function replayGame() { window.location.reload(); }


// ─────────────────────────────────────────────────────────
// 3. NAVIGATION
// ─────────────────────────────────────────────────────────

function goToRoom(index) {
  G.room = index;

  document.querySelectorAll('.room').forEach(r => {
    r.classList.remove('active');
  });

  document.getElementById(ROOMS[index]).classList.add('active');

  updateArrows();
  onEnterRoom(ROOMS[index]);
}

function updateArrows() {
  document.getElementById('btn-back').classList.toggle('dim', G.room === 0);
  document.getElementById('btn-fwd').classList.toggle('dim', G.room >= ROOMS.length - 1);
}

function navBack() {
  if (G.room > 0) goToRoom(G.room - 1);
}

function navFwd() {
  const next = G.room + 1;
  if (next >= ROOMS.length) return;

  if (ROOMS[next] === 'r-end' && G.keycards < TOTAL_KEYCARDS) {
    showDenied();
    return;
  }
  goToRoom(next);
}

function onEnterRoom(roomId) {
  if (!G.phonePickedUp) return;

  if (!G.visited.includes(roomId)) {
    G.visited.push(roomId);

    const hints = {
      'r-paper':  'An odd one out wants nothing more than to blend in.',
      'r-updown': 'The world is not always right side up.',
      'r-chairs': 'An ordinary seat longs to reach for the heavens.',
      'r-water':  'Fill what is empty. Stop what flows.',
      'r-wb':     'The ever present force that marches forward.',
      'r-end':    'Good day to you, friend. But I must leave. The signal is getting spotty.'
    };

    if (hints[roomId]) sendMessage('them', hints[roomId]);
  }

  if (roomId === 'r-end') {
    setTimeout(startQuiz, 300);
  }
}


// ─────────────────────────────────────────────────────────
// 4. INVENTORY
// ─────────────────────────────────────────────────────────

function updateInventory() {
  for (let i = 0; i < TOTAL_KEYCARDS; i++) {
    const slot = document.getElementById('kc' + i);
    if (i < G.keycards) {
      slot.classList.add('kc-filled');
      slot.textContent = '';
    } else {
      slot.classList.remove('kc-filled');
      slot.textContent = 'SLOT';
    }
  }

  const keySlot = document.getElementById('key-slot');
  if (G.hasKey) {
    keySlot.classList.add('key-filled');
    keySlot.innerHTML = '<img src="img/key.png" alt="key"> <span>KEY</span>';
  } else {
    keySlot.classList.remove('key-filled');
    keySlot.innerHTML = '<span>KEY</span>';
  }
}

function addKeycard() {
  if (G.keycards >= TOTAL_KEYCARDS) return;
  G.keycards++;
  updateInventory();
  showToast(`Keycard ${G.keycards} of ${TOTAL_KEYCARDS} obtained.`);
}


// ─────────────────────────────────────────────────────────
// 5. PHONE
// ─────────────────────────────────────────────────────────

function sendMessage(who, text) {
  const last = G.messages[G.messages.length - 1];
  if (last && last.text === text) return;

  G.messages.push({ who, text });

  const container = document.getElementById('ph-msgs');
  const bubble    = document.createElement('div');
  bubble.className   = `bbl ${who === 'them' ? 'bbl-t' : 'bbl-y'}`;
  bubble.textContent = text;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}


// ─────────────────────────────────────────────────────────
// 6. HELPERS
// ─────────────────────────────────────────────────────────

function showModal(title, body) {
  document.getElementById('m-title').textContent = title;
  document.getElementById('m-body').textContent  = body;
  document.getElementById('modal-ov').classList.add('on');
}

function closeModal() {
  document.getElementById('modal-ov').classList.remove('on');
}

function showDenied() {
  document.getElementById('denied-msg').textContent = 'You must obtain all 3 keycards to enter this room.';

  const inv = document.getElementById('denied-inv');
  inv.innerHTML = '';

  for (let i = 0; i < TOTAL_KEYCARDS; i++) {
    const slot = document.createElement('div');
    slot.className = `d-slot${i < G.keycards ? ' have' : ''}`;
    if (i >= G.keycards) slot.textContent = 'SLOT';
    inv.appendChild(slot);
  }

  const missing = TOTAL_KEYCARDS - G.keycards;
  const note = document.createElement('p');
  note.style.color     = '#cc4444';
  note.style.marginTop = '10px';
  note.textContent     = `${missing} keycard${missing > 1 ? 's' : ''} missing.`;
  inv.appendChild(note);

  document.getElementById('denied-ov').classList.add('on');
}

function closeDenied() {
  document.getElementById('denied-ov').classList.remove('on');
  if (G.quizFailed) replayGame();
}

let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}