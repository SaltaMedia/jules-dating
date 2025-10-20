# Mobile App with Shared Code Monorepo

## Overview
Convert Jules Dating to a mobile app using React Native with Expo, implementing a monorepo structure that shares ~60% of code (business logic, API, types) between web and mobile platforms.

## Architecture

### Monorepo Structure
```
jules-dating/
├── packages/
│   ├── mobile/              # NEW: React Native Expo app
│   ├── web/                 # MOVED: Current Next.js frontend
│   ├── shared/              # NEW: Shared code
│   │   ├── api/            # API client (from frontend/src/lib/api.ts)
│   │   ├── types/          # TypeScript interfaces
│   │   ├── utils/          # Business logic & helpers
│   │   └── config/         # Shared constants
│   └── backend/            # MOVED: Existing Express backend
├── package.json            # Root workspace config
└── tsconfig.base.json      # Shared TS config
```

## Phase 1: Monorepo Setup (Week 1)

### Step 1.1: Configure Root Workspace
- Install workspace tooling at root level
- Create `package.json` with npm workspaces configuration
- Set up TypeScript base config for all packages
- Configure shared ESLint and Prettier settings

**Key files to create:**
- `/package.json` - workspace root with `"workspaces": ["packages/*"]`
- `/tsconfig.base.json` - base TypeScript config
- `/.eslintrc.js` - shared linting rules

### Step 1.2: Restructure Existing Code
- Move `frontend/` → `packages/web/`
- Move `backend/` → `packages/backend/`
- Update all import paths in web package
- Update backend references if needed
- Test that existing web app still runs

**Commands to run:**
```bash
# Backup first
git checkout -b feature/mobile-app-monorepo

# Restructure
mkdir -p packages
mv frontend packages/web
mv backend packages/backend
```

### Step 1.3: Extract Shared Code Package
Create `packages/shared/` with:

**API Layer** (`packages/shared/api/client.ts`):
- Extract from `frontend/src/lib/api.ts`
- Make storage-agnostic (support both localStorage and SecureStore)
- Keep axios interceptors for auth
- Export typed API client methods

**Types** (`packages/shared/types/`):
- `user.ts` - User, OnboardingData, UserSettings
- `chat.ts` - Message, ChatResponse, Product, StyleImage
- `fitcheck.ts` - FitCheck, FitCheckResponse, Outfit
- `auth.ts` - LoginCredentials, RegisterData, AuthResponse
- `profilePic.ts` - ProfilePicReview types
- `api.ts` - API response wrappers

**Utils** (`packages/shared/utils/`):
- `validation.ts` - Form validation logic
- `formatting.ts` - Date/string formatters
- `analytics.ts` - Analytics event definitions (platform-agnostic)

**Config** (`packages/shared/config/`):
- `constants.ts` - App constants, limits, URLs
- `features.ts` - Feature flags

**Update web package** to import from shared:
```typescript
// packages/web/src/app/chat/page.tsx
import { apiClient } from '@jules/shared/api';
import { Message, Product } from '@jules/shared/types';
```

## Phase 2: Mobile App Foundation (Week 2)

### Step 2.1: Initialize Expo Project
```bash
cd packages
npx create-expo-app mobile --template blank-typescript
cd mobile
npx expo install expo-router expo-secure-store expo-image-picker
```

**Install dependencies:**
- `@react-navigation/native` - Navigation
- `@react-navigation/stack` - Stack navigator
- `axios` - API calls
- `expo-secure-store` - Token storage
- `expo-image-picker` - Camera/gallery access
- `expo-image` - Optimized images
- `react-native-markdown-display` - Markdown rendering
- `nativewind` - Tailwind for React Native (optional)

### Step 2.2: Configure Mobile Package
Create `packages/mobile/app.json` with proper config:
- Bundle identifier: `com.juleslabs.dating`
- App name: "Jules Dating"
- Permissions: camera, photo library
- Deep linking scheme: `jules://`

Update `packages/mobile/tsconfig.json` to reference shared package:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "paths": {
      "@jules/shared/*": ["../shared/src/*"]
    }
  }
}
```

### Step 2.3: Create Storage Adapter
File: `packages/shared/storage/adapter.ts`

```typescript
// Platform-agnostic storage
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

