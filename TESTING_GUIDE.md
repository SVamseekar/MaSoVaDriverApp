# MaSoVa Driver App - Testing Guide

## Quick Start Testing

### Step 1: Start the Backend Services

```bash
# Navigate to main project
cd /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system

# Start all required services:
# - API Gateway (port 8080)
# - User Service
# - Order Service
# - Delivery Service
# - WebSocket Gateway (port 8090)

# Use your existing startup script or start services individually
```

### Step 2: Start the React Native App

```bash
# Open a new terminal
cd /Users/souravamseekarmarti/Projects/MaSoVaDriverApp

# For Android:
npx react-native run-android

# For iOS (Mac only):
npx react-native run-ios
```

---

## Testing Each Screen

### 1️⃣ DeliveryHomeScreen (Home Tab)

**What to Test:**
- [ ] Screen loads with GPS status section
- [ ] Session time displays (00:00:00 initially)
- [ ] Performance stats show (Deliveries, Earnings, Distance, Avg Time)
- [ ] "How It Works" instruction cards scroll horizontally
- [ ] Pull-to-refresh works
- [ ] GPS toggle (Auto/Manual) switches
- [ ] "My Location" button opens map
- [ ] "Support" button shows alert

**How to Test:**
1. Launch app
2. Login with driver credentials
3. Tap "Home" tab (bottom navigation)
4. Pull down to refresh
5. Toggle GPS switch
6. Tap action buttons

**Expected Backend Data:**
- Driver performance stats from `/api/users/{id}/performance`
- Real-time updates via WebSocket

---

### 2️⃣ ActiveDeliveryScreen (Active Tab)

**What to Test:**
- [ ] Shows "No Active Deliveries" when empty
- [ ] Displays delivery cards when orders exist
- [ ] List/Map view toggle works
- [ ] Customer name, phone, address display correctly
- [ ] "Navigate" button opens Google Maps
- [ ] "Contact" button shows Call/SMS options
- [ ] "Mark as Delivered" shows confirmation dialog
- [ ] Pull-to-refresh updates order list
- [ ] Auto-refreshes every 30 seconds

**How to Test:**
1. Tap "Active" tab
2. Create a test order in backend assigned to driver
3. Pull down to refresh
4. Tap on delivery card actions
5. Try marking delivery as complete

**Expected Backend Data:**
- Orders with status `DISPATCHED` from `/api/orders?status=DISPATCHED`
- Orders filtered by `assignedDriver.id === currentUserId`

**Test Data Setup:**
```bash
# Create a test order via backend API or manager dashboard
# Assign it to your driver's user ID
# Set status to DISPATCHED
```

---

### 3️⃣ DeliveryHistoryScreen (History Tab)

**What to Test:**
- [ ] Shows "No Deliveries Found" when empty
- [ ] Displays timeline grouped by date
- [ ] Search box filters by order number/customer
- [ ] Time filter dropdown works (Today, Week, Month, All)
- [ ] Orders show earnings (+₹XX)
- [ ] Tap order to expand details
- [ ] Items list shows (if available)
- [ ] Pull-to-refresh updates history

**How to Test:**
1. Tap "History" tab
2. Create test completed orders
3. Search for order number
4. Change time filter
5. Tap orders to expand
6. Pull to refresh

**Expected Backend Data:**
- Orders with status `DELIVERED` from `/api/orders?status=DELIVERED`
- Orders filtered by `assignedDriver.id === currentUserId`
- Must have `deliveredAt` or `updatedAt` timestamp

---

### 4️⃣ DriverProfileScreen (Profile Tab)

**What to Test:**
- [ ] Profile header shows driver info
- [ ] Avatar displays with rating badge
- [ ] Email, phone, driver ID shown
- [ ] Performance stats display correctly
- [ ] Earnings summary (Today, Week, Month)
- [ ] Total distance and avg delivery time
- [ ] "Edit Profile" shows "Coming Soon" alert
- [ ] "Settings" shows "Coming Soon" alert
- [ ] "Help & Support" shows "Coming Soon" alert
- [ ] "Logout" shows confirmation dialog
- [ ] After logout, redirects to login
- [ ] Pull-to-refresh updates stats

**How to Test:**
1. Tap "Profile" tab
2. Review all displayed information
3. Tap action items
4. Try logout (confirm it works)
5. Login again
6. Pull to refresh

**Expected Backend Data:**
- Driver performance from `/api/users/{id}/performance`
- User details from Redux store

---

## API Endpoint Testing

### Test API Connection:

```bash
# Check if backend is accessible from React Native

# Android Emulator uses:
curl http://10.0.2.2:8080/api/health

# iOS Simulator uses:
curl http://localhost:8080/api/health
```

### Key Endpoints to Verify:

1. **Login:**
   - `POST /api/auth/login`
   - Should return token and user object

2. **Get Driver Performance:**
   - `GET /api/users/{driverId}/performance`
   - Should return stats object

3. **Get Orders by Status:**
   - `GET /api/orders?status=DISPATCHED`
   - `GET /api/orders?status=DELIVERED`

4. **Update Order Status:**
   - `PUT /api/orders/{orderId}/status`
   - Body: `{ "status": "DELIVERED" }`

---

## WebSocket Testing

### Test WebSocket Connection:

The app connects to `ws://10.0.2.2:8090/ws` (Android) or `ws://localhost:8090/ws` (iOS)

**What to Check:**
- [ ] WebSocket connects on app launch (check console logs)
- [ ] Location updates sent every 30 seconds
- [ ] Connection reconnects after network loss
- [ ] Disconnect happens on logout

