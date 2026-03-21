// Interior 3D Viewer — Room-to-room and sub-node navigation

export function getNavigationJS(): string {
  return `
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
      }`;
}
