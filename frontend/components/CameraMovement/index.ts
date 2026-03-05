// ========================================
// Camera Movement — Dynamic Nodes with Adjacency Navigation
// ========================================
// Accepts nodes from the backend via initializeCameraNodes().
// First node = entry point. Adjacent nodes get visible buttons.
// All other nodes are in a collapsible "All Rooms" menu.

export function generateCameraMovementScript(nodesJson: string): string {
  return `
// ---------- DYNAMIC NODES (injected from backend) ----------

var rawNodes = ${nodesJson};

// ---------- STATE ----------

var worldNodes      = {};
var nodeLabels      = [];
var currentNodeName = '';
var isMovingCamera  = false;
var nodeMeshes      = [];
var adjacencyRadius = 8; // Blender-space distance threshold for adjacency

// ---------- UTILITIES ----------

// Blender (Z-up) to Three.js (Y-up)
function toThreeCoords(coords) {
  return new THREE.Vector3(coords.x, coords.z, -coords.y);
}

function getDistance(a, b) {
  return Math.sqrt(
    Math.pow(a.x - b.x, 2) +
    Math.pow(a.y - b.y, 2) +
    Math.pow(a.z - b.z, 2)
  );
}

function getAdjacentNodes(nodeName) {
  var current = worldNodes[nodeName];
  if (!current) return [];
  var adjacent = [];
  for (var i = 0; i < nodeLabels.length; i++) {
    var name = nodeLabels[i];
    if (name === nodeName) continue;
    var dist = current.distanceTo(worldNodes[name]);
    adjacent.push({ name: name, dist: dist });
  }
  // Sort by distance, take the closest ones within radius
  adjacent.sort(function(a, b) { return a.dist - b.dist; });
  // If no nodes within radius, show the 3 closest anyway
  var withinRadius = adjacent.filter(function(a) { return a.dist < adjacencyRadius; });
  if (withinRadius.length === 0 && adjacent.length > 0) {
    withinRadius = adjacent.slice(0, Math.min(3, adjacent.length));
  }
  return withinRadius.map(function(a) { return a.name; });
}

// ---------- CAMERA ACTIONS ----------

function placeCameraAtNode(nodeName) {
  var pos = worldNodes[nodeName];
  if (!pos) return;
  camera.position.copy(pos);
  controls.target.copy(pos.clone().add(new THREE.Vector3(0, 0, -0.01)));
  controls.update();
  currentNodeName = nodeName;
  updateNavUI();
}

window.moveCameraToNode = function(nodeName) {
  if (isMovingCamera || !worldNodes[nodeName]) return;
  if (nodeName === currentNodeName) return;
  isMovingCamera = true;

  // Close menu if open
  var menu = document.getElementById('__allRoomsMenu');
  if (menu) menu.style.display = 'none';

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
      updateNavUI();
    }
  }
  requestAnimationFrame(animate);
};

// ---------- FIXED CONTROLS ----------

function applyFixedControls() {
  controls.enablePan     = false;
  controls.enableZoom    = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed   = 0.5;
  controls.minDistance    = 0.01;
  controls.maxDistance    = 0.01;
}

// ---------- NAVIGATION UI ----------

function updateNavUI() {
  // Get adjacent nodes
  var adjacent = getAdjacentNodes(currentNodeName);
  var nonAdjacent = nodeLabels.filter(function(n) {
    return n !== currentNodeName && adjacent.indexOf(n) === -1;
  });

  // Adjacent buttons container
  var container = document.getElementById('__adjBtns');
  if (!container) return;
  container.innerHTML = '';

  for (var i = 0; i < adjacent.length; i++) {
    (function(name) {
      var btn = document.createElement('button');
      btn.className = 'adj-btn';
      btn.innerText = name;
      btn.onclick = function() { window.moveCameraToNode(name); };
      container.appendChild(btn);
    })(adjacent[i]);
  }

  // "All Rooms" menu button — only show if there are non-adjacent nodes
  var menuBtn = document.getElementById('__menuBtn');
  if (menuBtn) {
    menuBtn.style.display = nonAdjacent.length > 0 ? 'block' : 'none';
  }

  // Update menu contents
  var menu = document.getElementById('__allRoomsMenu');
  if (menu) {
    menu.innerHTML = '';
    // Add current location header
    var header = document.createElement('div');
    header.className = 'menu-header';
    header.innerText = '📍 ' + currentNodeName;
    menu.appendChild(header);

    var allOther = nodeLabels.filter(function(n) { return n !== currentNodeName; });
    for (var j = 0; j < allOther.length; j++) {
      (function(name) {
        var item = document.createElement('button');
        item.className = 'menu-item';
        // Mark adjacent nodes visually
        if (adjacent.indexOf(name) !== -1) {
          item.innerText = '● ' + name;
        } else {
          item.innerText = name;
        }
        item.onclick = function() {
          window.moveCameraToNode(name);
          menu.style.display = 'none';
        };
        menu.appendChild(item);
      })(allOther[j]);
    }
  }
}

function createNavUI() {
  // Adjacent buttons row
  var container = document.createElement('div');
  container.id = '__adjBtns';
  container.className = 'adj-btns-container';
  document.body.appendChild(container);

  // "All Rooms" menu toggle
  var menuBtn = document.createElement('button');
  menuBtn.id = '__menuBtn';
  menuBtn.className = 'menu-toggle-btn';
  menuBtn.innerText = '☰';
  menuBtn.onclick = function() {
    var menu = document.getElementById('__allRoomsMenu');
    if (menu) {
      menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    }
  };
  document.body.appendChild(menuBtn);

  // All Rooms dropdown menu
  var menu = document.createElement('div');
  menu.id = '__allRoomsMenu';
  menu.className = 'all-rooms-menu';
  menu.style.display = 'none';
  document.body.appendChild(menu);
}

// ---------- ORANGE MARKER SPHERES ----------

function createMarkerSpheres() {
  var geo = new THREE.SphereGeometry(0.12, 24, 24);
  for (var i = 0; i < nodeLabels.length; i++) {
    var name = nodeLabels[i];
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
  // Convert raw nodes to world coords
  for (var i = 0; i < rawNodes.length; i++) {
    var node = rawNodes[i];
    nodeLabels.push(node.label);
    worldNodes[node.label] = toThreeCoords({ x: node.x, y: node.y, z: node.z })
      .sub(center).multiplyScalar(scale);
  }

  applyFixedControls();
  createMarkerSpheres();
  createNavUI();

  window.nodeRaycaster = new THREE.Raycaster();
  window.addEventListener('pointerdown', onSphereClicked, false);

  // Start at first node (entry point)
  if (nodeLabels.length > 0) {
    placeCameraAtNode(nodeLabels[0]);
  }
};
`;
}