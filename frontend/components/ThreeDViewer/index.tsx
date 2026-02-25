import React, { useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { styles } from './styles';

interface ThreeDViewerProps {
  visible: boolean;
  onClose: () => void;
  modelUrl: string | null;
  propertyName: string;
  onEnterInterior?: () => void;
}

export default function ThreeDViewer({ visible, onClose, modelUrl, propertyName, onEnterInterior }: ThreeDViewerProps) {
  const [loading, setLoading] = useState(true);

  if (!modelUrl) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderIcon}>🏗️</Text>
        <Text style={styles.placeholderText}>No 3D model available</Text>
      </View>
    );
  }

  const htmlContent = `
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
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.2;
            document.getElementById('container').appendChild(renderer.domElement);

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

                // Add Fixed Green Buttons (Only for Graffiti Building)
                if ('${propertyName}' === 'Graffiti') {
                  const fixedButtons = [
                    { name: 'Object_52', pos: [-3.301, 0.283, -0.106], size: [0.399, 0.996, 1.622] },
                    { name: 'Object_36', pos: [2.035, 0.298, -4.451], size: [0.903, 0.765, 0.12] },
                    { name: 'Object_37', pos: [-1.764, 0.178, -2.012], size: [0.903, 0.765, 0.12] },
                    { name: 'Object_34', pos: [3.78, 0.285, 0.737], size: [0.179, 0.766, 1.409] },
                    { name: 'Object_42', pos: [0.663, 0.373, -3.379], size: [0.199, 0.58, 1.591] },
                    { name: 'Object_5', pos: [-3.383, 1.91, -0.118], size: [0.045, 0.983, 0.357] }
                  ];

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
                    
                    // Add to scene so coordinates are world-space (don't inherit model scale)
                    scene.add(mesh);
                    fixedClickableObjects.push(mesh);
                  });
                }

                // Find all meshes to make them selectable (Developer Mode)
                model.traverse((child) => {
                  if (child.isMesh && !child.userData.isFixed) {
                    selectableObjects.push(child);
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
            window.addEventListener('touchstart', onTouchStart);
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

        function onTouchStart(event) {
          if (event.touches.length > 0) {
            mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
            checkIntersection();
          }
        }

        function checkIntersection() {
          raycaster.setFromCamera(mouse, camera);
          
          let hitFixed = false;

          // 1. Check Fixed Green Buttons
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

          // 2. Automatic Mesh Selection (Always check model unless blocked)
          if (model) {
            const modelIntersects = raycaster.intersectObject(model, true);
            if (modelIntersects.length > 0) {
              const hitMesh = modelIntersects[0].object;
              
              if (selectionHighlight) scene.remove(selectionHighlight);

              // Get world bounds
              const targetBox = new THREE.Box3().setFromObject(hitMesh);
              const targetCenter = targetBox.getCenter(new THREE.Vector3());
              const targetSize = targetBox.getSize(new THREE.Vector3());

              // Yellow highlight
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

              // Report coords
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

  return (
    <View style={styles.container}>
      <WebView
        source={{ html: htmlContent }}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        mixedContentMode="always"
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'log') {
              console.log('[WebView Log]', data.message);
            } else if (data.type === 'error') {
              console.error('[WebView Error]', data.message);
            } else if (data.type === 'fixed_click') {
              console.log('--- FIXED BUTTON CLICKED ---');
              console.log('Button:', data.name);
              console.log('Position (Center):', JSON.stringify(data.center));
              console.log('Size:', JSON.stringify(data.size));
              console.log('Result: Click Registered');
              console.log('----------------------------');

              if (onEnterInterior) {
                onEnterInterior();
              }
            } else if (data.type === 'selection') {
              console.log('--- NEW MESH LOG ---');
              console.log('Name:', data.meshName);
              console.log('Position (Center):', JSON.stringify(data.center.map((n: number) => parseFloat(n.toFixed(3)))));
              console.log('Size:', JSON.stringify(data.size.map((n: number) => parseFloat(n.toFixed(3)))));
              console.log('---------------------');
            }
          } catch (e) {
            console.log('[WebView Message]', event.nativeEvent.data);
          }
        }}
        onError={() => setLoading(false)}
      />
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading 3D Viewer...</Text>
        </View>
      )}
    </View>
  );
}