// Web implementation (localStorage)
// Mobile implementation (SecureStore)
```

Update API client to use storage adapter instead of direct localStorage.

## Phase 3: Core Features Migration (Weeks 3-6)

### Step 3.1: Authentication Flow (Week 3)
**Web files to reference:**
- `packages/web/src/app/login/page.tsx`
- `packages/web/src/app/register/page.tsx`
- `packages/web/src/app/auth/callback/page.tsx`

**Create mobile screens:**
- `packages/mobile/src/screens/LoginScreen.tsx`
- `packages/mobile/src/screens/RegisterScreen.tsx`
- `packages/mobile/src/screens/OnboardingScreen.tsx`

**Key changes:**
- Replace Next.js forms with React Native TextInput
- Use SecureStore for token storage
- Implement proper keyboard handling (KeyboardAvoidingView)
- Add biometric auth option (expo-local-authentication)

**Shared logic:**
- Auth validation functions from shared package
- API calls via shared apiClient
- JWT token handling

### Step 3.2: Chat Interface (Week 4)
**Web file:** `packages/web/src/app/chat/page.tsx` (1190 lines)

**Create:** `packages/mobile/src/screens/ChatScreen.tsx`

**Key mobile adaptations:**
- FlatList instead of divs for message list
- React Native TextInput with multiline
- Image picker for photo uploads (expo-image-picker)
- Pull-to-refresh for message history
- Native keyboard accessory view

**Shared logic:**
- Message state management (useState hooks)
- API calls via `apiClient.chat.send()`
- Product/image grid rendering logic
- Message formatting

**Components to create:**
- `MessageBubble.tsx` - Individual chat message
- `ChatInput.tsx` - Input with image button
- `ProductCard.tsx` - Native version of product display
- `ImageGallery.tsx` - Native image viewer

### Step 3.3: Fit Check Feature (Week 5)
**Web file:** `packages/web/src/app/fitcheck/page.tsx` (927 lines)

**Create:** `packages/mobile/src/screens/FitCheckScreen.tsx`

**Mobile enhancements:**
- Native camera integration (expo-camera)
- Real-time camera preview
- Image compression before upload
- Cloudinary upload from mobile
- Swipe gestures for history navigation

**Shared logic:**
- FitCheck type definitions
- API calls via `apiClient.fitChecks`
- Rating calculation
- Response parsing

**Key components:**
- `CameraView.tsx` - Native camera interface
- `FitCheckCard.tsx` - Result display
- `FitCheckHistory.tsx` - Past fit checks

### Step 3.4: Profile Pic Review (Week 5)
**Web file:** `packages/web/src/app/profile-pic-review/page.tsx`

**Create:** `packages/mobile/src/screens/ProfilePicReviewScreen.tsx`

**Mobile features:**
- Multiple photo selection
- Crop/rotate before submission
- Side-by-side comparison view

### Step 3.5: Settings & Profile (Week 6)
**Web file:** `packages/web/src/app/settings/page.tsx`

**Create:** `packages/mobile/src/screens/SettingsScreen.tsx`

**Mobile additions:**
- Push notification toggle
- App version info
- Privacy settings
- Logout confirmation modal

## Phase 4: Backend Updates (Week 6)

### Step 4.1: Update CORS Configuration
File: `packages/backend/index.js`

```javascript
const corsOptions = {
  origin: [
    'http://localhost:3002',  // Web dev
    'http://localhost:8081',  // Expo dev
    'jules://',               // Deep links
    // Production domains
  ],
  credentials: true
};
```

### Step 4.2: Add Mobile-Specific Endpoints
Create `packages/backend/routes/mobile.js`:
- `/api/mobile/version` - Check app version
- `/api/mobile/push-token` - Register push notifications

### Step 4.3: Push Notifications Setup
- Install `expo-server-sdk` in backend
- Create push notification service
- Add push token storage to User model
- Implement notification triggers (new matches, messages)

**File:** `packages/backend/services/pushNotifications.js`

## Phase 5: Navigation & UI Shell (Week 7)

### Step 5.1: Navigation Structure
File: `packages/mobile/App.tsx`

```typescript
// Stack navigation
- Auth Stack (not logged in)
  - Login
  - Register
  - Onboarding
  
