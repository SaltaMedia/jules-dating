# Analytics Setup Instructions

## Code Changes Complete ✅

The following code changes have been implemented:

- ✅ Backend Segment client updated with `app_name: 'jules-dating'` and `app_environment` properties
- ✅ Frontend Segment client updated with `app_name: 'jules-dating'` and `app_environment` properties  
- ✅ Environment example files updated with proper placeholders

## Manual Steps Required

### 1. Create Segment Sources

Go to your Segment dashboard and create 2 sources:

**For Jules Dating (Combined Frontend + Backend):**
1. Sources → Add Source → Website (JavaScript)
2. Name: "Jules Dating"
3. Save the Write Key

**For Jules Style (Combined Frontend + Backend):**
1. Sources → Add Source → Website (JavaScript)
2. Name: "Jules Style"
3. Save the Write Key

### 2. Update Environment Variables

**Backend (.env):**
```
SEGMENT_WRITE_KEY=<Jules_Dating_Write_Key>
FEATURE_ANALYTICS=true
```

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_URL=http://localhost:4002
NEXT_PUBLIC_SEGMENT_WRITE_KEY=<Jules_Dating_Write_Key>
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

**Frontend (.env.production) - Create this file:**
```
NEXT_PUBLIC_API_URL=https://your-backend-service.onrender.com
NEXT_PUBLIC_SEGMENT_WRITE_KEY=<Jules_Dating_Write_Key>
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

### 3. Connect to Mixpanel

For each Segment source:
1. Go to Destinations → Add Destination → Mixpanel (Actions)
2. Use your Mixpanel project token
3. Jules Dating source → Connect to Jules Dating Mixpanel project
4. Jules Style source → Connect to Jules Style Mixpanel project

### 4. Test the Setup

1. Restart both backend and frontend servers
2. Go through complete funnel (landing → profile pic review → registration)
3. Check Segment Debugger for "Jules Dating" source
4. Verify events have `app_name: 'jules-dating'` and `app_environment: 'localhost'`
5. Wait 5-10 minutes and check Mixpanel for events

### 5. For Jules Style (When Ready)

Use the same pattern but with:
- `app_name: 'jules-style'` in the code
- Jules Style Segment write key
- Separate Mixpanel project for Jules Style

## Event Properties

All events now include:
- `app_name`: 'jules-dating' or 'jules-style'
- `app_environment`: 'localhost' or 'production'
- `timestamp`: ISO timestamp
- `app`: 'jules-dating' (legacy property)
- `platform`: 'web' (frontend) or 'server' (backend)

## Funnel Events

The following events are tracked for funnel analysis:
- `Landing Page` (page view)
- `CTA Clicked` (button clicks)
- `Free Profile Pic Review Page Visited`
- `Free Profile Pic Review Completed`
- `Sign Up Clicked After Profile Pic Review`
- `Registration Completed`
- `Onboarding Started`

Use these exact event names when creating Mixpanel funnels.
