# Django Admin Guide - Adding 3D Properties

This guide will walk you through adding properties with 3D files to your application via the Django Admin panel.

---

## Step 1: Create a Superuser (If You Haven't Already)

If you don't have an admin account yet, create one:

```bash
cd c:\Users\PREDATOR\3dflat
venv\Scripts\python backend\manage.py createsuperuser
```

Follow the prompts:
- **Username**: Choose any username (e.g., `admin`)
- **Email**: Your email address
- **Password**: Create a strong password

---

## Step 2: Start the Development Server

Make sure your server is running:

```bash
cd c:\Users\PREDATOR\3dflat
venv\Scripts\python backend\manage.py runserver 0.0.0.0:8000
```

---

## Step 3: Access the Admin Panel

1. Open your browser
2. Go to: **http://localhost:8000/admin**
3. Log in with the superuser credentials you created

---

## Step 4: Add a Property

### Navigate to Properties
1. In the admin dashboard, look for the **API** section
2. Click on **Properties**
3. Click the **"Add Property"** button (top right)

### Fill in Property Details

#### Required Fields:
- **Name**: The property name (e.g., "Skyline Towers")
- **Location**: Address or area (e.g., "Downtown, City Center")
- **Price**: Property price (e.g., "$450,000")
- **Image**: Upload a nice building/property image (JPEG/PNG)
- **Description**: Detailed property description
- **Bedrooms**: Number of bedrooms (integer, e.g., 3)
- **Bathrooms**: Number of bathrooms (integer, e.g., 2)
- **Area**: Property size (e.g., "1200 sqft")

#### Optional Field:
- **Three d file**: Upload a 3D model file (.glb or .gltf format)
  - **Where to get 3D files**: You can download free 3D building models from:
    - [Sketchfab](https://sketchfab.com/) (search for buildings, download as GLB)
    - [Poly Pizza](https://poly.pizza/)
    - [Free3D](https://free3d.com/)
  - **Important**: Make sure the file is in `.glb` or `.gltf` format

---

## Step 5: Save the Property

1. Once all fields are filled, click **"Save"** at the bottom
2. The property will now appear in your mobile app!

---

## Step 6: View Your Properties in the App

1. Restart your Expo app (if it's already running)
2. Log in to the app
3. You should see your newly added property on the Home screen

---

## Tips

### Image Guidelines
- Use high-quality images (1080px width minimum)
- Landscape orientation works best
- Building/architecture photos look great

### 3D File Guidelines
- GLB format is preferred (smaller file size)
- Keep files under 10MB for better performance
- Test the 3D file in an online viewer first (e.g., [gltf-viewer.donmccurdy.com](https://gltf-viewer.donmccurdy.com/))

### Editing Properties
- Go to **API → Properties** in the admin panel
- Click on any property to edit it
- You can also delete properties from here

---

## Troubleshooting

**Can't see images in the app?**
- Make sure `venv\Scripts\python backend\manage.py runserver 0.0.0.0:8000` is running
- Check that media URLs are configured (already done in `backend/urls.py`)

**3D file not uploading?**
- Check file size (Django default is 2.5MB, can be increased in settings)
- Ensure the file extension is `.glb` or `.gltf`

**No properties showing in the app?**
- Make sure you saved the property in admin
- Check that the API is accessible at `http://192.168.1.6:8000/api/properties/`
- Pull down to refresh in the app

---

## Quick Reference: Admin URL

**Admin Panel**: http://localhost:8000/admin (or http://192.168.1.6:8000/admin)

**Add Property**: Admin → API → Properties → Add Property
