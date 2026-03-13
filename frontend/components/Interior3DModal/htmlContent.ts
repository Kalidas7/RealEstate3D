export const CameraMovementStyles = `
  .nav-container {
    position: absolute;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(0, 0, 0, 0.6);
    padding: 8px 16px;
    border-radius: 28px;
    border: 1px solid rgba(255,255,255,0.15);
    backdrop-filter: blur(10px);
    z-index: 100;
    pointer-events: auto;
  }
  .nav-btn-small {
    padding: 8px 16px;
    background: rgba(255, 102, 0, 0.9);
    color: white;
    border: none;
    border-radius: 20px;
    font-weight: bold;
    font-size: 13px;
    cursor: pointer;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    transition: background 0.2s, transform 0.15s, opacity 0.2s;
  }
  .nav-btn-small:active {
    transform: scale(0.95);
  }
  .nav-btn-small:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: rgba(150, 150, 150, 0.5);
  }
  .nav-label {
    color: white;
    font-size: 14px;
    font-weight: 600;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    min-width: 70px;
    text-align: center;
  }
  .audio-btn {
    padding: 8px 14px;
    background: rgba(102, 126, 234, 0.9);
    color: white;
    border: none;
    border-radius: 20px;
    font-weight: bold;
    font-size: 16px;
    cursor: pointer;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    transition: background 0.2s, transform 0.15s;
    display: none;
  }
  .audio-btn:active {
    transform: scale(0.95);
  }
  .audio-btn.visible {
    display: inline-block;
  }
  .audio-btn.playing {
    background: rgba(234, 102, 102, 0.9);
  }
`;

