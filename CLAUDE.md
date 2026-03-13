# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Veedu** is a 3D real estate viewer mobile app that allows users to view and explore properties using 3D models. The architecture consists of:
- **Frontend**: React Native + Expo with TypeScript
- **Backend**: Django REST Framework + PostgreSQL (Supabase)
- **3D Rendering**: Three.js running in WebView
- **Deployment**: Frontend via Expo/EAS, Backend on Render.com

## Common Commands

### Frontend (Expo/React Native)
```bash
cd frontend
npm install                    # Install dependencies
npm start                      # Start Expo dev server
npm run android                # Run on Android emulator/device
npm run ios                    # Run on iOS simulator
npm run web                    # Run in web browser
npm run lint                   # Run ESLint
```

### Backend (Django)
```bash
cd backend
pip install -r requirements.txt                    # Install Python dependencies
python manage.py runserver 0.0.0.0:8000           # Start dev server
python manage.py migrate                           # Run database migrations
python manage.py makemigrations                    # Create new migrations
python manage.py createsuperuser                   # Create admin user
python manage.py shell                             # Django interactive shell
python manage.py test                              # Run tests
```

**Important**: On Windows, use `venv\Scripts\python` instead of `python` when running Django commands if using a virtual environment.

## Architecture

### Frontend Structure
```
frontend/
├── app/
│   ├── (tabs)/              # Tab navigation (Home, Bookings, Profile)
│   ├── (auth)/              # Authentication screens (Login)
│   ├── property/[id]/       # Property detail page + 3D viewer
│   ├── _layout.tsx          # Root layout with AuthProvider
│   └── index.tsx            # Entry point/redirect logic
├── components/
│   ├── ThreeDModal/         # Reusable 3D exterior viewer (WebView + Three.js)
│   ├── Interior3DModal/     # Interior 3D viewer
│   ├── BookingModal/        # Date/time booking picker
│   ├── LocationModal/       # City/location selection
│   └── PropertyListCard.tsx # Property card component
├── contexts/
│   ├── AuthContext.tsx      # JWT auth state + AsyncStorage
│   └── LikedViewedContext.tsx  # User likes tracking
└── screens/                 # Main screen implementations (imported by app routes)
    ├── Home/
    ├── Login/
    ├── Profile/
    ├── Property/
    └── Bookings/
```

### Backend Structure
```
backend/
├── config/
│   ├── settings.py          # Django settings (JWT, CORS, S3, DB)
│   ├── urls.py              # Root URL configuration
│   └── wsgi.py              # WSGI application entry
└── api/
    ├── models.py            # Property, ListedProperty, Booking, UserProfile, UserLike
    ├── serializers.py       # DRF serializers
    ├── urls.py              # API route definitions
    ├── utils.py             # Geocoding + distance calculation
    └── views/
        ├── auth_views.py    # Login, signup, email check
        ├── user_views.py    # Profile updates, likes
        ├── property_views.py  # Property listing with distance filtering
        └── booking_views.py # Booking creation and management
```

### Key API Endpoints
```
POST /api/check-email/              # Check if email exists
POST /api/signup/                   # Register new user
POST /api/login/                    # Login (returns JWT tokens)
PUT  /api/profile/update/           # Update user profile + profile pic
GET  /api/all-properties/           # Combined sponsored + listed properties
GET  /api/liked-properties/         # User's liked properties
POST /api/likes/                    # Add/remove property like
GET  /api/bookings/                 # Get user's bookings
POST /api/bookings/                 # Create new booking
PUT  /api/bookings/<id>/reschedule/ # Reschedule booking
```

## Authentication Flow

1. **JWT-based authentication** using `djangorestframework_simplejwt`
2. **Token lifetime**: Access tokens last 7 days, refresh tokens last 30 days
3. **Frontend storage**: Tokens and user data stored in AsyncStorage
4. **AuthContext** (`frontend/contexts/AuthContext.tsx`) manages global auth state
5. **Route protection**: Root layout redirects unauthenticated users to `/(auth)/login`

## 3D Model System

### Two Property Types
- **Property** (sponsored): Featured properties shown in horizontal carousel
- **ListedProperty**: All properties shown in vertical list

Both models support the same 3D fields and use the `interactive_mesh_names` field (comma-separated mesh names that trigger interior navigation when clicked).

### 3D Rendering Flow
1. API returns property with `three_d_file` (exterior GLB) and `interior_file` (interior GLB) URLs
2. Property detail screen (`app/property/[id]/index.tsx`) receives property data via route params
3. **ThreeDModal** (`components/ThreeDModal/index.tsx`):
   - Generates HTML with embedded Three.js code
   - Renders in WebView with OrbitControls
   - Highlights meshes listed in `interactive_mesh_names` as green
   - Raycasts on tap to detect clicks on green meshes
   - Sends message to React Native layer to trigger interior view
