export const CameraMovementScript = `
// ========================================
// Camera Movement — 2 Nodes, Fixed + 360
// ========================================

// ---------- BLENDER COORDS ----------

var blenderNodes = {
  Node_A: { x: 0.21206,  y: -0.097888, z: 1.5867 },
  Node_B: { x: -3.6825, y: -2.357,   z: 1.8756 }
};

// ---------- STATE ----------

var worldNodes      = {};
var currentNodeName = 'Node_A';
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
  updateNavButton();
}

// Smooth fly to a node
window.moveCameraToNode = function(nodeName) {
  if (isMovingCamera || !worldNodes[nodeName]) return;
  if (nodeName === currentNodeName) return;
  isMovingCamera = true;

  var startPos    = camera.position.clone();
  var startTarget = controls.target.clone();
  var endPos      = worldNodes[nodeName].clone();
  var endTarget   = worldNodes[nodeName].clone().add(new THREE.Vector3(0, 0, -0.01));

  var duration  = 1800;
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
      updateNavButton();
    }
  }
  requestAnimationFrame(animate);
};

// ---------- FIXED CONTROLS (rotate only, no movement) ----------

function applyFixedControls() {
  controls.enablePan     = false;
  controls.enableZoom    = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed   = 0.5;
  controls.minDistance    = 0.01;
  controls.maxDistance    = 0.01;
}

// ---------- NAV BUTTON ----------

var navBtn = null;

function updateNavButton() {
  if (!navBtn) return;
  var next  = currentNodeName === 'Node_A' ? 'Node_B' : 'Node_A';
  var label = next === 'Node_A' ? 'Room A' : 'Room B';
  navBtn.innerText = 'Go to ' + label;
  navBtn.onclick = function() { window.moveCameraToNode(next); };
}

function createNavButton() {
  var old = document.getElementById('__navBtn');
  if (old) old.remove();

  navBtn = document.createElement('button');
  navBtn.id = '__navBtn';
  navBtn.className = 'nav-btn';
  document.body.appendChild(navBtn);
  updateNavButton();
}

// ---------- ORANGE MARKER SPHERES ----------

function createMarkerSpheres() {
  var geo = new THREE.SphereGeometry(0.12, 24, 24);
  var names = Object.keys(worldNodes);
  for (var i = 0; i < names.length; i++) {
    var name = names[i];
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

// ---------- INIT ----------

window.initializeCameraNodes = function(center, scale) {
  var names = Object.keys(blenderNodes);
  for (var i = 0; i < names.length; i++) {
    var name = names[i];
    var raw  = blenderNodes[name];
    worldNodes[name] = toThreeCoords(raw).sub(center).multiplyScalar(scale);
  }

  applyFixedControls();
  createMarkerSpheres();
  createNavButton();

  window.nodeRaycaster = new THREE.Raycaster();
  window.addEventListener('pointerdown', onSphereClicked, false);

  // Start at Node A
  placeCameraAtNode('Node_A');
};
`;