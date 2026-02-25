# Debugging JSON Parse Error - Checklist

## Issue
Getting "JSON Parse error: Unexpected character '<'" when trying to login on mobile phone.

## Root Cause
The backend is returning HTML (likely an error page) instead of JSON. This means:
- The API endpoint isn't being reached correctly
- The server is returning a 404/500 error page
- Network connectivity issue between phone and computer

## Steps to Debug

### 1. Verify Django Server is Running
- Check the terminal where `python manage.py runserver 0.0.0.0:8000` is running
- You should see: `Starting development server at http://0.0.0.0:8000/`
- If not, restart the server

### 2. Check Network IP Address
Run this command and note the IPv4 address:
```bash
ipconfig | findstr IPv4
```

Expected output with IP like: `192.168.1.11`

If the IP changed, you need to update ALL these files:
- `frontend/app/index.tsx` (line 10)
- `frontend/app/(tabs)/index.tsx` (line 8)
- `frontend/app/(tabs)/profile.tsx` (line 6)

### 3. Test API from Phone's Browser
Open your phone's browser and go to:
```
http://192.168.1.11:8000/admin
```

**Result:**
- ✅ If you see Django admin login page → Server is reachable
- ❌ If you get "can't connect" → Network/firewall issue

### 4. Watch Django Logs During Login
When you attempt login on your phone, the Django terminal should show:
```
[12/Feb/2026 21:34:00] "POST /api/check-email/ HTTP/1.1" 200 43
```

**If you see nothing:** Phone isn't reaching the server

**If you see errors:** Share the error message

### 5. Common Fixes

#### Fix 1: Restart Django Server
```bash
# Stop (Ctrl+C) then restart:
python manage.py runserver 0.0.0.0:8000
```

#### Fix 2: Windows Firewall
Allow Python through Windows Firewall:
1. Search "Windows Defender Firewall"
2. Click "Allow an app through firewall"
3. Find Python and check both Private and Public networks

#### Fix 3: Reconnect Phone to WiFi
- Turn off WiFi on phone
- Turn it back on
- Ensure connected to same network as computer

## Next Steps After Debugging

Once you identify which step fails, report back with:
1. Can you access `http://192.168.1.11:8000/admin` from phone browser?
2. What does the Django terminal show when you try login?
3. What is your current IP address (from ipconfig)?
