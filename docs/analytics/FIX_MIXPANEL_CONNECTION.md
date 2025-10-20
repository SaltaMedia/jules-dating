# 🔧 Fix Mixpanel Connection - Missing Events

## **Problem**: "Landing Page Visited" not showing in Mixpanel funnel setup

## **Step 1: Verify Segment is Receiving Events**

### **1.1 Check Segment Debugger:**
1. **Go to**: https://app.segment.com/
2. **Select**: "Jules Dating" source
3. **Go to**: "Debugger" tab
4. **Look for**: "Landing Page Visited" events

**Expected Result**: Should see events with timestamp and properties

**If NO events in Segment:**
- Frontend tracking is broken
- Run the test script in browser console
- Check browser console for errors

**If YES events in Segment:**
- Move to Step 2 (Segment → Mixpanel issue)

### **1.2 Test Landing Page Event:**
```javascript
// Run in browser console on localhost:3002
window.analytics.track('Landing Page Visited', {
  source: 'test',
  test_mode: true
});
```

## **Step 2: Fix Segment → Mixpanel Connection**

### **2.1 Check Mixpanel Destination:**
1. **In Segment**: Go to "Destinations" tab
2. **Find**: "Mixpanel" destination
3. **Check Status**: Should be "Connected" and "Enabled"

### **2.2 Verify Mixpanel Settings:**
```
Destination: Mixpanel
Status: ✅ Connected
Settings:
✅ Track Page Views
✅ Track Clicks
✅ Track Form Submissions
✅ Enable User Profiles
```

### **2.3 Check Mixpanel Project Token:**
1. **In Mixpanel**: Go to Project Settings → Access Keys
2. **Copy Project Token**
3. **In Segment**: Go to Mixpanel destination settings
4. **Verify**: Project Token matches

### **2.4 Test Connection:**
```javascript
// Test direct Mixpanel event
window.analytics.track('Mixpanel Test Event', {
  test: true,
  timestamp: new Date().toISOString()
});
```

## **Step 3: Common Issues & Solutions**

### **Issue 1: Events Not Reaching Mixpanel**

#### **Solution A: Reconnect Mixpanel**
1. **In Segment**: Go to Destinations
2. **Find Mixpanel**: Click "Configure"
3. **Disconnect**: Remove destination
4. **Re-add**: Add Mixpanel destination again
5. **Enter**: Correct Project Token
6. **Save**: Test connection

#### **Solution B: Check Event Names**
- Mixpanel might be filtering certain event names
- Try renaming "Landing Page Visited" to "Page Visited"
- Test with simple event names first

#### **Solution C: Check Mixpanel Filters**
1. **In Mixpanel**: Go to Project Settings
2. **Check**: Data Filters
3. **Ensure**: No filters blocking events
4. **Check**: Event name restrictions

### **Issue 2: Events Delayed in Mixpanel**

#### **Solution:**
- Mixpanel can have 5-10 minute delay
- Wait and refresh Mixpanel Live View
- Check Mixpanel Data Quality tab

### **Issue 3: Wrong Mixpanel Project**

#### **Solution:**
1. **Verify**: You're looking at correct Mixpanel project
2. **Check**: Project name matches "Jules Dating"
3. **Confirm**: Project token is correct

## **Step 4: Alternative Event Names**

### **If "Landing Page Visited" doesn't work, try:**

```javascript
// Alternative event names for testing
window.analytics.track('Page View', { page: 'landing' });
window.analytics.track('Page Visited', { page: 'landing' });
window.analytics.track('Landing Page', { source: 'direct' });
window.analytics.track('Homepage Visited', { source: 'direct' });
```

## **Step 5: Verify Fix**

### **5.1 Check Mixpanel Live View:**
1. **Go to**: Mixpanel → Live View
2. **Should see**: Events flowing in real-time
3. **Look for**: Your test events

### **5.2 Check Funnel Setup:**
1. **Go to**: Mixpanel → Funnels
2. **Create funnel**: Should now see event names
3. **Test**: Add "Landing Page Visited" to funnel

### **5.3 Expected Events in Mixpanel:**
- ✅ `Landing Page Visited`
- ✅ `CTA Clicked`
- ✅ `Profile Pic Review Page Visited`
- ✅ `User Registered`
- ✅ `Chat Message Sent`

## **Step 6: If Still Not Working**

### **6.1 Check Mixpanel Support:**
- Mixpanel has event name restrictions
- Some special characters might be filtered
- Contact Mixpanel support if needed

### **6.2 Alternative Approach:**
- Use simpler event names
- Map events in Segment before sending to Mixpanel
- Use Segment's event transformation features

## **Quick Test Script:**

```javascript
// Complete test for Mixpanel connection
console.log('🧪 Testing Mixpanel Connection...');

// Test 1: Check Segment
console.log('Segment loaded:', !!window.analytics);

// Test 2: Send test event
if (window.analytics) {
  window.analytics.track('Mixpanel Test', {
    test: true,
    timestamp: new Date().toISOString()
  });
  console.log('✅ Test event sent');
} else {
  console.log('❌ Segment not loaded');
}

// Test 3: Check Mixpanel directly
if (window.mixpanel) {
  console.log('✅ Mixpanel SDK loaded');
} else {
  console.log('ℹ️ Using Segment → Mixpanel');
}

console.log('🔍 Check Mixpanel Live View now!');
```

## **Success Indicators:**

✅ **Events in Segment Debugger**
✅ **Events in Mixpanel Live View**  
✅ **Event names available in Funnel setup**
✅ **Real-time data flowing**

---

**🎯 Once fixed, you'll be able to create funnels with "Landing Page Visited" and all other events!**
