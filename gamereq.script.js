/*
  ═══════════════════════════════════════════════════════════════
  OFFICE ESC — gamereq.script.js
  Core game state, constants, screen control, navigation,
  inventory, phone system, and shared helpers.

  BUILD NOTES:
  Office Esc is a point-and-click browser escape room built with
  vanilla HTML, CSS, and JavaScript — no frameworks or build tools.
  Art assets were created by the team. Google Fonts (Bebas Neue,
  Crimson Pro, Share Tech Mono) are loaded via CDN. Audio uses the
  native Web Audio API. The game is split across three script files:
  gamereq.script.js (core/shared), main.rooms.script.js (rooms 0–3),
  and side.rooms.script.js (rooms 4–5 and quiz).

  LOGIC OVERVIEW:
  1. On "Start Game", resetGame() zeroes all state, then each room's
     build/reset function populates its DOM elements from data arrays.
  2. goToRoom(index) swaps the visible .room div and calls onEnterRoom()
     which fires a phone hint the first time a room is visited.
  3. navFwd() checks getRoomBlockReason() and, if all 3 keycards are
     missing, calls showDenied() instead of advancing to r-end.
  4. Each puzzle function updates the G state object and calls
     addKeycard() or G.hasKey = true when solved.
  5. updateInventory() reads G and re-renders the sidebar slots.
  6. The quiz in r-end runs sequentially; a wrong answer calls
     failQuiz() which shows the denied overlay.
  7. nudgeNextRoom() fires the standard grey toast with a short delay
     so it never overlaps the keycard or puzzle-completion toast.
  ═══════════════════════════════════════════════════════════════
*/


// ─────────────────────────────────────────────────────────
// 1. SETUP — constants and shared game-state object
// ─────────────────────────────────────────────────────────

const ROOMS = ['r-cubicle', 'r-paper', 'r-updown', 'r-chairs', 'r-water', 'r-wb', 'r-end'];

const TOTAL_KEYCARDS = 3;
const TOTAL_CHAIRS   = 14;
const ODD_PAPER      = 16;
const TOTAL_BUCKETS  = 3;
const TOTAL_UD_ITEMS = 5;

const QUIZ = [
  { question: 'How many chairs did you stack?',      options: ['10','12','14','16'], answer: '14'   },
  { question: 'How many buckets did you fill?',      options: ['3','5','4','8'],    answer: '3'    },
  { question: 'What word completed the whiteboard?', options: ['OUT','TRUTH','SPACE','TIME'], answer: 'TIME' }
];

const PAPERS = [
  [37,54,11,17,-12],[41,61,11,17,5],[44,51,11,17,18],[39,68,11,17,-7],[47,58,11,17,22],
  [51,54,11,17,-15],[49,66,11,17,8],[54,60,11,17,-20],[57,53,11,17,14],[53,70,11,17,-5],
  [59,58,11,17,25],[61,68,11,17,-18],[64,54,11,17,10],[66,64,11,17,-8],[69,58,11,17,20],
  [71,70,11,17,-14],
  [45,59,11,17,3],  // index 16 (ODD_PAPER) — has keycard on back
  [57,66,11,17,16],[62,60,11,17,-22],[67,70,11,17,7],[72,56,11,17,-10],[74,66,11,17,19],
  [52,56,11,17,-3],[76,60,11,17,-16],[47,66,11,17,12],[65,56,11,17,-25],[70,63,11,17,6],[55,63,11,17,-9]
];

// Each entry: [left%, top%, width%, height%, rotation(deg), flipX(1 or -1)]
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
];

const BUCKETS = [
  [55,40,12,19],[67,41,12,19],[50,54,12,19],[62,55,12,19],[55,67,11,18],[66,68,11,18]
];

// Correct click order for the upside-down room
const UD_ORDER = [
  'ud-plant1',
  'ud-plant2',
  'ud-desk',
  'ud-cabinet',
  'ud-phone'
];

