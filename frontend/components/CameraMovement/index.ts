export const CameraMovementScript = `
// ========================================
// Camera Movement — Multi-Node, Fixed + 360
// ========================================

// ---------- BLENDER COORDS ----------
// Adjusted to form a logical straight line, based on center nodes
var blenderNodes = {
  Node_1: { x: 147.5, y: 153.5, z: 85.8 },  // View 1
  Node_2: { x: 147.5, y: 309.0, z: 85.8 },  // View 2
  Node_3: { x: 147.5, y: 531.0, z: 85.8 }   // View 3
};

var nodeLabels = {
  Node_1: 'View 1',
  Node_2: 'View 2',
  Node_3: 'View 3'
};

var nodeOrder = ['Node_1', 'Node_2', 'Node_3'];

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
  controls.enableZoom    = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed   = 0.5;
  controls.minDistance   = 0.01;
  controls.maxDistance   = 0.01;
}

// ---------- NAV UI ----------

function updateNavUI() {
  var navLabel = document.getElementById('__navLabel');
  var prevBtn  = document.getElementById('__prevBtn');
  var nextBtn  = document.getElementById('__nextBtn');
  if (!navLabel || !prevBtn || !nextBtn) return;

  navLabel.innerText = nodeLabels[currentNodeName] || currentNodeName;

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

  container.appendChild(prevBtn);
  container.appendChild(label);
  container.appendChild(nextBtn);

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

// ---------- INIT ----------

window.initializeCameraNodes = function(center, scale) {
  for (var i = 0; i < nodeOrder.length; i++) {
    var name = nodeOrder[i];
    var raw  = blenderNodes[name];
    worldNodes[name] = toThreeCoords(raw).sub(center).multiplyScalar(scale);
  }

  applyFixedControls();
  createMarkerSpheres();
  createNavUI();

  window.nodeRaycaster = new THREE.Raycaster();
  window.addEventListener('pointerdown', onSphereClicked, false);

  // Start at the first node
  placeCameraAtNode(nodeOrder[0]);
};
`;