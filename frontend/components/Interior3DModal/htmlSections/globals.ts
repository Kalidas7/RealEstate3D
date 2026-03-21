// Interior 3D Viewer — Global variables and logging helpers

export function getGlobalsJS(): string {
  return `
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
      }`;
}
