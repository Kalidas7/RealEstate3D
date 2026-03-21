// Interior 3D Viewer — Camera controls, placement, and animation

export function getCameraJS(): string {
  return `
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

        // Compute total path length for uniform-speed interpolation
        var segLengths = [];
        var totalLength = 0;
        for (var s = 0; s < points.length - 1; s++) {
          var len = points[s + 1].clone().sub(points[s]).length();
          segLengths.push(len);
          totalLength += len;
        }

        // Precompute direction at each point for smooth look interpolation
        var directions = [];
        for (var s = 0; s < points.length; s++) {
          if (s < points.length - 1) {
            directions.push(points[s + 1].clone().sub(points[s]).normalize());
          } else {
            directions.push(directions[s - 1].clone());
          }
        }

        var startTime = performance.now();

        function tick(time) {
          var elapsed = time - startTime;
          var progress = Math.min(elapsed / duration, 1);

          // Ease in-out quad
          var ease = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

          // Map eased progress to position along the path
          var targetDist = ease * totalLength;
          var accumulated = 0;
          var seg = 0;
          for (seg = 0; seg < segLengths.length; seg++) {
            if (accumulated + segLengths[seg] >= targetDist) break;
            accumulated += segLengths[seg];
          }
          seg = Math.min(seg, segLengths.length - 1);
          var segProgress = segLengths[seg] > 0 ? (targetDist - accumulated) / segLengths[seg] : 0;

          // Interpolate position
          camera.position.lerpVectors(points[seg], points[seg + 1], segProgress);

          // Smoothly interpolate look direction between segment directions
          var lookDir = directions[seg].clone().lerp(directions[Math.min(seg + 1, directions.length - 1)], segProgress).normalize();
          var lookTarget = camera.position.clone().add(lookDir.multiplyScalar(0.01));
          controls.target.copy(lookTarget);
          controls.update();

          if (progress >= 1) {
            // Smoothly rotate to look back at where we came from using quaternion slerp
            var finalPos = points[points.length - 1];
            var prevPos = points[points.length - 2];
            var travelDir = finalPos.clone().sub(prevPos).normalize();
            var lookBackDir = prevPos.clone().sub(finalPos).normalize();

            // Add slight upward bias to avoid exact 180-degree edge case
            var biasedLookBack = lookBackDir.clone().add(new THREE.Vector3(0, 0.01, 0)).normalize();

            // Build quaternions for start (travel dir) and end (look back) orientations
            var refDir = new THREE.Vector3(0, 0, -1);
            var startQuat = new THREE.Quaternion().setFromUnitVectors(refDir, travelDir);
            var endQuat = new THREE.Quaternion().setFromUnitVectors(refDir, biasedLookBack);

            var lookDist = 0.5;
            var turnStart = performance.now();
            var turnDuration = 800;

            function turnTick(t) {
              var turnElapsed = t - turnStart;
              var turnProgress = Math.min(turnElapsed / turnDuration, 1);
              // Ease in-out quad for smooth acceleration and deceleration
              var turnEase = turnProgress < 0.5
                ? 2 * turnProgress * turnProgress
                : 1 - Math.pow(-2 * turnProgress + 2, 2) / 2;

              // Slerp between the two orientations
              var currentQuat = startQuat.clone().slerp(endQuat, turnEase);
              var currentDir = refDir.clone().applyQuaternion(currentQuat);
              controls.target.copy(finalPos.clone().add(currentDir.multiplyScalar(lookDist)));
              controls.update();

              if (turnProgress >= 1) {
                isMovingCamera = false;
                if (onComplete) onComplete();
              } else {
                requestAnimationFrame(turnTick);
              }
            }
            requestAnimationFrame(turnTick);
          } else {
            requestAnimationFrame(tick);
          }
        }
        requestAnimationFrame(tick);
      }`;
}
