# 🧪 Localhost Analytics Testing Guide

## Quick Start Testing

### 1. **Frontend Testing** (Browser Events)

**Test Page**: `http://localhost:3002/test-segment`

**Steps**:
1. Open browser to test page
2. Open Developer Tools (F12)
3. Go to **Console** tab
4. Click test buttons and watch for:
   - ✅ "Segment event sent successfully" messages
   - ✅ Network requests to `api.segment.io/v1/t`

**Real Page Testing**: `http://localhost:3002`
- Check console for "Landing Page Visited" 
- Click CTA buttons for "CTA Clicked" events

### 2. **Backend Testing** (API Events)

**Run Test Script**:
```bash
cd backend
node test-localhost-analytics.js
```

**Expected Output**:
```
✅ Registration event sent
✅ Login event sent  
✅ OAuth Login event sent
✅ Feature usage event sent
✅ User identification sent
```

### 3. **Full Integration Testing**

**Test Complete User Journey**:

1. **Landing Page** (`http://localhost:3002`)
   - Should see: `TRACK Landing Page Visited`

2. **Click CTA** (any button)
   - Should see: `TRACK CTA Clicked`

3. **Registration** (via API or UI)
   - Should see: `TRACK Registration Completed`

4. **Login** (via API or UI)
   - Should see: `TRACK User Logged In`

5. **Use Features** (chat, fit check, etc.)
   - Should see: `TRACK Feature Used`

## 🔍 Verification Steps

### Segment Debugger
1. Go to: https://app.segment.com/
2. Navigate to: **Sources** → **Jules Dating** → **Debugger**
3. Look for events with timestamps from your test
4. Events should show as **TRACK** type

### Network Tab Verification
1. Open Developer Tools → **Network** tab
2. Filter by "segment" or "api.segment.io"
3. Look for POST requests to `api.segment.io/v1/t`
4. Check request payload contains your event data

### Console Logs
Look for these success messages:
- `🔧 Initializing Segment client with write key: jolHyQEGKMUC0e5eRKrnEQRvUDnyL5qU`
- `✅ Segment client initialization completed`
- `📤 Sending Segment event: [Event Name]`
- `✅ Segment event sent successfully: [Event Name]`

## 🚨 Troubleshooting

### Frontend Issues
- **No events in console**: Check if `NEXT_PUBLIC_ENABLE_ANALYTICS=true` in `.env.local`
- **Initialization errors**: Check browser console for Segment script loading errors
- **Network errors**: Verify `NEXT_PUBLIC_SEGMENT_WRITE_KEY` is set correctly

### Backend Issues  
- **No events sent**: Check if `SEGMENT_WRITE_KEY` is set in backend `.env`
- **Test script fails**: Run `node test-segment.js` to verify backend setup
- **Events not reaching Segment**: Check network connectivity and Segment write key

### Environment Variables
**Frontend** (`.env.local`):
```
NEXT_PUBLIC_SEGMENT_WRITE_KEY=jolHyQEGKMUC0e5eRKrnEQRvUDnyL5qU
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

**Backend** (`.env`):
```
SEGMENT_WRITE_KEY=jolHyQEGKMUC0e5eRKrnEQRvUDnyL5qU
```

## 📊 Expected Events in Segment

### Frontend Events
- `TRACK Landing Page Visited`
- `TRACK CTA Clicked` 
- `TRACK Onboarding Started`
- `PAGE /` (automatic page views)

### Backend Events
- `TRACK Registration Completed`
- `TRACK User Logged In`
- `TRACK Feature Used`
- `IDENTIFY` (user identification)

## 🎯 Test Scenarios

### Scenario 1: New User Journey
1. Visit landing page → `Landing Page Visited`
2. Click "Get FREE Profile Pic Review" → `CTA Clicked`
3. Complete registration → `Registration Completed`
4. Login → `User Logged In`
5. Use chat feature → `Feature Used`

### Scenario 2: OAuth User Journey  
1. Visit landing page → `Landing Page Visited`
2. Click "Sign Up for FREE!" → `CTA Clicked`
3. Complete OAuth registration → `User Signed Up`
4. OAuth login → `User Logged In`
5. Use fit check → `Feature Used`

## ✅ Success Criteria

- [ ] Frontend events appear in Segment debugger
- [ ] Backend events appear in Segment debugger  
- [ ] Network requests show successful POST to `api.segment.io/v1/t`
- [ ] Console shows "Segment event sent successfully" messages
- [ ] Events flow to Mixpanel (if configured)
- [ ] No JavaScript errors in browser console
- [ ] Backend test script runs without errors

## 🔄 Continuous Testing

**During Development**:
- Keep Segment debugger open in a separate tab
- Monitor console logs while developing
- Run backend tests after making changes
- Verify events appear in real-time

**Before Production**:
- Test complete user journey end-to-end
- Verify all funnel events are captured
- Check event properties and user identification
- Confirm data flows to all configured destinations

