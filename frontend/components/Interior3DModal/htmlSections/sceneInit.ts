// Interior 3D Viewer — Scene initialization, model loading, render loop

export function getSceneInitJS(modelUrl: string): string {
  return `
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
              modelScale = 15 / maxDim;
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

              // Listen for door taps in 3D (down + up to distinguish tap from drag)
              window.addEventListener('pointerdown', onPointerDown, false);
              window.addEventListener('pointerup', onPointerUp, false);

              // Hide loading
              document.getElementById('loading').style.display = 'none';

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

      init();`;
}
