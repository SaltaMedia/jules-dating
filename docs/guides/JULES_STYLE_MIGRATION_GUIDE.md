# Jules-Style Analytics Migration Guide

## 🎯 **Complete Analytics Overhaul - What We Did**

This guide shows exactly how to migrate Jules-Style from custom analytics to the clean Segment + Mixpanel integration that we implemented in Jules-Dating.

## 📋 **Step 1: Remove ALL Custom Analytics**

### **Files to DELETE:**
```bash
# Backend Analytics Files (DELETE THESE)
backend/analytics/wrapper.js
backend/config/analyticsConfig.js
backend/controllers/analyticsController.js
backend/controllers/analyticsControllerV2.js
backend/middleware/analytics.js
backend/middleware/analyticsFreemium.js
backend/models/AnalyticsEvent.js
backend/routes/analytics-v2.js
backend/utils/analyticsService.js

# Frontend Analytics Files (DELETE THESE)
frontend/src/analytics/ (entire directory if custom)
```

### **Package Dependencies to REMOVE:**
```bash
# Remove from frontend/package.json
npm uninstall @segment/analytics-next

# Remove from backend/package.json  
npm uninstall any custom analytics packages
```

## 📋 **Step 2: Add New Segment + Mixpanel Files**

### **Frontend Files to ADD:**
```bash
# Create these new files
frontend/src/utils/segment.ts
frontend/src/app/api/analytics/session-end/route.ts
frontend/src/app/test-segment/page.tsx
```

### **Backend Files to ADD:**
```bash
# Create these new files
backend/utils/segment.js
backend/utils/universalTracker.js
backend/middleware/universalTracking.js
backend/routes/analyticsQueries.js
backend/utils/analyticsQueries.js
```

## 📋 **Step 3: Environment Variables**

### **Frontend (.env.local):**
```bash
NEXT_PUBLIC_SEGMENT_WRITE_KEY=your_segment_write_key_here
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

### **Backend (.env):**
```bash
SEGMENT_WRITE_KEY=your_segment_write_key_here
ENABLE_ANALYTICS=true
```

### **Production (Vercel/Render):**
```bash
# Vercel Frontend
NEXT_PUBLIC_SEGMENT_WRITE_KEY=your_segment_write_key_here
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# Render Backend  
SEGMENT_WRITE_KEY=your_segment_write_key_here
ENABLE_ANALYTICS=true
```

## 📋 **Step 4: Update Package Dependencies**

### **Frontend (package.json):**
```json
{
  "dependencies": {
    // Remove @segment/analytics-next
    // Keep all other existing dependencies
  }
}
```

### **Backend (package.json):**
```json
{
  "dependencies": {
    "@segment/analytics-node": "^2.3.0",
    // Keep all other existing dependencies
  }
}
```

## 📋 **Step 5: Update Component Imports**

### **Replace ALL analytics imports:**

**OLD (Custom Analytics):**
```typescript
import { track } from '@/analytics/client';
import analytics from '@/analytics/wrapper';
```

**NEW (Segment):**
```typescript
import { segment } from '@/utils/segment';
```

### **Update ALL tracking calls:**

**OLD:**
```typescript
track('event_name', { properties });
analytics.track('event_name', { properties });
```

**NEW:**
```typescript
segment.track('event_name', { properties });
```

## 📋 **Step 6: Key Files to Copy from Jules-Dating**

### **1. Frontend Segment Client (`frontend/src/utils/segment.ts`)**
- Complete snippet-based Segment implementation
- Handles initialization, tracking, page views, user identification
- Production-ready error handling

### **2. Backend Segment Client (`backend/utils/segment.js`)**
- Server-side Segment integration
- User tracking, feature usage, authentication events
- Proper error handling and logging

### **3. Layout Wrapper (`frontend/src/components/LayoutWrapper.tsx`)**
- Session management
- Page tracking
- Session end handling

### **4. Universal Tracker (`backend/utils/universalTracker.js`)**
- Backend event tracking
- Feature usage tracking
- Error handling

## 📋 **Step 7: Event Mapping**

### **Frontend Events:**
```typescript
// Landing Page
segment.track('Landing Page Visited', { source, utm_source, utm_medium, utm_campaign });

// CTA Clicks
segment.track('CTA Clicked', { cta_type, location, source });

// Page Visits
segment.track('Registration Page Visited', { page: '/register' });
segment.track('Login Page Visited', { page: '/login' });
segment.track('Chat Page Visited', { page: '/chat' });

// Onboarding
segment.track('Onboarding Started', { page: '/onboarding' });

// Profile Pic Review
segment.track('Profile Pic Review Submitted', { has_specific_question, rating });
segment.track('Profile Pic Review Completed', { has_specific_question, rating });
```

### **Backend Events:**
```javascript
// Authentication
segment.track(userId, 'User Logged In', { method, source });
segment.track(userId, 'Registration Completed', { method, source });

// Feature Usage
segment.track(userId, 'Chat Message Sent', { messageLength, topic });
segment.track(userId, 'Fit Check Item Added', { itemType, category });

// Profile Pic Review
segment.track(userId, 'Profile Pic Review Submitted', { hasSpecificQuestion, rating });
```

## 📋 **Step 8: Testing**

### **1. Test Frontend Events:**
```bash
# Visit: http://localhost:3002/test-segment
# Click test buttons and verify events in Segment debugger
```

### **2. Test Backend Events:**
```bash
# Run: node backend/test-localhost-analytics.js
# Verify events in Segment debugger
```

### **3. Verify Mixpanel:**
- Check Segment → Mixpanel connection
- Verify events appear in Mixpanel
- Test funnel creation

## 📋 **Step 9: Production Deployment**

### **1. Build Test:**
```bash
# Frontend
cd frontend && npm run build

# Backend  
cd backend && npm run check:production
```

### **2. Deploy:**
```bash
# Commit all changes
git add .
git commit -m "feat: Migrate to Segment + Mixpanel analytics"

# Push to production
git push origin main
```

### **3. Environment Variables:**
- Add to Vercel (frontend)
- Add to Render (backend)
- Test production analytics

## 🎯 **Key Benefits of This Migration:**

✅ **Clean Architecture** - No more custom analytics code  
✅ **Industry Standard** - Segment + Mixpanel integration  
✅ **Better Performance** - Optimized tracking  
✅ **Easier Maintenance** - Standard tools and documentation  
✅ **Production Ready** - Proper error handling and logging  
✅ **Scalable** - Easy to add new events and destinations  

## 🚨 **Important Notes:**

1. **Complete Removal** - We deleted ALL custom analytics files
2. **No Hybrid** - Don't mix old and new systems
3. **Test Thoroughly** - Verify all events work before production
4. **Environment Variables** - Must be set in all environments
5. **Build Test** - Always test build before deployment

## 📞 **Support:**

If you encounter issues during migration:
1. Check the `COMPLETE_ANALYTICS_OVERVIEW.md` for detailed implementation
2. Use the test files to verify functionality
3. Check Segment debugger for event delivery
4. Verify Mixpanel connection and event flow

This migration completely removes the old custom analytics system and replaces it with a clean, production-ready Segment + Mixpanel integration that's easier to maintain and scale.
