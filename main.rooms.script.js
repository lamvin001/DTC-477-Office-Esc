// ─────────────────────────────────────────────────────────
// ROOM 0 — CUBICLE
// ─────────────────────────────────────────────────────────

function pickupPhone() {
  if (G.phonePickedUp) {
    showToast('You already have the phone.');
    return;
  }

  G.phonePickedUp = true;

  // Remove phone from desk
  document.getElementById('hs-phone').style.display = 'none';
  document.getElementById('phone-on-desk').style.display = 'none';

  // Clear the placeholder text
  document.getElementById('ph-msgs').innerHTML = '';

  showToast('You pick up the phone.');

  setTimeout(() => {
    sendMessage('them', 'Some say Watchers detest unknown variables. Please, exit to the right.');
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
  document.getElementById('lock-img').style.display = 'none';
  updateInventory();
  addKeycard();
  showModal('DRAWER OPENED', 'You slide the key into the lock. Inside the drawer lies the third keycard, sealed in a plain envelope.');
}


// ─────────────────────────────────────────────────────────
// ROOM 1 — PAPER ROOM
// ─────────────────────────────────────────────────────────

function buildPapers() {
  const layer = document.getElementById('papers-layer');
  layer.innerHTML = '';
  if (G.paperDone) return;

  PAPERS.forEach((pos, index) => {
    const wrapper = document.createElement('div');
    wrapper.className    = 'paper-hs';
    wrapper.style.left   = pos[0] + '%';
    wrapper.style.top    = pos[1] + '%';
    wrapper.style.width  = pos[2] + '%';
    wrapper.style.height = pos[3] + '%';
    wrapper.style.transform = `rotate(${pos[4]}deg)`;

    const img = document.createElement('img');
    img.src   = index === ODD_PAPER ? 'img/exclamation.png' : 'img/question.png';
    img.alt   = index === ODD_PAPER ? '!' : '?';
    img.style.cssText = 'width:200%;height:200%;object-fit:contain;pointer-events:none;';

    wrapper.appendChild(img);
    wrapper.addEventListener('click', () => clickPaper(index, wrapper));
    layer.appendChild(wrapper);
  });
}

function clickPaper(index, el) {
  if (G.paperDone) return;

  if (index === ODD_PAPER) {
    el.classList.add('clicked');
    G.paperDone = true;

    const found = document.getElementById('paper-found');
    found.style.display = 'block';
    found.style.left    = (PAPERS[index][0] - 1) + '%';
    found.style.top     = (PAPERS[index][1] - 14) + '%';

    setTimeout(() => {
      addKeycard();
      showModal('FOUND IT', 'You flip the paper over. On the back, a keycard is taped flat. You peel it off carefully.');
      found.style.display = 'none';
    }, 450);

  } else {
    const angle = (Math.random() * 16 - 8).toFixed(1);
    el.style.transform = `rotate(${angle}deg) scale(.91)`;
    setTimeout(() => { el.style.transform = ''; }, 180);
    showToast('Just a question mark. Keep looking.');
  }
}


// ─────────────────────────────────────────────────────────
// ROOM 2 — UPSIDE-DOWN ROOM
// ─────────────────────────────────────────────────────────

function resetUpsideDown() {
  document.getElementById('ud-count').textContent = 0;
  G.udDone  = false;
  udStep = 0;

  UD_ORDER.forEach(function(id, index) {
    const el = document.getElementById(id);
    if (!el) return;

    // store original position ONCE
    UD_ORIGINAL[id] = {
      left: el.style.left,
      top:  el.style.top
    };

    // reset position
    el.style.left = UD_ORIGINAL[id].left;
    el.style.top  = UD_ORIGINAL[id].top;

    el.style.pointerEvents = '';
  });
}

function clickUD(id, index, el) {
  if (G.udDone) return;

  const original = {
    left: el.style.left,
    top: el.style.top,
    transform: el.style.transform || ''
  };

  const pos = UD_POSITIONS[index];

  // move + rotate first
  el.style.left = pos.left + '%';
  el.style.top  = pos.top + '%';
  el.style.transform = `rotate(${pos.rot}deg)`;

  setTimeout(() => {

    if (id === UD_ORDER[udStep]) {

      // correct → lock it
      udStep++;
      updateUDUI();
      el.style.pointerEvents = 'none';

      if (udStep === UD_ORDER.length) {
        G.udDone = true;
        addKeycard();

        setTimeout(() => {
          showModal('PUZZLE COMPLETE', 'Everything falls into place. A keycard appears.');
        }, 250);
      }

    } else {

      // wrong → revert everything
      el.style.left = original.left;
      el.style.top = original.top;
      el.style.transform = original.transform;

    }

  }, 180);
}


// ─────────────────────────────────────────────────────────
// ROOM 3 — CHAIR ROOM
// ─────────────────────────────────────────────────────────

function resetChairs() {
  G.chairCount = 0;
  G.chairsDone = false;
  document.getElementById('stack-counter').textContent = 'STACKED: 0 / ' + TOTAL_CHAIRS;
  document.getElementById('chair-stack-zone').innerHTML = '';

  CHAIRS.forEach((pos, i) => {
    const el = document.getElementById('chair-' + i);
    if (!el) return;
    el.style.left          = pos[0] + '%';
    el.style.top           = pos[1] + '%';
    el.style.width         = pos[2] + '%';
    el.style.height        = pos[3] + '%';
    el.style.transform     = `rotate(${pos[4]}deg) scaleX(${pos[5]})`;
    el.style.opacity       = '1';
    el.style.pointerEvents = '';
    el.style.border        = '';
    el.style.background    = '';
    el.classList.remove('moving', 'stacked');
  });
}

function clickChair(index) {
  const el = document.getElementById('chair-' + index);

  if (!el || el.classList.contains('moving') || el.classList.contains('stacked') || G.chairsDone) return;

  G.chairCount++;
  el.style.zIndex = G.chairCount;
  document.getElementById('stack-counter').textContent = 'STACKED: ' + G.chairCount + ' / ' + TOTAL_CHAIRS;

  const stackY = Math.max(20, 85 - G.chairCount * 1.2);

  el.classList.add('moving');
  el.style.left       = '40%';
  el.style.top        = stackY - 25 + '%';
  el.style.transform  = `rotate(0deg) scaleX(1)`;
  el.style.width      = '20%';
  el.style.height     = '26%';
  el.style.border     = '0';
  el.style.background = 'transparent';

  setTimeout(() => {
    if (G.chairCount > 1) {
      const img = el.querySelector('img');
      img.src = 'img/chair-stacked.png';
    }

    const plank = document.createElement('div');
    plank.className = 'stack-plank';
    document.getElementById('chair-stack-zone').appendChild(plank);
  }, 520);

  if (G.chairCount === TOTAL_CHAIRS) {
    G.chairsDone = true;
    setTimeout(() => {
      showModal('ALL CHAIRS STACKED', 'All chairs are stacked. Move to the next room.');
    }, 700);
  }
}