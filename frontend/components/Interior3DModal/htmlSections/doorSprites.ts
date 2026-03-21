// Interior 3D Viewer — 3D door sprite markers and tap detection

export function getDoorSpritesJS(): string {
  return `
      // ========================================
      // 3D Door Sprites (tappable in scene)
      // ========================================
      function makeDoorTexture(label) {
        var canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 96;
        var ctx = canvas.getContext('2d');

        // Ghost button: transparent fill, blue border, rounded rect
        var r = 28;
        var x = 4, y = 4, w = 248, h = 88;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();

        ctx.fillStyle = 'rgba(10, 10, 20, 0.5)';
        ctx.fill();
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Label text
        ctx.fillStyle = '#667eea';
        ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, 128, 48);

        return new THREE.CanvasTexture(canvas);
      }

      function createDoorSprites() {
        for (var i = 0; i < doors.length; i++) {
          var d = doors[i];

          // Determine which room this door leads to (label shown depends on perspective)
          // We create two sprites per door — one for each direction
          var labelFrom = rooms[d.to] ? rooms[d.to].label : d.to;
          var labelTo = rooms[d.from] ? rooms[d.from].label : d.from;

          var texture = makeDoorTexture(labelFrom);
          var spriteMat = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: false,
            sizeAttenuation: true
          });
          var sprite = new THREE.Sprite(spriteMat);
          sprite.position.copy(d.position);
          sprite.scale.set(0.55, 0.2, 1);
          sprite.userData = {
            doorIndex: i, from: d.from, to: d.to,
            labelFrom: labelFrom, labelTo: labelTo,
            texFrom: texture,
            texTo: makeDoorTexture(labelTo)
          };
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

          // Show the label of the room the door leads TO (from current perspective)
          if (isConnected) {
            if (d.from === currentRoomId) {
              sp.material.map = sp.userData.texFrom;
            } else {
              sp.material.map = sp.userData.texTo;
            }
            sp.material.needsUpdate = true;
          }
        }
      }

      var _pointerDownPos = null;
      var _pointerDownTime = 0;

      function onPointerDown(event) {
        _pointerDownPos = { x: event.clientX, y: event.clientY };
        _pointerDownTime = performance.now();
      }

      function onPointerUp(event) {
        if (isMovingCamera || !_pointerDownPos) return;

        // Only count as tap if finger moved less than 10px and held less than 300ms
        var dx = event.clientX - _pointerDownPos.x;
        var dy = event.clientY - _pointerDownPos.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var elapsed = performance.now() - _pointerDownTime;
        _pointerDownPos = null;

        if (dist > 10 || elapsed > 300) return;

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
      }`;
}
