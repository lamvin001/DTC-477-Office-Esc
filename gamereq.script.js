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
  // [left, top, width, height, rotation]
  [28,58,7,13,-12],[32,65,7,13,5],[35,55,7,13,18],[30,72,7,13,-7],[38,62,7,13,22],
  [42,58,7,13,-15],[40,70,7,13,8],[45,64,7,13,-20],[48,57,7,13,14],[44,74,7,13,-5],
  [50,62,7,13,25],[52,72,7,13,-18],[55,58,7,13,10],[57,68,7,13,-8],[60,62,7,13,20],
  [62,74,7,13,-14],
  [36,63,8,14,3],  // the ! paper (has keycard)
  [48,70,7,13,16],[53,64,7,13,-22],[58,74,7,13,7],[63,60,7,13,-10],[65,70,7,13,19],
  [43,60,7,13,-3],[67,64,7,13,-16],[38,70,7,13,12],[56,60,7,13,-25],[61,67,7,13,6],[46,67,7,13,-9]
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

// Returns null if navigation is allowed, or a denial message string if blocked.
function getRoomBlockReason(nextIndex) {
  const nextRoom = ROOMS[nextIndex];
  return null;

  // Must pick up phone before leaving room 0
  if (!G.phonePickedUp) {
    return 'Pick up the phone before moving on.';
  }

  // Puzzle completion checks per room (must complete current room before advancing)
  const currentRoom = ROOMS[G.room];

  if (currentRoom === 'r-paper' && !G.paperDone) {
    return 'Find the odd paper out before moving on.';
  }
  if (currentRoom === 'r-updown' && !G.udDone) {
    return 'Right all items in this room before moving on.';
  }
  if (currentRoom === 'r-chairs' && !G.chairsDone) {
    return 'Stack all the chairs before moving on.';
  }
  if (currentRoom === 'r-water' && !G.waterDone) {
    return 'Fill all buckets and turn off the faucet before moving on.';
  }
  if (currentRoom === 'r-wb' && !G.wbDone) {
    return 'Solve the whiteboard puzzle before moving on.';
  }

  // Final room keycard check
  if (nextRoom === 'r-end' && G.keycards < TOTAL_KEYCARDS) {
    return null; // handled separately by showDenied()
  }

  return null;
}

function navFwd() {
  const next = G.room + 1;
  if (next >= ROOMS.length) return;

  const blockMsg = getRoomBlockReason(next);
  if (blockMsg) {
    showToast(blockMsg);
    return;
  }

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