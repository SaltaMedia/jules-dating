# Landing Page Funnel Analytics Setup

## Overview

This document describes the landing page funnel analytics system that tracks user conversion from landing page visit to signup and login across three landing pages: `/`, `/1`, and `/2`.

## What's Being Tracked

The funnel tracks the following stages for each landing page:

1. **Landing Page Visits** - How many users visit the landing page
2. **Profile Pic Review Page Visits** - How many users navigate to the free profile pic review page
3. **Profile Pic Review Uploads** - How many users execute the free profile pic review
4. **Conversion Prompt Clicks** - How many users click "Sign Up FREE" after seeing the conversion prompt
5. **Signups** - How many users complete account creation
6. **Logins** - How many users successfully log in after signup

## Landing Pages

- **`/`** - Main Landing Page (default variant)
- **`/1`** - Landing Page 1 with "Emotional Hook" variant
- **`/2`** - Landing Page 2 with "Curiosity Hook" variant

## How It Works

### 1. Landing Page Tracking

When a user visits any landing page (`/`, `/1`, or `/2`), the following happens:

- The landing source (e.g., `/1`) is stored in `localStorage` as `landing_source`
- The landing variant (e.g., `emotional_hook`) is stored in `localStorage` as `landing_variant`
- A page visit event is tracked with the landing source and variant
- All CTA button clicks are tracked with the landing source

### 2. Profile Pic Review Tracking

When a user visits the free profile pic review page:

- The system reads the `landing_source` from localStorage
- Page visits and profile pic review uploads are tracked with the landing source
- The conversion prompt click (when user clicks "Sign Up FREE") is tracked with the landing source

### 3. Registration and Login Tracking

When a user registers or logs in:

- The `landing_source` and `landing_variant` from localStorage are included in the tracking event
- This allows attribution of signups and logins back to the original landing page

## Viewing Analytics

### Admin Dashboard

Access the landing page funnel analytics at:
```
/admin/landing-page-funnel
```

You must be logged in as an admin to access this page.

### Features

The admin dashboard shows:

1. **Summary Cards** - Quick overview of each landing page's performance with overall conversion rate
2. **Detailed Funnel Analysis** - Step-by-step breakdown for each landing page showing:
   - Number of users at each stage
   - Conversion rate between stages
   - Visual funnel representation
3. **Comparison Table** - Side-by-side comparison of all landing pages with conversion rates

### Time Ranges

You can filter the analytics by the following time ranges:
- Last 7 days
- Last 14 days
- Last 30 days (default)
- Last 60 days
- Last 90 days

## API Endpoints

### Backend Endpoint

```
GET /api/analytics/landing-page-funnel?timeRange=30d
```

**Authorization**: Required (Admin only)

