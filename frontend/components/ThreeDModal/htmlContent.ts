// ─── Three.js WebView HTML Generator ─────────────────────────────────────
// Generates the HTML string that runs in the WebView.
// Contains: Three.js scene setup, GLTF loader, OrbitControls, raycasting,
// mesh highlighting, and tap-vs-drag detection.

import { BuildingConfig } from './index';

export function generateThreeJsHtml(modelUrl: string, buildingConfig: BuildingConfig): string {
    const configJson = JSON.stringify(buildingConfig);

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
        #click-notification {
          position: absolute; top: 20%; left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 128, 0, 0.8);
          color: white; padding: 10px 20px; border-radius: 10px;
          font-family: sans-serif; font-weight: bold;
          display: none; z-index: 100;
          pointer-events: none;
          transition: opacity 0.3s;
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
      <div id="loading"><div class="spinner"></div>Loading 3D Model...</div>
      <div id="click-notification">Click Registered!</div>
      <div class="controls">🔄 Drag to rotate · 🔍 Pinch to zoom</div>
      <div id="error"><div style="font-size:48px;margin-bottom:12px">❌</div>Failed to load 3D model</div>

      <script type="module">
        import * as THREE from 'three';
        import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
        import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

        let scene, camera, renderer, controls, raycaster, mouse;
        let model;
        let selectableObjects = [];
        let fixedClickableObjects = [];
        let selectionHighlight = null;

        function showNotification() {
          const el = document.getElementById('click-notification');
          el.style.display = 'block';
          el.style.opacity = '1';
          setTimeout(() => {
            el.style.opacity = '0';
            setTimeout(() => { el.style.display = 'none'; }, 300);
          }, 2000);
        }

        function init() {
          try {
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x0a0a0a);
            
            camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.set(0, 5, 12);

            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.2;
            document.getElementById('container').appendChild(renderer.domElement);

            // Neutral studio environment for realistic PBR materials
            const pmremGenerator = new THREE.PMREMGenerator(renderer);
            pmremGenerator.compileEquirectangularShader();
            scene.environment = pmremGenerator.fromScene(new THREE.Scene()).texture;

            raycaster = new THREE.Raycaster();
            mouse = new THREE.Vector2();

            const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
            scene.add(ambientLight);
            
            const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
            mainLight.position.set(5, 10, 7.5);
            scene.add(mainLight);

            controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.rotateSpeed = 0.8;
            controls.touchAction = 'none';

            const loader = new GLTFLoader();
            loader.load(
              '${modelUrl}',
              (gltf) => {
                model = gltf.scene;
                
                // Center and scale model
                const box = new THREE.Box3().setFromObject(model);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 10 / maxDim;
                model.scale.setScalar(scale);
                model.position.sub(center.multiplyScalar(scale));
                
                scene.add(model);

                // Inject building configuration
                const config = ${configJson};
                const fixedButtons = config.fixedButtons || [];
                const interactiveMeshNames = config.interactiveMeshNames || [];

                fixedButtons.forEach(btn => {
                  const geometry = new THREE.BoxGeometry(btn.size[0], btn.size[1], btn.size[2]);
                  const material = new THREE.MeshBasicMaterial({
                    color: 0x00ff00,
                    transparent: true,
                    opacity: 0.5,
                    depthTest: true
                  });
                  const mesh = new THREE.Mesh(geometry, material);
                  mesh.position.set(btn.pos[0], btn.pos[1], btn.pos[2]);
                  mesh.userData = { isFixed: true, name: btn.name, pos: btn.pos, size: btn.size };
                  
                  scene.add(mesh);
                  fixedClickableObjects.push(mesh);
                });

                // Find dynamic meshes to make them interactive or selectable
                model.traverse((child) => {
                  if (child.isMesh) {
                    if (interactiveMeshNames.includes(child.name)) {
                      child.material = new THREE.MeshBasicMaterial({
                        color: 0x00ff00,
                        transparent: true,
                        opacity: 0.5,
                        depthTest: true
                      });
                      child.userData = { 
                        isFixed: true, 
                        name: child.name, 
                        pos: [child.position.x, child.position.y, child.position.z], 
                        size: [child.scale.x, child.scale.y, child.scale.z]
                      };
                      fixedClickableObjects.push(child);
                    } else if (!child.userData.isFixed) {
                      selectableObjects.push(child);
                    }
                  }
                });

                document.getElementById('loading').style.display = 'none';
              },
              undefined,
              (error) => {
                document.getElementById('loading').style.display = 'none';
                document.getElementById('error').style.display = 'block';
              }
            );

            window.addEventListener('click', onMouseClick);

            // Tap vs Drag detection — only fire click if finger didn't move
            let touchStartX = 0, touchStartY = 0;
            window.addEventListener('touchstart', (event) => {
              if (event.touches.length > 0) {
                touchStartX = event.touches[0].clientX;
                touchStartY = event.touches[0].clientY;
              }
            });
            window.addEventListener('touchend', (event) => {
              if (event.changedTouches.length > 0) {
                const dx = event.changedTouches[0].clientX - touchStartX;
                const dy = event.changedTouches[0].clientY - touchStartY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                // Only treat as a tap if finger moved less than 10px
                if (dist < 10) {
                  mouse.x = (event.changedTouches[0].clientX / window.innerWidth) * 2 - 1;
                  mouse.y = -(event.changedTouches[0].clientY / window.innerHeight) * 2 + 1;
                  checkIntersection();
                }
              }
            });
            window.addEventListener('resize', onWindowResize);
            animate();
          } catch (e) {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('error').style.display = 'block';
          }
        }

        function onMouseClick(event) {
          mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
          mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
          checkIntersection();
        }

        function checkIntersection() {
          raycaster.setFromCamera(mouse, camera);
          
          let hitFixed = false;

          const fixedIntersects = raycaster.intersectObjects(fixedClickableObjects);
          if (fixedIntersects.length > 0) {
            const obj = fixedIntersects[0].object;
            showNotification();
            window.ReactNativeWebView.postMessage(JSON.stringify({ 
              type: 'fixed_click', 
              name: obj.userData.name,
              center: obj.userData.pos,
              size: obj.userData.size
            }));
            hitFixed = true;
          }

          if (model) {
            const modelIntersects = raycaster.intersectObject(model, true);
            if (modelIntersects.length > 0) {
              const hitMesh = modelIntersects[0].object;
              
              if (selectionHighlight) scene.remove(selectionHighlight);

              const targetBox = new THREE.Box3().setFromObject(hitMesh);
              const targetCenter = targetBox.getCenter(new THREE.Vector3());
              const targetSize = targetBox.getSize(new THREE.Vector3());

              const geometry = new THREE.BoxGeometry(targetSize.x, targetSize.y, targetSize.z);
              const material = new THREE.MeshBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0.4,
                depthTest: false
              });
              selectionHighlight = new THREE.Mesh(geometry, material);
              selectionHighlight.position.copy(targetCenter);
              scene.add(selectionHighlight);

              window.ReactNativeWebView.postMessage(JSON.stringify({ 
                type: 'selection',
                meshName: hitMesh.name || 'Unnamed Mesh',
                center: [targetCenter.x, targetCenter.y, targetCenter.z],
                size: [targetSize.x, targetSize.y, targetSize.z]
              }));
            }
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
