// ─────────────────────────────────────────────────────────
// ROOM 0 — CUBICLE
// ─────────────────────────────────────────────────────────

function pickupPhone() {
  if (G.phonePickedUp) {
    showToast('You already have the phone.');
    return;
  }

  G.phonePickedUp = true;
  document.getElementById('hs-phone').style.display = 'none';
  document.getElementById('ph-msgs').innerHTML = '';
  showToast('You pick up the phone.');

  setTimeout(function() {
    sendMessage('them', 'Some say Watchers detest unknown variables. Let us chat for 7392 hours of our life to come.');
  }, 700);
}

function clickDrawer() {
  if (G.keyUsed) {
    showToast('The drawer is already open. Nothing left inside.');
    return;
  }
  if (!G.hasKey) {
    showModal('LOCKED', 'The middle drawer is locked. You need a key to open it.');
    return;
  }

  G.keyUsed = true;
  G.hasKey  = false;
  updateInventory();
  addKeycard();
  showModal('DRAWER OPENED', 'You slide the key into the lock. Inside the drawer lies the third keycard, sealed in a plain envelope.');
}


// ─────────────────────────────────────────────────────────
// ROOM 1 — PAPER ROOM
// ─────────────────────────────────────────────────────────

function buildPapers() {
  var layer = document.getElementById('papers-layer');
  layer.innerHTML = '';
  if (G.paperDone) return;

  // .forEach() replaces the old for-loop + self-executing function trick
  // index is automatically passed in, no extra wrapper needed
  PAPERS.forEach(function(pos, index) {
    var div = document.createElement('div');
    div.className    = 'paper-hs';
    div.style.left   = pos[0] + '%';
    div.style.top    = pos[1] + '%';
    div.style.width  = pos[2] + '%';
    div.style.height = pos[3] + '%';

    div.addEventListener('click', function() { clickPaper(index, div); });
    layer.appendChild(div);
  });
}

function clickPaper(index, el) {
  if (G.paperDone) return;

  if (index === ODD_PAPER) {
    el.classList.add('clicked');
    G.paperDone = true;

    var found = document.getElementById('paper-found');
    found.style.display = 'block';
    found.style.left    = (PAPERS[index][0] - 1) + '%';
    found.style.top     = (PAPERS[index][1] - 14) + '%';

    setTimeout(function() {
      addKeycard();
      showModal('FOUND IT', 'You flip the paper over. On the back, a keycard is taped flat. You peel it off carefully.');
      found.style.display = 'none';
    }, 450);

  } else {
    // Wrong paper — shake it as feedback
    var angle = (Math.random() * 16 - 8).toFixed(1);  // random number between -8 and 8
    el.style.transform = 'rotate(' + angle + 'deg) scale(.91)';
    setTimeout(function() { el.style.transform = ''; }, 180);
    showToast('Just a question mark. Keep looking.');
  }
}


// ─────────────────────────────────────────────────────────
// ROOM 2 — UPSIDE-DOWN ROOM
// ─────────────────────────────────────────────────────────

function resetUpsideDown() {
  G.udCount = 0;
  G.udDone  = false;

  UD_ITEMS.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove('righted');
  });

  var bg = document.getElementById('ud-bg-img');
  if (bg) {
    bg.style.transition = 'none';
    bg.style.transform  = 'rotate(0deg)';
    // Small delay before re-enabling the animation,
    // so the reset jump happens instantly (not animated)
    setTimeout(function() { bg.style.transition = 'transform 1s ease'; }, 50);
  }

  document.getElementById('ud-count').textContent = '0';
}

function rightItem(id, label) {
  if (G.udDone) return;

  var el = document.getElementById(id);
  if (!el || el.classList.contains('righted')) return;

  el.classList.add('righted');
  G.udCount++;
  document.getElementById('ud-count').textContent = G.udCount;
  showToast(label + ' righted.');

  if (G.udCount >= TOTAL_UD_ITEMS) {
    G.udDone = true;
    var bg = document.getElementById('ud-bg-img');
    if (bg) {
      bg.style.transition = 'transform 1s ease';
      bg.style.transform  = 'rotate(180deg)';  // 180deg flips it right-side up
    }
    addKeycard();
    setTimeout(function() {
      showModal('ROOM RIGHTED', 'Everything is back in order. A keycard slides out from beneath the overturned desk.');
    }, 1100);
  }
}


// ─────────────────────────────────────────────────────────
// ROOM 3 — CHAIR ROOM
// ─────────────────────────────────────────────────────────

function resetChairs() {
  G.chairCount = 0;
  G.chairsDone = false;
  document.getElementById('stack-counter').textContent = 'STACKED: 0 / ' + TOTAL_CHAIRS;
  document.getElementById('chair-stack-zone').innerHTML = '';

  CHAIRS.forEach(function(pos, i) {
    var el = document.getElementById('chair-' + i);
    if (!el) return;
    el.style.left          = pos[0] + '%';
    el.style.top           = pos[1] + '%';
    el.style.width         = pos[2] + '%';
    el.style.height        = pos[3] + '%';
    el.style.transform = `rotate(${pos[4]}deg) scaleX(${pos[5]})`;
    el.style.opacity       = '1';
    el.style.pointerEvents = '';
    el.style.border        = '';
    el.style.background    = '';
    el.classList.remove('moving', 'stacked');
  });
}

function clickChair(index) {
  var el = document.getElementById('chair-' + index);

  // Do nothing if: chair doesn't exist, is already moving/stacked, or room is done
  if (!el || el.classList.contains('moving') || el.classList.contains('stacked') || G.chairsDone) return;

  G.chairCount++;
  el.style.zIndex = G.chairCount;
  document.getElementById('stack-counter').textContent = 'STACKED: ' + G.chairCount + ' / ' + TOTAL_CHAIRS;

  // Stack position — chairs pile up from the bottom, growing upward
  var stackY = Math.max(20, 85 - G.chairCount * 1.2);

  el.classList.add('moving');
  el.style.left       = '40%';   // horizontal centre
  el.style.top        = stackY - 25 + '%';
  el.style.transform = `rotate(0deg) scaleX(1)`;
  el.style.width      = '20%';
  el.style.height     = '26%';
  el.style.border     = '0';
  el.style.background = 'transparent';

  // After the slide animation finishes, add a visual plank to the stack
  setTimeout(function() {
    //el.classList.add('stacked');

    // change image for all chairs except the first one stacked
    if (G.chairCount > 1) {
      const img = el.querySelector('img');
      img.src = 'img/chair-stacked.png';
    }

    var plank = document.createElement('div');
    plank.className = 'stack-plank';
    document.getElementById('chair-stack-zone').appendChild(plank);
  }, 520);

  if (G.chairCount === TOTAL_CHAIRS) {
    G.chairsDone = true;
    setTimeout(function() {
      showModal('ALL CHAIRS STACKED', 'All chairs are stacked. Move to the next room.');
    }, 700);
  }
}