**Query Parameters**:
- `timeRange` (optional): Time range for analytics (default: `30d`)
  - Options: `7d`, `14d`, `30d`, `60d`, `90d`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "landing_source": "/",
      "landing_page_visits": 150,
      "profile_pic_review_visits": 120,
      "profile_pic_review_uploads": 100,
      "conversion_prompt_clicks": 80,
      "signups": 60,
      "logins": 55,
      "conversion_rates": {
        "visit_to_pic_review": "80.00",
        "pic_review_visit_to_upload": "83.33",
        "upload_to_conversion_click": "80.00",
        "conversion_click_to_signup": "75.00",
        "signup_to_login": "91.67",
        "overall_visit_to_signup": "40.00"
      }
    },
    // ... more landing pages
  ],
  "timeRange": "30d",
  "timestamp": "2025-10-10T12:00:00.000Z"
}
```

### Frontend API Route

```
GET /api/analytics/landing-page-funnel?timeRange=30d
```

This is a Next.js API route that proxies the request to the backend.

## Analytics Events

The following events are tracked in the analytics database:

### 1. Landing Page Visit
```javascript
{
  event: 'page_visited',
  properties: {
    page: '/1',
    category: 'free_experience',
    action: 'landing_page_visited',
    variant: 'emotional_hook',
    landing_source: '/1'
  }
}
```

### 2. Landing Page CTA Click
```javascript
{
  event: 'landing_page_cta_clicked',
  properties: {
    cta_type: 'upload_pic_get_feedback',
    source: 'hero_section',
    category: 'free_experience',
    action: 'cta_button_clicked',
    button_text: 'Upload a Pic. Get Feedback.',
    variant: 'emotional_hook',
    landing_source: '/1'
  }
}
```

### 3. Profile Pic Review Page Visit
```javascript
{
  event: 'page_visited',
  properties: {
    page: '/free-experience/profile-pic-review',
    category: 'free_experience',
    action: 'profile_pic_review_accessed_from_free_experience',
    landing_source: '/1',
    landing_variant: 'emotional_hook'
  }
}
```

### 4. Profile Pic Review Upload
```javascript
{
  event: 'anonymous_profile_pic_review_uploaded',
  properties: {
    has_specific_question: true,
    rating: 8,
    landing_source: '/1',
    landing_variant: 'emotional_hook'
  }
}
```

### 5. Conversion Prompt Click
```javascript
{
  event: 'conversion_prompt_clicked',
  properties: {
    source: 'profile_pic_review',
    action: 'signup_from_conversion_prompt',
    landing_source: '/1',
    landing_variant: 'emotional_hook'
  }
}
```

### 6. Account Creation
```javascript
{
  event: 'account_created',
  properties: {
    source: 'register_page',
    feature: 'general',
    has_name: true,
    has_email: true,
    category: 'conversion',
    action: 'account_created',
    landing_source: '/1',
    landing_variant: 'emotional_hook'
  }
}
```

### 7. User Login
```javascript
{
  event: 'user_logged_in',
  properties: {
    category: 'conversion',
    action: 'user_logged_in',
    landing_source: '/1',
    landing_variant: 'emotional_hook',
    has_onboarding: false
  }
}
```

## Database Queries

The backend uses MongoDB aggregation to query the analytics data. Here's a simplified example of how it queries landing page visits:

```javascript
await AnalyticsEvent.aggregate([
  { 
    $match: { 
      timestamp: { $gte: startDate },
      action: 'landing_page_visited',
      'properties.landing_source': { $exists: true }
    }
  },
  { 
    $group: { 
      _id: '$properties.landing_source', 
      visits: { $sum: 1 },
      sessions: { $addToSet: '$sessionId' }
    }
  }
]);
```

## Key Metrics

### Conversion Rates Calculated

1. **Visit to Pic Review** - % of landing page visitors who navigate to profile pic review
2. **Pic Review Visit to Upload** - % of pic review page visitors who upload a photo
3. **Upload to Conversion Click** - % of uploads that lead to clicking the signup prompt
4. **Conversion Click to Signup** - % of conversion prompt clicks that result in signup
5. **Signup to Login** - % of signups that result in a successful login
6. **Overall Visit to Signup** - % of landing page visitors who complete signup (main KPI)

## Implementation Files

### Frontend Files Modified/Created

1. **Landing Pages**:
   - `/frontend/src/app/page.tsx` - Main landing page
   - `/frontend/src/app/1/page.tsx` - Variant 1 (Emotional Hook)
   - `/frontend/src/app/2/page.tsx` - Variant 2 (Curiosity Hook)

2. **Profile Pic Review**:
   - `/frontend/src/app/free-experience/profile-pic-review/page.tsx`

3. **Authentication**:
   - `/frontend/src/app/register/page.tsx`
   - `/frontend/src/app/login/page.tsx`

4. **Admin Dashboard**:
   - `/frontend/src/app/admin/landing-page-funnel/page.tsx` (NEW)
   - `/frontend/src/app/api/analytics/landing-page-funnel/route.ts` (NEW)

### Backend Files Modified/Created

1. **Analytics Controller**:
   - `/backend/controllers/analyticsController.js` - Added `getLandingPageFunnel()` method

2. **Analytics Routes**:
   - `/backend/routes/analytics.js` - Added `/landing-page-funnel` route

## Testing the Implementation

### 1. Test Tracking on Landing Page

1. Visit `http://localhost:3000/1`
2. Open browser DevTools → Application → Local Storage
3. Verify that `landing_source` is set to `/1`
4. Verify that `landing_variant` is set to `emotional_hook`

### 2. Test Full Funnel

1. Visit a landing page (`/`, `/1`, or `/2`)
2. Click "Get FREE Profile Pic Review" or equivalent CTA
3. Upload a profile picture and get feedback
4. Click "Sign Up FREE" after seeing the conversion prompt
5. Complete the signup form
6. Log in with your new account

### 3. View Analytics

1. Log in as an admin
2. Navigate to `/admin/landing-page-funnel`
3. Verify that your test journey appears in the analytics

## Future Enhancements

Potential improvements to the system:

1. **A/B Testing Integration** - Automatically split traffic between variants
2. **Real-time Dashboard** - Live updates without page refresh
3. **Cohort Analysis** - Track user behavior over time from their landing page
4. **Campaign Tracking** - Add UTM parameter support for marketing campaigns
5. **Drop-off Analysis** - Identify exactly where users leave the funnel
6. **Heatmaps** - Visual representation of user interactions on landing pages
7. **Session Recording** - Record user sessions for qualitative analysis

## Troubleshooting

### Issue: Analytics not showing data

**Possible causes**:
1. Users haven't completed the funnel yet (wait for some time)
2. `landing_source` not being set in localStorage
3. Backend analytics endpoint not accessible

**Solution**:
- Check browser console for errors
- Verify localStorage values are being set
- Check backend logs for analytics event tracking
- Ensure MongoDB is running and accessible

### Issue: Conversion rates showing 0%

**Possible causes**:
1. No users have completed that stage of the funnel
2. Time range is too narrow
3. Landing source not being passed through the funnel

**Solution**:
- Widen the time range (e.g., 30d or 60d)
- Test the full funnel manually to verify tracking
- Check that `landing_source` persists in localStorage throughout the journey

### Issue: Landing page not appearing in analytics

**Possible causes**:
1. Landing page not added to `landingSources` array in backend
2. Landing page not setting `landing_source` in localStorage

**Solution**:
- Add the landing page to the `landingSources` array in `analyticsController.js`
- Verify that the landing page sets `landing_source` in `useEffect`

## Support

For questions or issues, please contact the development team or check the main project README.

---

**Last Updated**: October 10, 2025