// Target positions/rotations after righting each item
const UD_POSITIONS = [
  { left: 1,  top: 45, rot: 180 }, // plant1
  { left: 65, top: 35, rot: 180 }, // plant2
  { left: 30, top: 25, rot: 180 }, // desk
  { left: 20, top: 55, rot: 180 }, // cabinet
  { left: 24, top: 46, rot: 0   }  // phone
];

let udStep = 0;
const UD_ORIGINAL = {};

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
// 2. SCREENS — show/hide intro, game, outro
// ─────────────────────────────────────────────────────────

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
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

  document.getElementById('hs-phone').style.display        = '';
  document.getElementById('hs-drawer').style.pointerEvents = '';

  showScreen('screen-game');
  goToRoom(0);
  updateInventory();
}

function replayGame() { window.location.reload(); }


// ─────────────────────────────────────────────────────────
// 3. NAVIGATION — move between rooms
// ─────────────────────────────────────────────────────────

function goToRoom(index) {
  G.room = index;
  document.querySelectorAll('.room').forEach(r => r.classList.remove('active'));
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

function getRoomBlockReason(nextIndex) {
  // add return null; here if you want to unlock rooms

  if (!G.phonePickedUp) {
    return 'Pick up the phone before moving on.';
  }

  const currentRoom = ROOMS[G.room];

  if (currentRoom === 'r-paper'  && !G.paperDone)   return 'Find the odd one out before moving on.';
  if (currentRoom === 'r-updown' && !G.udDone)       return 'Right each item before moving on.';
  if (currentRoom === 'r-chairs' && !G.chairsDone)   return 'Stack all the chairs before moving on.';
  if (currentRoom === 'r-water'  && !G.waterDone)    return 'Put out the fire before moving on.';
  if (currentRoom === 'r-wb'     && !G.wbDone)       return 'Solve the puzzle before moving on.';

  const nextRoom = ROOMS[nextIndex];
  if (nextRoom === 'r-end' && G.keycards < TOTAL_KEYCARDS) return null;

  return null;
}

function navFwd() {
  const next = G.room + 1;
  if (next >= ROOMS.length) return;

  const blockMsg = getRoomBlockReason(next);
  if (blockMsg) { showToast(blockMsg); return; }

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
      'r-updown': 'Life settles first, then work begins—what’s kept comes next; when the call is made, everything is in order',
      'r-chairs': 'An ordinary seat longs to reach for the heavens.',
      'r-water':  'Fill what is empty. Stop what burns.',
      'r-wb':     'The ever present force that marches forward.',
      'r-end':    'Good day to you, friend. I must leave. The signal is getting spotty.'
    };

    if (hints[roomId]) sendMessage('them', hints[roomId]);
  }

  if (roomId === 'r-end') {
    setTimeout(startQuiz, 300);
  }
}


// ─────────────────────────────────────────────────────────
// 4. INVENTORY — keycards and key
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
// 5. PHONE — chat bubbles
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
// 6. HELPERS — modal, toast, access denied
// ─────────────────────────────────────────────────────────

const audio = new Audio('audio/click2.mp3');

function showModal(title, body) {
  document.getElementById('m-title').textContent = title;
  document.getElementById('m-body').textContent  = body;
  document.getElementById('modal-ov').classList.add('on');
}

function closeModal() {
  document.getElementById('modal-ov').classList.remove('on');
}

function showDenied() {
  document.getElementById('denied-msg').textContent =
    'You must obtain all 3 keycards to enter this room.';

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

  if (G.quizFailed) {
    G.quizFailed = false;
    G.quizIdx    = 0;
    startQuiz();
  }
}

let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

let nudgeTimer;
function nudgeNextRoom(delay) {
  clearTimeout(nudgeTimer);
  nudgeTimer = setTimeout(() => {
    showToast('Move to the next room.');
  }, delay !== undefined ? delay : 3200);
}

function updateUDUI() {
  document.getElementById('ud-count').textContent = udStep;
}

// Prevent right-click and drag on game assets
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('dragstart',   e => e.preventDefault());

// Play click sound on every interaction
window.addEventListener('click', () => audio.play());
