import React, { useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { styles } from './styles';

interface InteriorViewerProps {
  visible: boolean;
  modelUrl: string | null;
}

export default function InteriorViewer({ visible, modelUrl }: InteriorViewerProps) {
  const [loading, setLoading] = useState(true);

  if (!visible) return null;

  if (!modelUrl) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderIcon}>🏠</Text>
        <Text style={styles.placeholderText}>No interior model available</Text>
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
      <div id="loading"><div class="spinner"></div>Loading Interior...</div>
      <div class="controls">🔄 Drag to rotate · 🔍 Pinch to zoom</div>
      <div id="error"><div style="font-size:48px;margin-bottom:12px">❌</div>Failed to load Interior model</div>

      <script type="module">
        import * as THREE from 'three';
        import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
        import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

        let scene, camera, renderer, controls;
        let model;

        function init() {
          try {
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x0a0a0a);
            
            camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.set(0, 5, 12); // Future camera movement logic goes here

            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.2;
            document.getElementById('container').appendChild(renderer.domElement);

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

                document.getElementById('loading').style.display = 'none';
              },
              undefined,
              (error) => {
                document.getElementById('loading').style.display = 'none';
                document.getElementById('error').style.display = 'block';
              }
            );

            window.addEventListener('resize', onWindowResize);
            animate();
          } catch (e) {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('error').style.display = 'block';
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
        onError={() => setLoading(false)}
      />
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading Interior...</Text>
        </View>
      )}
    </View>
  );
}

