// Interior 3D Viewer — Room/Door auto-discovery from GLB scene

export function getDiscoveryJS(): string {
  return `
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
      }`;
}
