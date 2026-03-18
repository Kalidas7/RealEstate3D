// ============================================================
// Interior 3D HTML Content — Room/Door Auto-Discovery System
// ============================================================
// Reads ROOM_* and DOOR_* empties from the GLB file to build
// navigation graph. No hardcoded coordinates.
// ============================================================

export function generateInteriorHtml(modelUrl: string): string {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { background: #0a0a0a; overflow: hidden; }
      #container { width: 100vw; height: 100vh; }
      #loading {
        position: absolute; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        color: white; font-size: 16px; text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      .spinner {
        border: 3px solid rgba(255,255,255,0.1);
        border-top: 3px solid #667eea;
        border-radius: 50%; width: 40px; height: 40px;
        animation: spin 1s linear infinite;
        margin: 0 auto 16px;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      .controls-hint {
        position: absolute; bottom: 20px; left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.6); backdrop-filter: blur(10px);
        padding: 8px 16px; border-radius: 20px;
        color: rgba(255,255,255,0.8); font-size: 11px;
        border: 1px solid rgba(255,255,255,0.1);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        white-space: nowrap;
        pointer-events: none;
        transition: opacity 0.5s;
      }
      #error { display: none; position: absolute; top: 50%; left: 50%;
        transform: translate(-50%, -50%); color: #ff6b6b;
        text-align: center; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }

      /* ---- Navigation UI ---- */
      .nav-area {
        position: absolute;
        bottom: 60px;
        left: 0; right: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        pointer-events: none;
        z-index: 100;
      }

      /* Sub-node dots (prev/next within a room) */
      .subnode-row {
        display: none;
        align-items: center;
        gap: 10px;
        background: rgba(0, 0, 0, 0.6);
        padding: 6px 14px;
        border-radius: 24px;
        border: 1px solid rgba(255,255,255,0.15);
        backdrop-filter: blur(10px);
        pointer-events: auto;
      }
      .subnode-row.visible { display: flex; }
      .subnode-arrow {
        width: 30px; height: 30px;
        background: rgba(255, 102, 0, 0.9);
        color: white; border: none; border-radius: 50%;
        font-size: 14px; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        transition: transform 0.15s, opacity 0.2s;
      }
      .subnode-arrow:active { transform: scale(0.9); }
      .subnode-arrow:disabled { opacity: 0.4; cursor: not-allowed; background: rgba(150,150,150,0.5); }
      .subnode-dots {
        display: flex; gap: 6px; align-items: center;
      }
      .subnode-dot {
        width: 8px; height: 8px; border-radius: 50%;
        background: rgba(255,255,255,0.3);
        transition: background 0.3s, transform 0.3s;
      }
      .subnode-dot.active {
        background: #ff6600;
        transform: scale(1.3);
      }
      .subnode-label {
        color: white; font-size: 12px; font-weight: 600;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        max-width: 140px; text-align: center;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }

      /* Room buttons (scrollable row) */
      .room-buttons-row {
        display: flex;
        gap: 8px;
        padding: 8px 16px;
        background: rgba(0, 0, 0, 0.6);
        border-radius: 28px;
        border: 1px solid rgba(255,255,255,0.15);
        backdrop-filter: blur(10px);
        pointer-events: auto;
        overflow-x: auto;
        max-width: 90vw;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
      }
      .room-buttons-row::-webkit-scrollbar { display: none; }
      .room-btn {
        padding: 8px 16px;
        background: rgba(255, 102, 0, 0.85);
        color: white; border: none; border-radius: 20px;
        font-weight: bold; font-size: 12px; cursor: pointer;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        transition: background 0.2s, transform 0.15s;
        white-space: nowrap;
        flex-shrink: 0;
      }
      .room-btn:active { transform: scale(0.95); }

      /* Room name label */
      .room-name-label {
        color: white; font-size: 15px; font-weight: 700;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        text-shadow: 0 1px 4px rgba(0,0,0,0.7);
      }
    </style>
    <script type="importmap">
      {
        "imports": {
          "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
          "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
        }
      }
    </script>
  </head>
  <body>
    <div id="container"></div>
    <div id="loading"><div class="spinner"></div>Loading Interior...</div>
    <div class="controls-hint" id="controlsHint">Drag to rotate view</div>
    <div id="error"><div style="font-size:48px;margin-bottom:12px">&#10060;</div>Failed to load Interior model</div>

    <script type="module">
      import * as THREE from 'three';
      import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
      import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

      // ========================================
      // Globals
      // ========================================
      var scene, camera, renderer, controls;
      var model;
      var scaledCenter;
      var modelScale;

      // ========================================
      // Room / Door data (populated from GLB)
      // ========================================

      // rooms[id] = { label, subNodes: [{id, label, position}] }
      var rooms = {};
      // doors = [{ from, to, position (THREE.Vector3) }]
      var doors = [];
      // connections[roomId] = [roomId, roomId, ...]
      var connections = {};

      // Current state
      var currentRoomId = null;
      var currentSubIndex = 0;
      var isMovingCamera = false;

      // 3D door markers
      var doorSprites = [];
      var raycaster = new THREE.Raycaster();

      // ========================================
      // Log helper
      // ========================================
      function log(msg) {
        try { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'log', message: msg })); } catch(e) {}
      }
      function logError(msg, stack) {
        try { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: msg, stack: stack || '' })); } catch(e) {}
      }

      // ========================================
      // Parse ROOM_* and DOOR_* from GLB scene
      // ========================================
      function discoverRoomsAndDoors(sceneRoot) {
        var rawRooms = [];
        var rawDoors = [];

        sceneRoot.traverse(function(child) {
          var name = child.name;

          // ---- ROOM_01_Name or ROOM_01a_Name ----
          if (name.startsWith('ROOM_')) {
            var rest = name.substring(5);
            var underIdx = rest.indexOf('_');
            if (underIdx === -1) {
              log('WARNING: Malformed room name (no label): ' + name);
              return;
            }

            var idPart = rest.substring(0, underIdx);
            var label  = rest.substring(underIdx + 1);

            // Split idPart into roomId (digits) + subNode letter (alpha)
            var roomId = '';
            var subLetter = '';
            for (var i = 0; i < idPart.length; i++) {
              var ch = idPart[i];
              if (ch >= '0' && ch <= '9') {
                roomId += ch;
              } else {
                subLetter = idPart.substring(i);
                break;
              }
            }

            if (!roomId) {
              log('WARNING: No room ID found in: ' + name);
              return;
            }

            var worldPos = new THREE.Vector3();
            child.getWorldPosition(worldPos);

            rawRooms.push({ roomId: roomId, sub: subLetter, label: label, position: worldPos });
            log('Found: ' + name + ' -> room=' + roomId + ' sub=' + (subLetter || '(none)') + ' pos=(' + worldPos.x.toFixed(2) + ',' + worldPos.y.toFixed(2) + ',' + worldPos.z.toFixed(2) + ')');
          }

          // ---- DOOR_01_02 or DOOR_01_02_a ----
          if (name.startsWith('DOOR_')) {
            var parts = name.split('_');
            if (parts.length < 3) {
              log('WARNING: Malformed door name: ' + name);
              return;
            }

            var fromId = parts[1];
            var toId   = parts[2];

            var worldPos = new THREE.Vector3();
            child.getWorldPosition(worldPos);

            rawDoors.push({ from: fromId, to: toId, position: worldPos });
            log('Found: ' + name + ' -> door ' + fromId + ' <-> ' + toId + ' pos=(' + worldPos.x.toFixed(2) + ',' + worldPos.y.toFixed(2) + ',' + worldPos.z.toFixed(2) + ')');
          }
        });

        // ---- Build rooms dict with sub-nodes ----
        for (var i = 0; i < rawRooms.length; i++) {
          var r = rawRooms[i];
          if (!rooms[r.roomId]) {
            rooms[r.roomId] = {
              label: r.label,
              subNodes: []
            };
            connections[r.roomId] = [];
          }
          rooms[r.roomId].subNodes.push({
            id: r.sub || '',
            label: r.label,
            position: r.position
          });
        }

        // Sort sub-nodes alphabetically
        for (var id in rooms) {
          rooms[id].subNodes.sort(function(a, b) {
            return a.id.localeCompare(b.id);
          });
          // Use first sub-node label as room label (strip trailing sub-node specifics)
          if (rooms[id].subNodes.length === 1) {
            rooms[id].label = rooms[id].subNodes[0].label;
          } else {
            // For multi-viewpoint rooms, find common prefix of labels
            // or just use the part before the first sub-node's label difference
            var first = rooms[id].subNodes[0].label;
            // Simple: take everything up to the last space if labels differ
            rooms[id].label = first;
          }
        }

        // ---- Build doors and connections ----
        doors = rawDoors;
        for (var i = 0; i < rawDoors.length; i++) {
          var d = rawDoors[i];
          if (rooms[d.from] && rooms[d.to]) {
            if (connections[d.from].indexOf(d.to) === -1) {
              connections[d.from].push(d.to);
            }
            if (connections[d.to].indexOf(d.from) === -1) {
              connections[d.to].push(d.from);
            }
          } else {
            log('WARNING: Door ' + d.from + '<->' + d.to + ' references non-existent room. Skipping.');
          }
        }

        // Log summary
        var roomIds = Object.keys(rooms);
        log('Discovery complete: ' + roomIds.length + ' rooms, ' + doors.length + ' doors');
        for (var i = 0; i < roomIds.length; i++) {
          var rid = roomIds[i];
          log('  Room ' + rid + ' (' + rooms[rid].label + '): ' + rooms[rid].subNodes.length + ' viewpoint(s), connects to [' + connections[rid].join(', ') + ']');
        }
      }

      // ========================================
      // Apply model transform to discovered positions
      // ========================================
      function transformDiscoveredPositions(scale, offset) {
        for (var id in rooms) {
          for (var j = 0; j < rooms[id].subNodes.length; j++) {
            var pos = rooms[id].subNodes[j].position;
            pos.multiplyScalar(scale);
            pos.sub(offset);
          }
        }
        for (var i = 0; i < doors.length; i++) {
          doors[i].position.multiplyScalar(scale);
          doors[i].position.sub(offset);
        }
      }

      // ========================================
      // Camera controls
      // ========================================
      function applyFixedControls() {
        controls.enablePan     = false;
        controls.enableZoom    = true;
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.rotateSpeed   = 0.5;
        controls.minDistance    = 0.01;
        controls.maxDistance    = Infinity;
      }

      // ========================================
      // Camera placement (instant, no animation)
      // ========================================
      function placeCameraAtSubNode(roomId, subIndex) {
        var room = rooms[roomId];
        if (!room || !room.subNodes[subIndex]) return;

        var pos = room.subNodes[subIndex].position;
        camera.position.copy(pos);
        controls.target.copy(pos.clone().add(new THREE.Vector3(0, 0, -0.01)));
        controls.update();

        currentRoomId = roomId;
        currentSubIndex = subIndex;
        updateNavUI();
        updateDoorSprites();
      }

      // ========================================
      // Camera animation — smooth fly along path
      // ========================================
      function animateCameraPath(points, duration, onComplete) {
        if (points.length < 2) { if (onComplete) onComplete(); return; }

        isMovingCamera = true;
        var totalSegments = points.length - 1;
        var segmentDuration = duration / totalSegments;
        var currentSegment = 0;
        var segStartTime = performance.now();

        function tick(time) {
          var elapsed = time - segStartTime;
          var progress = Math.min(elapsed / segmentDuration, 1);

          // Ease in-out quad
          var ease = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

          var startPos = points[currentSegment];
          var endPos = points[currentSegment + 1];

          camera.position.lerpVectors(startPos, endPos, ease);

          // Look in the direction of travel
          var direction = endPos.clone().sub(startPos).normalize();
          var lookTarget = camera.position.clone().add(direction.multiplyScalar(0.01));
          controls.target.copy(lookTarget);
          controls.update();

          if (progress >= 1) {
            currentSegment++;
            if (currentSegment < totalSegments) {
              segStartTime = performance.now();
              requestAnimationFrame(tick);
            } else {
              isMovingCamera = false;
              // Set final look target straight ahead
              var finalPos = points[points.length - 1];
              controls.target.copy(finalPos.clone().add(new THREE.Vector3(0, 0, -0.01)));
              controls.update();
              if (onComplete) onComplete();
            }
          } else {
            requestAnimationFrame(tick);
          }
        }
        requestAnimationFrame(tick);
      }

      // ========================================
      // Move to a different room (through door)
      // ========================================
      function moveToRoom(targetRoomId) {
        if (isMovingCamera) return;
        if (targetRoomId === currentRoomId) return;
        if (!rooms[targetRoomId]) return;

        // Find the door between current room and target
        var doorPos = null;
        for (var i = 0; i < doors.length; i++) {
          var d = doors[i];
          if ((d.from === currentRoomId && d.to === targetRoomId) ||
              (d.from === targetRoomId && d.to === currentRoomId)) {
            doorPos = d.position;
            break;
          }
        }

        var startPos = camera.position.clone();
        var endPos = rooms[targetRoomId].subNodes[0].position.clone();

        var path;
        if (doorPos) {
          path = [startPos, doorPos.clone(), endPos];
        } else {
          log('WARNING: No door found between ' + currentRoomId + ' and ' + targetRoomId + '. Flying direct.');
          path = [startPos, endPos];
        }

        animateCameraPath(path, 2000, function() {
          currentRoomId = targetRoomId;
          currentSubIndex = 0;
          applyFixedControls();
          updateNavUI();
          updateDoorSprites();
        });
      }

      // ========================================
      // Move to sub-node within same room
      // ========================================
      function moveToSubNode(subIndex) {
        if (isMovingCamera) return;
        var room = rooms[currentRoomId];
        if (!room || !room.subNodes[subIndex]) return;
        if (subIndex === currentSubIndex) return;

        var startPos = camera.position.clone();
        var endPos = room.subNodes[subIndex].position.clone();

        animateCameraPath([startPos, endPos], 1200, function() {
          currentSubIndex = subIndex;
          applyFixedControls();
          updateNavUI();
        });
      }

      // ========================================
      // 3D Door Sprites (tappable in scene)
      // ========================================
      function createDoorSprites() {
        // Create a canvas texture for the door marker icon
        var canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        var ctx = canvas.getContext('2d');

        // Orange circle with arrow
        ctx.beginPath();
        ctx.arc(64, 64, 56, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 102, 0, 0.85)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Arrow icon
        ctx.fillStyle = 'white';
        ctx.font = 'bold 50px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('\\u279C', 66, 64);

        var texture = new THREE.CanvasTexture(canvas);

        for (var i = 0; i < doors.length; i++) {
          var d = doors[i];
          var spriteMat = new THREE.SpriteMaterial({
            map: texture.clone(),
            transparent: true,
            depthTest: false,
            sizeAttenuation: true
          });
          var sprite = new THREE.Sprite(spriteMat);
          sprite.position.copy(d.position);
          sprite.scale.set(0.4, 0.4, 0.4);
          sprite.userData = { doorIndex: i, from: d.from, to: d.to };
          sprite.visible = false;
          scene.add(sprite);
          doorSprites.push(sprite);
        }
      }

      function updateDoorSprites() {
        for (var i = 0; i < doorSprites.length; i++) {
          var sp = doorSprites[i];
          var d = doors[sp.userData.doorIndex];
          var isConnected = (d.from === currentRoomId || d.to === currentRoomId);
          sp.visible = isConnected;
        }
      }

      function onPointerDown(event) {
        if (isMovingCamera) return;

        var mouse = new THREE.Vector2(
          (event.clientX / window.innerWidth) * 2 - 1,
          -(event.clientY / window.innerHeight) * 2 + 1
        );
        raycaster.setFromCamera(mouse, camera);

        var visibleSprites = doorSprites.filter(function(s) { return s.visible; });
        var hits = raycaster.intersectObjects(visibleSprites);

        if (hits.length > 0) {
          var hit = hits[0].object;
          var targetRoom = hit.userData.from === currentRoomId ? hit.userData.to : hit.userData.from;
          moveToRoom(targetRoom);
        }
      }

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
      }

      // ========================================
      // Scene init
      // ========================================
      function init() {
        try {
          scene = new THREE.Scene();
          scene.background = new THREE.Color(0x0a0a0a);

          camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
          camera.position.set(0, 5, 12);

          renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
          renderer.setSize(window.innerWidth, window.innerHeight);
          renderer.setPixelRatio(window.devicePixelRatio);
          renderer.toneMapping = THREE.ACESFilmicToneMapping;
          renderer.toneMappingExposure = 1.2;
          document.getElementById('container').appendChild(renderer.domElement);

          var ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
          scene.add(ambientLight);

          var mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
          mainLight.position.set(5, 10, 7.5);
          scene.add(mainLight);

          controls = new OrbitControls(camera, renderer.domElement);
          controls.enableDamping = true;
          controls.dampingFactor = 0.05;

          var loader = new GLTFLoader();
          loader.load(
            '${modelUrl}',
            function(gltf) {
              model = gltf.scene;

              // Discover rooms and doors BEFORE scaling
              discoverRoomsAndDoors(model);

              // Scale and center the model
              var box = new THREE.Box3().setFromObject(model);
              var center = box.getCenter(new THREE.Vector3());
              var size = box.getSize(new THREE.Vector3());
              var maxDim = Math.max(size.x, size.y, size.z);
              modelScale = 10 / maxDim;
              model.scale.setScalar(modelScale);

              scaledCenter = center.clone().multiplyScalar(modelScale);
              model.position.sub(scaledCenter);

              scene.add(model);

              // Transform discovered positions to match model placement
              transformDiscoveredPositions(modelScale, scaledCenter);

              // Setup navigation
              applyFixedControls();
              createDoorSprites();
              createNavUI();

              // Start at first room (sorted by ID)
              var roomIds = Object.keys(rooms).sort();
              if (roomIds.length > 0) {
                placeCameraAtSubNode(roomIds[0], 0);
                log('Starting at room ' + roomIds[0] + ' (' + rooms[roomIds[0]].label + ')');
              } else {
                log('WARNING: No ROOM_* empties found in GLB. Camera stays at default position.');
              }

              // Listen for door taps in 3D
              window.addEventListener('pointerdown', onPointerDown, false);

              // Hide loading
              document.getElementById('loading').style.display = 'none';

              // Fade hint after 4 seconds
              setTimeout(function() {
                var hint = document.getElementById('controlsHint');
                if (hint) hint.style.opacity = '0';
              }, 4000);

              log('Interior loaded. Rooms: ' + roomIds.length + ', Doors: ' + doors.length);
            },
            function(xhr) {
              if (xhr.total > 0) {
                log('Loading: ' + (xhr.loaded / xhr.total * 100).toFixed(0) + '%');
              }
            },
            function(error) {
              document.getElementById('loading').style.display = 'none';
              document.getElementById('error').style.display = 'block';
              logError('GLTFLoader error: ' + error.message, error.stack);
            }
          );

          window.addEventListener('resize', onWindowResize);
          animate();
        } catch (e) {
          document.getElementById('loading').style.display = 'none';
          document.getElementById('error').style.display = 'block';
          logError('Init error: ' + e.message, e.stack);
        }
      }

      function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }

      function animate() {
        requestAnimationFrame(animate);
        if (controls) controls.update();
        if (renderer && scene && camera) renderer.render(scene, camera);
      }

      init();
    </script>
  </body>
  </html>
  `;
}