4. **Interior3DModal** renders interior GLB with camera navigation nodes

### Finding Interactive Mesh Names
To identify which mesh names should be interactive in a new building:
1. Add the property in Django admin without `interactive_mesh_names`
2. Open the property in the app
3. Tap different parts of the 3D model
4. Check console logs for mesh names, positions, and sizes
5. Update the property in Django admin with the desired mesh names (comma-separated)

## Location-Based Filtering

Properties support distance-based filtering:
- User's location stored in AsyncStorage (`user_location`)
- Properties have `latitude` and `longitude` fields (auto-extracted from `location_link` via Google Geocoding API)
- API endpoint `/api/all-properties/?lat=X&lon=Y` filters properties within 20km radius
- Distance calculated using Haversine formula in `backend/api/utils.py:calculate_haversine_distance()`
- Results sorted by distance and include `distance_km` field

## Database and Storage

- **Database**: Supabase PostgreSQL (pooler connection)
- **Media Storage**: Supabase S3-compatible storage via `django-storages`
- **Static Files**: Whitenoise for serving static files
- **Image Uploads**: Profile pictures and property images stored in Supabase bucket `media`
- **3D Model Files**: GLB files stored in `3d_models/` and `3d_models/interiors/` prefixes

## Important Configuration Details

### TypeScript Path Aliases
Frontend uses `@/*` path alias mapping to project root (configured in `tsconfig.json`).
```typescript
import { useAuth } from '@/contexts/AuthContext';
```

### Expo Router File-based Routing
- `(tabs)/` directory creates tab navigation
- `(auth)/` directory creates auth group with separate layout
- `property/[id]/` creates dynamic route with id parameter
- `_layout.tsx` files define nested layouts

### Environment Variables
Backend expects:
- `DB_PASSWORD`: Supabase database password (falls back to hardcoded value)
- AWS S3 credentials are currently hardcoded in `settings.py` (production should use env vars)

## Testing and Development

### Running Backend Locally
The backend needs to be accessible from mobile devices on the same network, so use `0.0.0.0:8000` instead of `127.0.0.1:8000`.

### Building Android APK
```bash
cd frontend
eas build -p android --profile preview
```
Note: `app.json` has `slug: "frontend"` (matching Expo project ID) and `name: "Veedu"` (display name).

## Code Patterns

### Property Data Flow
1. Home screen fetches from `/api/all-properties/` (includes distance filtering)
2. Property data passed via router params: `router.push({ pathname: '/property/[id]', params: { property: JSON.stringify(property) }})`
3. Property screen parses JSON and extracts 3D URLs and config
4. ThreeDModal receives model URL and `interactive_mesh_names` to render interactive 3D view

### Auth Token Management
- Tokens stored in AsyncStorage on login
- Access token included in API requests via `Authorization: Bearer <token>` header
- Logout clears all AsyncStorage keys: `user`, `access_token`, `refresh_token`, `liked_ids`, `liked_properties`, `user_location`

### Profile Picture Handling
- Backend generates unique filenames for profile pictures to prevent cache conflicts
- Frontend no longer needs `?t=` cache buster since filenames are unique
- Profile updates refresh user object in AuthContext which triggers UI updates

## Django Admin

- Admin panel: `http://localhost:8000/admin` (or `https://realestate3d.onrender.com/admin`)
- Used to manage properties, bookings, and users
- Property model includes `interactive_mesh_names` field for configuring 3D interactions

---

## Working Preferences

### Writing Convention for CLAUDE.md Files
- Always use "Teresa" (or "the human") and "Claude" instead of pronouns
- Never use "I", "you", "me", "my", "your" in CLAUDE.md files
- This avoids ambiguity about who "I" or "you" refers to
- Example: "Teresa writes, Claude edits" (not "I write, you edit")

### Planning Protocol

**Always plan before implementation**
- Discuss overall strategy before writing code or making changes
- Ask clarifying questions one at a time so Teresa can give complete answers
- Get approval on the approach before implementation
- Focus on understanding requirements and flow first

**Multi-level planning**
- Plan at the high level (overall project goals and flow)
- Then plan at the task level (specific file or feature details)
- Implement the plan only after both levels are planned and approved

**Check understanding**
- After completing each task, ask if Teresa has questions about what was just done
- Important that Teresa understands all the changes made together

### Feedback Style
- Give clear, direct feedback and critiques — no hedging or gentle suggestions
- Use specific examples rather than vague advice
- Use bullet points for feedback and summaries

### MD File Update Rule
- Claude must ALWAYS ask Teresa before editing any `.md` file
- Say exactly: "I'd like to update [filename] with [what]. Should I proceed?"
- Wait for explicit "yes" before making any changes
- Never change existing content in `.md` files without Teresa's verification
- Verify with Teresa before adding, removing, or updating any `.md` file
- This rule applies every time — no exceptions, even for small edits