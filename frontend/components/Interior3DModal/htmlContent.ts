// ============================================================
// Interior 3D HTML Content — Room/Door Auto-Discovery System
// ============================================================
// Composes HTML from sub-sections for readability.
// Each section is in its own file under htmlSections/.
// ============================================================

import { getInteriorCSS } from './htmlSections/css';
import { getGlobalsJS } from './htmlSections/globals';
import { getDiscoveryJS } from './htmlSections/discovery';
import { getCameraJS } from './htmlSections/camera';
import { getNavigationJS } from './htmlSections/navigation';
import { getDoorSpritesJS } from './htmlSections/doorSprites';
import { getNavUIJS } from './htmlSections/navUI';
import { getSceneInitJS } from './htmlSections/sceneInit';

export function generateInteriorHtml(modelUrl: string): string {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    ${getInteriorCSS()}
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
    <div id="error"><div style="font-size:48px;margin-bottom:12px">&#10060;</div>Failed to load Interior model</div>

    <script type="module">
      import * as THREE from 'three';
      import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
      import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

      ${getGlobalsJS()}
      ${getDiscoveryJS()}
      ${getCameraJS()}
      ${getNavigationJS()}
      ${getDoorSpritesJS()}
      ${getNavUIJS()}
      ${getSceneInitJS(modelUrl)}
    </script>
  </body>
  </html>
  `;
}
