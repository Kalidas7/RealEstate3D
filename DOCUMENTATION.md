# RealEstate3D — App Documentation

## Architecture Overview

```
┌──────────────────────────────────────────────────┐
│                   BACKEND (Django)                │
│  Render.com → Supabase PostgreSQL                │
│  https://realestate3d.onrender.com               │
│                                                  │
│  models.py → Property, Booking, UserProfile      │
│  REST API → /api/properties/, /api/bookings/     │
└────────────────────┬─────────────────────────────┘
                     │ JSON API
┌────────────────────▼─────────────────────────────┐
│             FRONTEND (Expo / React Native)        │
│                                                  │
│  app/                     ← Expo Router pages    │
│  components/              ← Shared components    │
│  components/ThreeDModal/  ← Reusable 3D viewer   │
│  components/buildings/    ← Per-building configs  │
└──────────────────────────────────────────────────┘
```

---

## Backend

### Property Model (`backend/api/models.py`)

| Field | Type | Purpose |
|-------|------|---------|
| `name` | CharField | Building name (e.g., "Skyline towers") |
| `location` | CharField | Location text |
| `price` | CharField | Price display string |
| `image` | ImageField | Card image for home page |
| `three_d_file` | FileField | Exterior 3D model (.glb) |
| `interior_file` | FileField | Interior 3D model (.glb) |
| `description` | TextField | About text |
| `bedrooms` | IntegerField | Number of bedrooms |
| `bathrooms` | IntegerField | Number of bathrooms |
| `area` | CharField | Area (e.g., "1200 sqft") |
| `exterior_config` | **JSONField** | 3D interaction config (see below) |

### `exterior_config` JSON Format

This field stores the 3D mesh interaction data for each building. It supports two types of interactive elements:

```json
{
  "fixedButtons": [
    {
      "name": "Object_52",
      "pos": [-3.301, 0.283, -0.106],
      "size": [0.399, 0.996, 1.622]
    }
  ],
  "interactiveMeshNames": ["Geom3D106", "Geom3D022", "Geom3D050"]
}
```

