# Login Troubleshooting Guide

## Quick Fix: Clear App Cache

If you're experiencing login issues after updating the app, the old cached data might be causing conflicts.

### Method 1: Clear in Expo
1. Close the Expo app
2. In the Expo dev server terminal, press `Shift + R` to reload and clear cache
3. Try logging in again

### Method 2: Uninstall and Reinstall (iOS/Android)
1. On your device, uninstall the Expo Go app (or your development build)
2. Reinstall it from the App Store/Play Store
3. Open your app again in Expo
4. Login fresh

### Method 3: Clear AsyncStorage Programmatically
Open the app and look for any error messages in the console. The app now has automatic cache clearing for corrupted data.

---

## Backend Issues

### 1. "ModuleNotFoundError: No module named 'corsheaders'"
If you see this error, it means you are running the server using the **system Python** instead of the project's **virtual environment**.

**Fix:**
Always use the Python executable inside the `venv` folder:
```bash
cd c:\Users\PREDATOR\3dflat
# Use this exact command:
venv\Scripts\python backend\manage.py runserver 0.0.0.0:8000
```
This ensures all required packages (`corsheaders`, `rest_framework`, etc.) are loaded correctly.

---

## Check These Common Issues

### 1. Server Not Running
Make sure the backend is running:
```bash
cd c:\Users\PREDATOR\3dflat
python manage.py runserver 0.0.0.0:8000
```

### 2. Wrong IP Address
If you're on a different network, update the IP in:
- `frontend/app/index.tsx` (line 10)
- `frontend/app/(tabs)/index.tsx` (line 8)
- `frontend/app/(tabs)/profile.tsx` (line 6)

Find your new IP: `ipconfig` (look for IPv4 Address)

### 3. Check Expo Console
Open the Expo dev tools and look at the console output. You should see:
- "Attempting login for: [your email]"
- "Login response: [server data]"

If you see errors here, share them for debugging.

---

## How to View Console Logs

### On Expo Web:
- Open browser dev tools (F12)
- Go to Console tab

### On Expo Mobile:
- Shake your device
- Tap "Debug Remote JS"
- Check Chrome dev tools console

---

## Still Having Issues?

1. **Clear everything and start fresh**:
   ```bash
   # In frontend directory
   npm start -- --clear
   ```

2. **Check if the email exists**:
   - Go to Django Admin: http://localhost:8000/admin
   - Check Users section to see if your account exists

3. **Reset password in Django Admin** (if email exists):
   - Click on your user
   - Click "this form" under Password field
   - Set a new password
   - Try logging in with the new password