**How to Test:**
1. Enable React Native debugging
2. Check Chrome DevTools console
3. Look for WebSocket connection logs
4. Toggle airplane mode to test reconnection

---

## Redux State Testing

### Use React Native Debugger:

```bash
# Install React Native Debugger (optional)
brew install --cask react-native-debugger

# Or use Chrome DevTools
# Shake device/emulator → "Debug" → Opens Chrome
```

**What to Check:**
- [ ] `auth` state persists after app restart
- [ ] `driverApi` caches performance data
- [ ] `orderApi` caches order lists
- [ ] State updates trigger UI re-renders

---

## Common Issues & Solutions

### Issue: "Network request failed"

**Solution:**
```bash
# Make sure backend is running on correct ports
# API Gateway: http://localhost:8080
# WebSocket: ws://localhost:8090

# For Android, use 10.0.2.2 instead of localhost
# Already configured in src/config/api.config.ts
```

### Issue: "Unable to connect to WebSocket"

**Solution:**
```bash
# Check if WebSocket gateway is running
# Verify port 8090 is accessible
# Check firewall settings
```

### Issue: "No data showing"

**Solution:**
```bash
# Create test data in backend:
# 1. Create driver user
# 2. Create orders assigned to driver
# 3. Set appropriate statuses (DISPATCHED, DELIVERED)
```

### Issue: "@react-native-picker/picker not found"

**Solution:**
```bash
cd /Users/souravamseekarmarti/Projects/MaSoVaDriverApp
npm install
cd ios && pod install && cd ..  # iOS only
```

---

## Test Data Creation

### Create Test Driver:

```json
POST /api/users
{
  "name": "Test Driver",
  "email": "driver@test.com",
  "password": "password123",
  "phone": "1234567890",
  "userType": "DRIVER",
  "storeId": "your-store-id"
}
```

### Create Test Order (DISPATCHED):

```json
POST /api/orders
{
  "customer": {
    "name": "John Doe",
    "phone": "9876543210",
    "address": "123 Test Street, Bangalore"
  },
  "items": [
    { "name": "Pizza", "quantity": 2 },
    { "name": "Coke", "quantity": 1 }
  ],
  "totalAmount": 450,
  "status": "DISPATCHED",
  "assignedDriver": "driver-user-id-here",
  "deliveryAddress": "123 Test Street, Bangalore"
}
```

### Create Test Order (DELIVERED):

```json
# Same as above but with:
"status": "DELIVERED",
"deliveredAt": "2025-01-03T10:30:00Z"
```

---

## Performance Testing

### Check App Performance:

1. **FPS (Frame Rate):**
   - Shake device → "Show Perf Monitor"
   - Should maintain 60 FPS during scrolling

2. **Memory Usage:**
   - Monitor in Xcode/Android Studio
   - Should stay under 150MB

3. **Bundle Size:**
   ```bash
   # Check bundle size
   npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output test.bundle
   ls -lh test.bundle
   ```

4. **Cold Start Time:**
   - Should launch within 3 seconds

---

## Automated Testing (Future)

### Unit Tests (Optional):

```bash
# Run unit tests (if created)
npm test
```

### E2E Tests with Detox (Future Phase):

```bash
# Will be added in Phase 5
detox test
```

---

## Testing Checklist

### Before Testing:
- [ ] Backend services running (API Gateway, microservices)
- [ ] WebSocket gateway running (port 8090)
- [ ] Test data created (driver user, orders)
- [ ] Android emulator or iOS simulator running

### During Testing:
- [ ] All 4 screens load without errors
- [ ] Navigation between tabs works
- [ ] Pull-to-refresh works on all screens
- [ ] API calls return data
- [ ] WebSocket connects and sends updates
- [ ] Logout clears data and redirects

### After Testing:
- [ ] No console errors or warnings
- [ ] App doesn't crash
- [ ] Data persists after app restart
- [ ] Memory usage is reasonable

---

## Debug Commands

```bash
# Clear React Native cache
npx react-native start --reset-cache

# Clear Android build
cd android && ./gradlew clean && cd ..

# Clear iOS build (Mac only)
cd ios && pod install && cd ..

# View Android logs
adb logcat *:S ReactNative:V ReactNativeJS:V

# View iOS logs
xcrun simctl spawn booted log stream --predicate 'processImagePath contains "MaSoVaDriverApp"'
```

---

## Need Help?

**Console Logs:**
- Check terminal where `npx react-native start` is running
- Look for errors in red text

**Network Debugging:**
- Use Chrome DevTools → Network tab
- Check request/response for API calls

**Redux State:**
- Use React Native Debugger
- Or Redux DevTools extension in Chrome

---

## Quick Test Script

```bash
#!/bin/bash
# Save as test-driver-app.sh

echo "🚀 Starting MaSoVa Driver App Test..."

# 1. Check backend
echo "📡 Checking backend..."
curl -f http://localhost:8080/api/health || echo "⚠️  Backend not running!"

# 2. Start React Native
echo "📱 Starting React Native app..."
cd /Users/souravamseekarmarti/Projects/MaSoVaDriverApp
npx react-native run-android

# 3. Show logs
adb logcat *:S ReactNative:V ReactNativeJS:V
```

---

## Success Criteria

Your app is working correctly if:

✅ All 4 screens render without errors
✅ API calls return data (check Network tab)
✅ WebSocket connects (check console logs)
✅ State persists after app restart
✅ Pull-to-refresh updates data
✅ Navigation between tabs is smooth
✅ No red error screens appear

**Ready to test! 🎉**