export function generateInteriorHtml(modelUrl: string, audioUrls?: (string | null)[]): string {
  const audioNode1 = audioUrls?.[0] ? `'${audioUrls[0]}'` : 'null';
  const audioNode2 = audioUrls?.[1] ? `'${audioUrls[1]}'` : 'null';
  const audioNode3 = audioUrls?.[2] ? `'${audioUrls[2]}'` : 'null';

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
      .controls {
        position: absolute; bottom: 20px; left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.6); backdrop-filter: blur(10px);
        padding: 8px 16px; border-radius: 20px;
        color: rgba(255,255,255,0.8); font-size: 11px;
        border: 1px solid rgba(255,255,255,0.1);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        white-space: nowrap;
        pointer-events: none;
      }
      #error { display: none; position: absolute; top: 50%; left: 50%;
        transform: translate(-50%, -50%); color: #ff6b6b;
        text-align: center; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
      ${CameraMovementStyles}
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
    <div class="controls">🔄 Drag to rotate view</div>
    <div id="error"><div style="font-size:48px;margin-bottom:12px">❌</div>Failed to load Interior model</div>

    <script type="module">
      import * as THREE from 'three';
      import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
      import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

      let scene, camera, renderer, controls;
      let model;

      // ========================================
      // Camera Movement — Multi-Node, Fixed + 360
      // ========================================

      // ---------- HARDCODED BLENDER COORDS ----------
      var blenderNodes = {
        Node_1: { x: 152.33, y: 153.55, z: 87.632 },  // View 1 (Cube)
        Node_2: { x: 137.07, y: 530.96, z: 83.236 },  // View 2 (Cube.002)
        Node_3: { x: 153.03, y: 309.02, z: 86.653 }   // View 3 (Cube.001)
      };

      var nodeLabels = {
        Node_1: 'View 1',
        Node_2: 'View 2',
        Node_3: 'View 3'
      };

      // Audio URLs per node (null = no audio for that node)
      var nodeAudioUrls = {
        Node_1: ${audioNode1},
        Node_2: ${audioNode2},
        Node_3: ${audioNode3}
      };
      var currentAudio = null;
      var isAudioPlaying = false;

      // Order views sequentially along the Y axis
      var nodeOrder = ['Node_1', 'Node_3', 'Node_2'];

      // ---------- STATE ----------

      var worldNodes      = {};
      var currentNodeName = 'Node_1';
      var isMovingCamera  = false;
      var nodeMeshes      = [];

      // ---------- UTILITIES ----------

      // Blender (Z-up) to Three.js (Y-up)
      function toThreeCoords(coords) {
        return new THREE.Vector3(coords.x, coords.z, -coords.y);
      }

      // ---------- CAMERA ACTIONS ----------

      // Place camera exactly at node — fixed, no offset
      function placeCameraAtNode(nodeName) {
        var pos = worldNodes[nodeName];
        if (!pos) return;
        camera.position.copy(pos);
        controls.target.copy(pos.clone().add(new THREE.Vector3(0, 0, -0.01)));
        controls.update();
        currentNodeName = nodeName;
        updateNavUI();
      }

      // Smooth fly to a node
      window.moveCameraToNode = function(nodeName) {
        if (isMovingCamera || !worldNodes[nodeName]) return;
        if (nodeName === currentNodeName) return;
        stopAudio();
        isMovingCamera = true;

        var startPos    = camera.position.clone();
        var startTarget = controls.target.clone();
        var endPos      = worldNodes[nodeName].clone();
        var endTarget   = worldNodes[nodeName].clone().add(new THREE.Vector3(0, 0, -0.01));

        var duration  = 1800; // time in ms
        var startTime = performance.now();

        function animate(time) {
          var progress = Math.min((time - startTime) / duration, 1);
          var ease = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

          camera.position.lerpVectors(startPos, endPos, ease);
          controls.target.lerpVectors(startTarget, endTarget, ease);
          controls.update();

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            isMovingCamera  = false;
            currentNodeName = nodeName;
            applyFixedControls();
            updateNavUI();
          }
        }
        requestAnimationFrame(animate);
      };

      // ---------- FIXED CONTROLS (rotate only, no movement) ----------

      function applyFixedControls() {
        controls.enablePan     = false;
        controls.enableZoom    = true; // Enabled zooming
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.rotateSpeed   = 0.5;
        // Adjust zoom limits as needed. Using defaults or wide limit since zoom is now enabled.
        controls.minDistance   = 0.01;
        controls.maxDistance   = Infinity; 
      }

      // ---------- AUDIO CONTROLS ----------

      function stopAudio() {
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
          currentAudio = null;
        }
        isAudioPlaying = false;
        var audioBtn = document.getElementById('__audioBtn');
        if (audioBtn) {
          audioBtn.innerText = '🔊';
          audioBtn.classList.remove('playing');
        }
      }

      function toggleAudio() {
        var url = nodeAudioUrls[currentNodeName];
        if (!url) return;

        if (isAudioPlaying && currentAudio) {
          stopAudio();
          return;
        }

        stopAudio();
        currentAudio = new Audio(url);
        currentAudio.play();
        isAudioPlaying = true;

        var audioBtn = document.getElementById('__audioBtn');
        if (audioBtn) {
          audioBtn.innerText = '⏹';
          audioBtn.classList.add('playing');
        }

        currentAudio.onended = function() {
          isAudioPlaying = false;
          var btn = document.getElementById('__audioBtn');
          if (btn) {
            btn.innerText = '🔊';
            btn.classList.remove('playing');
          }
          currentAudio = null;
        };
      }

      // ---------- NAV UI ----------

      function updateNavUI() {
        var navLabel = document.getElementById('__navLabel');
        var prevBtn  = document.getElementById('__prevBtn');
        var nextBtn  = document.getElementById('__nextBtn');
        var audioBtn = document.getElementById('__audioBtn');
        if (!navLabel || !prevBtn || !nextBtn) return;

        navLabel.innerText = nodeLabels[currentNodeName] || currentNodeName;

        // Show/hide audio button based on whether this node has audio
        if (audioBtn) {
          var hasAudio = !!nodeAudioUrls[currentNodeName];
          audioBtn.className = 'audio-btn' + (hasAudio ? ' visible' : '');
          audioBtn.innerText = '🔊';
          audioBtn.classList.remove('playing');
        }

        var idx = nodeOrder.indexOf(currentNodeName);

        if (idx <= 0) {
          prevBtn.disabled = true;
        } else {
          prevBtn.disabled = false;
          prevBtn.onclick = function() { window.moveCameraToNode(nodeOrder[idx - 1]); };
        }

        if (idx >= nodeOrder.length - 1 || idx === -1) {
          nextBtn.disabled = true;
        } else {
          nextBtn.disabled = false;
          nextBtn.onclick = function() { window.moveCameraToNode(nodeOrder[idx + 1]); };
        }
      }

      function createNavUI() {
        var old = document.getElementById('__navContainer');
        if (old) old.remove();

        var container = document.createElement('div');
        container.id = '__navContainer';
        container.className = 'nav-container';

        var prevBtn = document.createElement('button');
        prevBtn.id = '__prevBtn';
        prevBtn.className = 'nav-btn-small';
        prevBtn.innerText = '⬅ Prev';

        var label = document.createElement('span');
        label.id = '__navLabel';
        label.className = 'nav-label';

        var nextBtn = document.createElement('button');
        nextBtn.id = '__nextBtn';
        nextBtn.className = 'nav-btn-small';
        nextBtn.innerText = 'Next ➡';

        var audioBtn = document.createElement('button');
        audioBtn.id = '__audioBtn';
        audioBtn.className = 'audio-btn';
        audioBtn.innerText = '🔊';
        audioBtn.onclick = toggleAudio;

        container.appendChild(prevBtn);
        container.appendChild(label);
        container.appendChild(nextBtn);
        container.appendChild(audioBtn);

        document.body.appendChild(container);
        updateNavUI();
      }

      // ---------- ORANGE MARKER SPHERES ----------

      function createMarkerSpheres() {
        var geo = new THREE.SphereGeometry(0.12, 24, 24);
        for (var i = 0; i < nodeOrder.length; i++) {
          var name = nodeOrder[i];
          var mat = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.85
          });
          var sphere = new THREE.Mesh(geo, mat);
          sphere.position.copy(worldNodes[name]);
          sphere.userData = { nodeName: name };
          scene.add(sphere);
          nodeMeshes.push(sphere);
        }
      }

      // ---------- CLICK ON SPHERE ----------

      function onSphereClicked(event) {
        var mouse = new THREE.Vector2(
          (event.clientX / window.innerWidth) * 2 - 1,
          (event.clientY / window.innerHeight) * -2 + 1
        );
        window.nodeRaycaster.setFromCamera(mouse, camera);
        var hits = window.nodeRaycaster.intersectObjects(nodeMeshes);
        if (hits.length > 0) {
          window.moveCameraToNode(hits[0].object.userData.nodeName);
        }
      }

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

          const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
          scene.add(ambientLight);
          
          const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
          mainLight.position.set(5, 10, 7.5);
          scene.add(mainLight);

          controls = new OrbitControls(camera, renderer.domElement);
          controls.enableDamping = true;
          controls.dampingFactor = 0.05;

          const loader = new GLTFLoader();
          loader.load(
            '${modelUrl}',
            (gltf) => {
              model = gltf.scene;
              
              const box = new THREE.Box3().setFromObject(model);
              const center = box.getCenter(new THREE.Vector3());
              const size = box.getSize(new THREE.Vector3());
              const maxDim = Math.max(size.x, size.y, size.z);
              const scale = 10 / maxDim;
              model.scale.setScalar(scale);

              // Position model so its center is at (0,0,0)
              const scaledCenter = center.clone().multiplyScalar(scale);
              model.position.sub(scaledCenter);
              
              scene.add(model);

              // Initialize nodes
              for (var i = 0; i < nodeOrder.length; i++) {
                var name = nodeOrder[i];
                var raw  = blenderNodes[name];
                
                // 1. Convert to Three.js coordinates (Y-up)
                // 2. Scale exactly like the model
                // 3. Offset exactly like the model
                var threePos = toThreeCoords(raw).multiplyScalar(scale);
                worldNodes[name] = threePos.sub(scaledCenter);
              }

              applyFixedControls();
              // createMarkerSpheres();
              createNavUI();

              window.nodeRaycaster = new THREE.Raycaster();
              // window.addEventListener('pointerdown', onSphereClicked, false);

              // Start at the first node
              placeCameraAtNode(nodeOrder[0]);

              document.getElementById('loading').style.display = 'none';
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'log', message: 'Interior model loaded successfully.' }));
            },
            (xhr) => {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'log', message: 'Loading progress: ' + (xhr.loaded / xhr.total * 100) + '% loaded' }));
            },
            (error) => {
              document.getElementById('loading').style.display = 'none';
              document.getElementById('error').style.display = 'block';
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: 'GLTFLoader error: ' + error.message, stack: error.stack }));
            }
          );

          window.addEventListener('resize', onWindowResize);
          animate();
        } catch (e) {
          document.getElementById('loading').style.display = 'none';
          document.getElementById('error').style.display = 'block';
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: 'Init error: ' + e.message, stack: e.stack }));
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
