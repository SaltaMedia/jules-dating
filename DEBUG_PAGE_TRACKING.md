# 🔍 Debug Page Tracking

## **Issue**: Profile Pic Review Page Not Being Tracked

### **What to Check:**

1. **Open Browser Console** (F12 → Console tab)
2. **Navigate to Profile Pic Review page** (`/profile-pic-review`)
3. **Look for these console messages:**
   - `🔍 Page tracking check for /profile-pic-review:`
   - `📊 Tracking page visit: Profile Pic Review Page Visited for /profile-pic-review`
   - `✅ Page tracking completed for /profile-pic-review`

### **If You See "Skipping page tracking":**

The page was already tracked in this session. To test fresh:

1. **Clear Session Storage:**
   ```javascript
   // Run this in browser console
   Object.keys(sessionStorage).forEach(key => {
     if (key.startsWith('page_tracked_')) {
       sessionStorage.removeItem(key);
     }
   });
   console.log('Cleared page tracking flags');
   ```

2. **Navigate to Profile Pic Review page again**

### **Expected Behavior:**

- ✅ **First visit**: Should see tracking messages and event in Segment
- ✅ **Subsequent visits**: Should see "Skipping page tracking" message
- ✅ **New session**: Should track again (session storage clears on browser close)

### **If Still Not Working:**

Check for these issues:
1. **Segment client not initialized**
2. **Environment variables missing**
3. **JavaScript errors preventing execution**

### **Quick Test:**

```javascript
// Run in browser console to test Segment directly
window.analytics && window.analytics.track('Test Profile Pic Page', {
  test: true,
  page: '/profile-pic-review'
});
```

This should show up in Segment debugger if the client is working.
