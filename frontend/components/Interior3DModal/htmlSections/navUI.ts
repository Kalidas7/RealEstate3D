// Interior 3D Viewer — Bottom navigation UI (room buttons, sub-node dots)

export function getNavUIJS(): string {
  return `
      // ========================================
      // Navigation UI
      // ========================================
      function createNavUI() {
        var old = document.getElementById('__navArea');
        if (old) old.remove();

        var navArea = document.createElement('div');
        navArea.id = '__navArea';
        navArea.className = 'nav-area';

        // Room name label
        var roomLabel = document.createElement('div');
        roomLabel.id = '__roomLabel';
        roomLabel.className = 'room-name-label';
        navArea.appendChild(roomLabel);

        // Sub-node row (dots + prev/next arrows)
        var subRow = document.createElement('div');
        subRow.id = '__subRow';
        subRow.className = 'subnode-row';

        var prevBtn = document.createElement('button');
        prevBtn.id = '__subPrev';
        prevBtn.className = 'subnode-arrow';
        prevBtn.innerHTML = '&#8249;';

        var dotsContainer = document.createElement('div');
        dotsContainer.id = '__subDots';
        dotsContainer.className = 'subnode-dots';

        var subLabel = document.createElement('div');
        subLabel.id = '__subLabel';
        subLabel.className = 'subnode-label';

        var nextBtn = document.createElement('button');
        nextBtn.id = '__subNext';
        nextBtn.className = 'subnode-arrow';
        nextBtn.innerHTML = '&#8250;';

        subRow.appendChild(prevBtn);
        subRow.appendChild(dotsContainer);
        subRow.appendChild(subLabel);
        subRow.appendChild(nextBtn);
        navArea.appendChild(subRow);

        // Room buttons row (connected rooms)
        var roomRow = document.createElement('div');
        roomRow.id = '__roomBtns';
        roomRow.className = 'room-buttons-row';
        navArea.appendChild(roomRow);

        document.body.appendChild(navArea);
        updateNavUI();
      }

      function updateNavUI() {
        if (!currentRoomId || !rooms[currentRoomId]) return;

        var room = rooms[currentRoomId];

        // ---- Room name label ----
        var roomLabel = document.getElementById('__roomLabel');
        if (roomLabel) {
          roomLabel.innerText = room.label;
        }

        // ---- Sub-node dots (only show for multi-viewpoint rooms) ----
        var subRow = document.getElementById('__subRow');
        var subDots = document.getElementById('__subDots');
        var subLabel = document.getElementById('__subLabel');
        var subPrev = document.getElementById('__subPrev');
        var subNext = document.getElementById('__subNext');

        if (subRow && room.subNodes.length > 1) {
          subRow.className = 'subnode-row visible';

          // Build dots
          if (subDots) {
            subDots.innerHTML = '';
            for (var i = 0; i < room.subNodes.length; i++) {
              var dot = document.createElement('div');
              dot.className = 'subnode-dot' + (i === currentSubIndex ? ' active' : '');
              subDots.appendChild(dot);
            }
          }

          // Sub-node label
          if (subLabel) {
            subLabel.innerText = room.subNodes[currentSubIndex].label;
          }

          // Prev/Next buttons
          if (subPrev) {
            subPrev.disabled = (currentSubIndex === 0);
            subPrev.onclick = function() { moveToSubNode(currentSubIndex - 1); };
          }
          if (subNext) {
            subNext.disabled = (currentSubIndex === room.subNodes.length - 1);
            subNext.onclick = function() { moveToSubNode(currentSubIndex + 1); };
          }
        } else if (subRow) {
          subRow.className = 'subnode-row';
        }

        // ---- Room buttons (connected rooms only) ----
        var roomBtns = document.getElementById('__roomBtns');
        if (!roomBtns) return;
        roomBtns.innerHTML = '';

        var connectedIds = connections[currentRoomId] || [];
        connectedIds.sort(function(a, b) { return parseInt(a) - parseInt(b); });

        for (var i = 0; i < connectedIds.length; i++) {
          var cid = connectedIds[i];
          if (!rooms[cid]) continue;

          var btn = document.createElement('button');
          btn.className = 'room-btn';
          btn.innerText = rooms[cid].label;
          btn.setAttribute('data-room', cid);
          btn.onclick = (function(rid) {
            return function() { moveToRoom(rid); };
          })(cid);
          roomBtns.appendChild(btn);
        }

        roomBtns.style.display = connectedIds.length > 0 ? 'flex' : 'none';
      }`;
}
