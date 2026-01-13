# MaSoVa Driver App

**React Native driver application for MaSoVa Restaurant Management System**

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Java 17
- Android Studio / Xcode
- Backend services running on `localhost:8080`

### Installation

```bash
# Install dependencies
npm install

# Start Metro bundler
npm start

# Run on Android (separate terminal)
npm run android

# Run on iOS (separate terminal)
npm run ios
```

---

## ✨ Features

### Phase 1 - Project Setup ✅
- React Native 0.83.1
- TypeScript configuration
- Navigation (React Navigation)
- Design system (Neumorphic)

### Phase 2 - Core UI & State ✅
- Redux Toolkit + RTK Query
- WebSocket integration
- Authentication with AsyncStorage
- 4 main screens (Home, Active, History, Profile)
- Shared UI components

### Phase 3 - Native Modules ✅
- **GPS Tracking** - Real-time location updates
- **Push Notifications** - Delivery assignment alerts
- **Camera** - Proof of delivery photos
- **Permissions** - Runtime permission handling

### Phase 4 - Advanced Features ✅
- **Background GPS** - Tracks location when app is minimized/locked
- **Offline Queue** - Zero data loss during network outages
- **Photo Upload** - Proof of delivery upload with auto-retry
- **Network Monitoring** - Auto-sync when connection restored
- **Battery Optimized** - <5% drain per hour during tracking

### Phase 5 - Testing & Polish ✅
- **Unit Tests** - 50%+ code coverage for critical services
- **Component Tests** - React Native Testing Library
- **Error Boundaries** - Graceful error handling
- **Global Error Handler** - Centralized error management
- **Performance Monitoring** - Render time tracking
- **ProGuard Optimization** - 30% smaller APK size

---

## 📱 Screens

1. **Delivery Home** - Dashboard with stats, GPS status, session time
2. **Active Deliveries** - List of assigned orders with navigation
3. **Delivery History** - Past deliveries timeline
4. **Driver Profile** - Stats, earnings, account settings

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | React Native 0.83.1 |
| Language | TypeScript 5.8.3 |
| State Management | Redux Toolkit + RTK Query |
| Navigation | React Navigation 7.x |
| Real-time | STOMP over WebSocket |
| Storage | AsyncStorage |
| UI Library | React Native Paper |
| Icons | React Native Vector Icons |
| GPS | @react-native-community/geolocation |
| Background GPS | Custom Native Module (Kotlin) |
| Notifications | @notifee/react-native |
| Camera | react-native-image-picker |
| Network Status | @react-native-community/netinfo |
| Offline Queue | AsyncStorage + Custom Service |

---

## 🔧 Available Scripts

```bash
# Development
npm start              # Start Metro bundler on port 8087
npm run android        # Run on Android emulator/device
npm run ios            # Run on iOS simulator/device

# Build
npm run clean          # Clean Android build
npm run build:android  # Build Android release APK

# Code Quality
npm run lint           # Run ESLint
npm test               # Run Jest tests
```

---

## 📂 Project Structure

```
MaSoVaDriverApp/
├── src/
│   ├── components/
│   │   └── shared/              # Reusable UI components
│   ├── config/
│   │   └── api.config.ts        # API endpoints & URLs
│   ├── navigation/
│   │   └── AppNavigator.tsx     # Navigation setup
│   ├── screens/                 # Main app screens
│   ├── services/
│   │   ├── cameraService.ts     # Camera & photos
│   │   ├── locationService.ts   # GPS tracking
│   │   ├── notificationService.ts # Push notifications
│   │   └── websocketService.ts  # Real-time updates
│   ├── store/
│   │   ├── api/                 # RTK Query APIs
│   │   ├── slices/              # Redux slices
│   │   └── store.ts             # Store configuration
│   ├── styles/
│   │   └── driverDesignTokens.ts # Design system
│   └── types/                   # TypeScript types
├── android/                     # Android native code
├── ios/                         # iOS native code (if applicable)
├── App.tsx                      # Root component
└── package.json                 # Dependencies
```

---

## 🔑 Environment Configuration

### API Gateway

The app automatically detects the platform and uses the correct URL:

- **Android Emulator:** `http://10.0.2.2:8080/api`
- **iOS Simulator:** `http://localhost:8080/api`
- **Production:** Configure in `src/config/api.config.ts`

### WebSocket

- **Development:** `ws://10.0.2.2:8090/ws` (Android)
- **Production:** `wss://api.masova.com/ws`

---

## 📋 Permissions

### Android

All permissions are configured in `android/app/src/main/AndroidManifest.xml`:

- **Location:** `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `ACCESS_BACKGROUND_LOCATION`
- **Camera:** `CAMERA`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`
- **Notifications:** `POST_NOTIFICATIONS`, `VIBRATE`

The app requests these permissions at runtime when needed.

---

## 🔌 Backend Integration

### Required Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Driver login |
| GET | `/users/{id}` | Get driver profile |
| PUT | `/users/{id}/status` | Update online/offline status |
| GET | `/delivery/driver/{id}/performance` | Get driver stats |
| POST | `/delivery/location-update` | Update driver location |
| GET | `/orders?status=DISPATCHED` | Get active orders |
| PUT | `/orders/{id}/status` | Update order status |

### WebSocket Topics

| Topic | Description |
|-------|-------------|
| `/topic/driver/{id}/orders` | New order assignments |
| `/topic/driver/{id}/location` | Driver location updates |
| `/topic/order/{id}/tracking` | Order tracking updates |

---

## 🧪 Testing

### With Backend Running

1. Start all MaSoVa backend services:
   ```bash
   cd MaSoVa-restaurant-management-system
   # Start API Gateway, User Service, Order Service, Delivery Service
   ```

2. Create test driver user in database

3. Run the driver app:
   ```bash
   npm run android
   ```

4. Test flow:
   - Login with driver credentials
   - Go online (GPS starts tracking)
   - Assign order from manager dashboard
   - Receive push notification
   - Navigate to customer
   - Take delivery proof photo
   - Mark as delivered

---

## 📱 Native Modules

### GPS Tracking (`locationService.ts`)

```typescript
// Get current location
const location = await locationService.getCurrentLocation();

// Start continuous tracking
await locationService.startTracking((location) => {
  console.log('New location:', location);
});

// Stop tracking
locationService.stopTracking();
```

### Push Notifications (`notificationService.ts`)

```typescript
// Initialize on app start
await notificationService.initialize();

// Show notification
await notificationService.notifyNewDelivery(
  orderNumber,
  customerName,
  address,
  orderId
);
```

### Camera (`cameraService.ts`)

```typescript
// Take photo
const photo = await cameraService.takePhoto({
  quality: 0.8,
  maxWidth: 1920
});

// Create FormData for upload
const formData = cameraService.createFormData(photo, 'deliveryProof');
```

---

## 🐛 Troubleshooting

### Metro Port Conflict
```bash
# Kill process on port 8087
npx react-native start --port 8087 --reset-cache
```

### Android Build Fails
```bash
# Clean and rebuild
npm run clean
cd android && ./gradlew clean && cd ..
npm run android
```

### GPS Not Working
1. Check permissions in AndroidManifest.xml
2. Grant location permission at runtime
3. Test in emulator with mock location

### Notifications Not Showing
1. Check notification permission granted
2. Verify notification channel created (Android)
3. Test with `npm run android` (not release mode)

---

## 📚 Documentation

- [README_SETUP.md](./README_SETUP.md) - Project setup guide
- [PHASE_2_COMPLETE.md](./PHASE_2_COMPLETE.md) - Core UI & state management
- [PHASE_3_COMPLETE.md](./PHASE_3_COMPLETE.md) - Native modules integration
- [PHASE_4_COMPLETE.md](./PHASE_4_COMPLETE.md) - Advanced features (background GPS, offline queue, photo upload)
- [PHASE_5_COMPLETE.md](./PHASE_5_COMPLETE.md) - Testing & polish (unit tests, error handling, performance)

---

## 🚧 Roadmap

### Phase 4 - Advanced Features ✅ COMPLETE
- ✅ Background location service (Android native)
- ✅ Offline request queue (AsyncStorage + NetInfo)
- ✅ Photo upload integration
- ✅ Battery-optimized GPS (<5% drain/hour)
- ⏳ Customer signature capture (pending)

### Phase 5 - Testing & Polish ✅ COMPLETE
- ✅ Unit tests (50%+ coverage)
- ✅ Component tests (React Native Testing Library)
- ✅ Error boundaries
- ✅ Global error handler
- ✅ Performance monitoring
- ✅ ProGuard optimization
- ⏳ Crash reporting (Sentry - ready for setup)
- ⏳ E2E tests (Detox - pending)

### Phase 6 - Deployment (Planned)
- Play Store preparation
- App Store preparation (iOS)
- CI/CD pipeline
- Beta testing
- Production release

---

## 📄 License

Private - MaSoVa Restaurant Management System

---

## 👥 Contributors

- Sourav Amseekar Marti (@souravamseekarmarti)

---

**Built with ❤️ using React Native**