- **`fixedButtons`** — Green box meshes positioned at specific coordinates in world space. Used for Graffiti (the model doesn't have named meshes for interaction zones).
- **`interactiveMeshNames`** — Names of meshes within the .glb model that should be highlighted green. Used for Skyline Towers (the model has named meshes).

Both types trigger the "Enter Interior" action when tapped.

---

## Django Admin — How to Add a New Building

### Step 1: Deploy the migration
Push `backend/api/migrations/0005_property_exterior_config.py` to your repo and deploy to Render. The migration runs automatically via the build command.

### Step 2: Add/Edit a property in Django Admin

1. Go to `https://realestate3d.onrender.com/admin/`
2. Log in with your superuser credentials
3. Navigate to **Api → Properties**
4. Click on an existing property or **ADD PROPERTY**

### Step 3: Fill in the `exterior_config` field

For a building like **Skyline Towers** (uses named meshes):
```json
{"fixedButtons": [], "interactiveMeshNames": ["Geom3D106", "Geom3D022", "Geom3D050", "Geom3D101"]}
```

For a building like **Graffiti** (uses positioned box buttons):
```json
{
  "fixedButtons": [
    {"name": "Object_52", "pos": [-3.301, 0.283, -0.106], "size": [0.399, 0.996, 1.622]},
    {"name": "Object_36", "pos": [2.035, 0.298, -4.451], "size": [0.903, 0.765, 0.12]},
    {"name": "Object_37", "pos": [-1.764, 0.178, -2.012], "size": [0.903, 0.765, 0.12]},
    {"name": "Object_34", "pos": [3.78, 0.285, 0.737], "size": [0.179, 0.766, 1.409]},
    {"name": "Object_42", "pos": [0.663, 0.373, -3.379], "size": [0.199, 0.58, 1.591]},
    {"name": "Object_5", "pos": [-3.383, 1.91, -0.118], "size": [0.045, 0.983, 0.357]}
  ],
  "interactiveMeshNames": []
}
```

### Step 4: Finding mesh names/coordinates for a new building

1. Upload the `.glb` file to the property
2. Open the building in the app
3. Tap on different parts of the model
4. Check the console logs — each tap logs the mesh name, position, and size:
   ```
   --- NEW MESH LOG ---
   Name: SomeMeshName
   Position (Center): [-1.234, 0.567, -2.890]
   Size: [0.5, 1.0, 0.3]
   ```
5. Note down the mesh names you want interactive
6. Add them to `interactiveMeshNames` in Django Admin

---

## Frontend Code Flow

### 1. Home Screen → Property Selection

```
app/(tabs)/index.tsx (Home)
  → Fetches GET /api/properties/
  → Renders property cards
  → On tap: navigates to /property/[id] with property JSON
```

### 2. Property Detail Screen → 3D Viewer

```
app/property/[id]/index.tsx (Router)
  → Parses property from route params
  → Extracts: modelUrl, interiorUrl, exteriorConfig
  → Renders building-specific component based on property.name
```

### 3. Exterior Rendering (Skyline or Graffiti)

```
Router
  → property.name === 'Skyline towers'
    → SkylineExterior (thin wrapper)
      → ThreeDModal (shared 3D engine)
  → else
    → GraffitiExterior (thin wrapper)
      → ThreeDModal (shared 3D engine)
```

Each building wrapper:
1. Accepts `buildingConfig` from router (sourced from `property.exterior_config` API field)
2. Falls back to local `config.ts` if API config is empty
3. Passes everything to `ThreeDModal`

### 4. ThreeDModal — The 3D Engine (`components/ThreeDModal/index.tsx`)

```
ThreeDModal
  → Generates HTML string with Three.js code
  → Renders in WebView
  → Three.js engine:
      1. Creates scene, camera, renderer (WebGL)
      2. Adds PMREMGenerator neutral environment
      3. Adds ambient + directional lights
      4. Sets up OrbitControls (damping, rotateSpeed)
      5. Loads .glb model via GLTFLoader
      6. Injects building config:
         - fixedButtons → Creates green box meshes at positions
         - interactiveMeshNames → Colors matching meshes green
      7. Touch handling:
         - touchstart → records finger position
         - touchend → checks if moved < 10px (tap vs drag)
         - If tap: raycasts → checks green meshes → fires onEnterInterior
      8. Animation loop with damped controls
```

### 5. Interior Rendering

```
Router (viewMode === 'interior')
  → SkylineInterior or GraffitiInterior
    → WebView with Three.js
    → CameraMovement system (shared component)
      → Node-based navigation between rooms
      → Tap on nodes to move camera
```

### 6. Booking Flow

```
Property Detail → "Book a Viewing" button
  → BookingModal (date/time picker)
  → POST /api/bookings/
  → Confirmation + "Add to Calendar" option
```

---

## Project Structure

```
frontend/
├── app/
│   ├── (tabs)/              ← Tab navigation (Home, Buildings, Profile)
│   ├── (auth)/              ← Login/Register screens
│   └── property/[id]/       ← Property detail + 3D viewer
├── components/
│   ├── ThreeDModal/         ← ★ Reusable 3D exterior viewer
│   │   ├── index.tsx        ← WebView + Three.js engine
│   │   └── styles.ts
│   ├── CameraMovement/      ← Shared interior camera navigation
│   ├── BookingModal/        ← Date/time booking picker
│   └── buildings/
│       ├── Graffiti/
│       │   ├── exterior/    ← Thin wrapper → ThreeDModal
│       │   │   ├── index.tsx
│       │   │   └── config.ts  ← Fallback config (fixedButtons)
│       │   └── interior/    ← Interior WebView viewer
│       └── Skyline towers/
│           ├── exterior/    ← Thin wrapper → ThreeDModal
│           │   ├── index.tsx
│           │   └── config.ts  ← Fallback config (interactiveMeshNames)
│           └── interior/    ← Interior WebView viewer

backend/
├── config/                  ← Django settings, urls, wsgi
├── api/
│   ├── models.py            ← Property, Booking, UserProfile
│   ├── serializers.py       ← REST serializers
│   ├── views.py             ← API views
│   ├── urls.py              ← API routes
│   └── migrations/          ← Database migrations
```

---

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `expo` | React Native framework |
| `expo-router` | File-based routing |
| `react-native-webview` | Renders Three.js 3D viewer |
| `three` (via CDN) | 3D engine (loaded in WebView) |
| `@react-native-async-storage` | Local auth token storage |
| `expo-blur` | Glassmorphism UI effects |
| `expo-linear-gradient` | Gradient backgrounds |
| `Django` | Backend framework |
| `djangorestframework` | REST API |
| `dj-database-url` | Database URL parsing |
| `gunicorn` | Production WSGI server |

---

## Deployment

- **Backend**: Render.com (free tier, auto-deploys from Git)
  - Build: `pip install -r requirements.txt && python manage.py migrate`
  - Start: `gunicorn config.wsgi:application`
  - Database: Supabase PostgreSQL
- **Frontend**: Expo Go (development) / EAS Build (production)
hello