- Main Tab Navigator (logged in)
  - Chat (Home)
  - Fit Check
  - Profile Pic Review
  - Settings
```

### Step 5.2: Create Reusable Components
`packages/mobile/src/components/`:
- `Button.tsx` - Branded button
- `Input.tsx` - Styled text input
- `Card.tsx` - Content card
- `Loading.tsx` - Loading spinner
- `Avatar.tsx` - User avatar
- `Badge.tsx` - Notification badges

### Step 5.3: Theme System
File: `packages/mobile/src/theme/`
- `colors.ts` - Brand colors (match web)
- `typography.ts` - Font styles
- `spacing.ts` - Layout constants

## Phase 6: Testing & Polish (Week 8)

### Step 6.1: Testing
- Test on iOS Simulator (iPhone 14, 15)
- Test on Android Emulator (Pixel 5, 6)
- Test real devices if available
- Check camera permissions flow
- Verify token persistence
- Test offline behavior

### Step 6.2: Performance Optimization
- Implement image caching (expo-image)
- Add request deduplication
- Optimize FlatList with proper keys
- Lazy load screens

### Step 6.3: Polish
- Add loading states for all API calls
- Implement error boundaries
- Add haptic feedback (expo-haptics)
- Smooth transitions/animations
- Pull-to-refresh where applicable

## Phase 7: Deployment (Weeks 9-10)

### Step 7.1: Build Configuration
- Create `eas.json` for EAS Build
- Set up environment variables
- Configure app icons and splash screens
- Set up app versioning

### Step 7.2: EAS Build & Submit
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure
cd packages/mobile
eas build:configure

# Build for both platforms
eas build --platform all

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### Step 7.3: App Store Listings
- iOS App Store metadata
- Google Play Store metadata
- Screenshots from both platforms
- App descriptions
- Privacy policy updates

## Key Technical Decisions

**Code Sharing Strategy:**
- ✅ Share: API client, types, validation, business logic
- ❌ Don't share: UI components, navigation, platform-specific features

**State Management:**
- Use React hooks (useState, useContext) - already in use
- Consider Zustand if state becomes complex

**Styling Approach:**
- Option A: React Native StyleSheet (recommended for performance)
- Option B: NativeWind (easier for team familiar with Tailwind)

**API Changes Needed:**
- Backend stays mostly the same ✅
- Add CORS for mobile
- Add push notification endpoints
- Consider adding refresh token endpoint for better mobile auth

## File Impact Summary

**New directories:**
- `packages/shared/` - ~2,000 lines (extracted + new)
- `packages/mobile/` - ~5,000 lines (new React Native code)

**Modified files:**
- `packages/web/` - Import path updates throughout
- `packages/backend/index.js` - CORS updates
- Root `package.json` - Workspace configuration

**Preserved:**
- All existing web app functionality remains intact
- Backend API structure unchanged
- Database schema unchanged

## Ongoing Management

**Adding a new feature:**
1. Define types in `packages/shared/types/`
2. Add API endpoint in `packages/backend/`
3. Add API client method in `packages/shared/api/`
4. Implement UI in `packages/web/` (Next.js)
5. Implement UI in `packages/mobile/` (React Native)

**Shared = automatic, UI = manual implementation per platform**

## Success Criteria

- [ ] Monorepo builds successfully
- [ ] Web app runs unchanged from new location
- [ ] Mobile app builds for iOS and Android
- [ ] All core features work on mobile (auth, chat, fit check, profile pic review)
- [ ] Shared code is imported correctly by both platforms
- [ ] Backend serves both web and mobile clients
- [ ] Apps submitted to both app stores

## Timeline Summary

- **Week 1:** Monorepo setup, restructure existing code, extract shared package
- **Week 2:** Initialize mobile app, configure dependencies, storage adapter
- **Week 3:** Authentication screens (login, register, onboarding)
- **Week 4:** Chat interface with image support
- **Week 5:** Fit check + Profile pic review features
- **Week 6:** Settings, profile, backend updates
- **Week 7:** Navigation, reusable components, theming
- **Week 8:** Testing and polish
- **Weeks 9-10:** Build configuration and app store deployment

**Total: 2-3 months for full mobile app with feature parity**



