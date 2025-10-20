# 🎯 Mixpanel Setup Guide for Jules Dating

## **Step 1: Create Mixpanel Account**

1. **Go to**: https://mixpanel.com/
2. **Sign up** for free account
3. **Create project**: "Jules Dating"
4. **Get Project Token** from Settings → Access Keys

## **Step 2: Connect Segment to Mixpanel**

### **In Segment Dashboard:**
1. **Go to**: https://app.segment.com/
2. **Select**: "Jules Dating" source
3. **Go to**: "Destinations" tab
4. **Click**: "Add Destination"
5. **Search**: "Mixpanel" → Add

### **Configure Mixpanel Destination:**
```
Project Token: [Your Mixpanel Project Token]
Settings:
✅ Track Page Views
✅ Track Clicks
✅ Track Form Submissions  
✅ Enable User Profiles
✅ Track Revenue
```

## **Step 3: Test Connection**

### **3.1 Test in Browser Console:**
```javascript
// Test direct Mixpanel event
window.analytics && window.analytics.track('Test Mixpanel Event', {
  test: true,
  source: 'setup_test'
});
```

### **3.2 Check Mixpanel Live View:**
1. **Go to**: Mixpanel → Live View
2. **Should see**: Events flowing in real-time
3. **Look for**: Your test events

## **Step 4: Verify Key Events**

### **Expected Events in Mixpanel:**
- ✅ `Landing Page Visited`
- ✅ `CTA Clicked`
- ✅ `Profile Pic Review Page Visited`
- ✅ `Profile Pic Review Submitted`
- ✅ `User Registered`
- ✅ `User Logged In`
- ✅ `Chat Message Sent`
- ✅ `Fit Check Item Added`
- ✅ `Fit Check Submitted`

## **Step 5: Set Up Funnels**

### **5.1 Create Conversion Funnel:**
```
Step 1: Landing Page Visited
Step 2: CTA Clicked
Step 3: Profile Pic Review Page Visited
Step 4: Profile Pic Review Submitted
Step 5: User Registered
```

### **5.2 Create Engagement Funnel:**
```
Step 1: User Logged In
Step 2: Chat Message Sent
Step 3: Fit Check Item Added
Step 4: Fit Check Submitted
```

## **Step 6: Set Up Cohorts**

### **6.1 User Cohorts:**
- **New Users**: Registered in last 7 days
- **Active Users**: Used app in last 7 days
- **Engaged Users**: Sent chat message in last 7 days

### **6.2 Feature Usage Cohorts:**
- **Profile Pic Review Users**: Submitted review
- **Fit Check Users**: Completed fit check
- **Chat Users**: Sent messages

## **Step 7: Set Up Dashboards**

### **7.1 Key Metrics Dashboard:**
- **Total Users**
- **Daily Active Users**
- **Conversion Rate**: Landing → Registration
- **Feature Usage**: Chat, Profile Review, Fit Check
- **Retention**: Day 1, 7, 30

### **7.2 Funnel Analysis Dashboard:**
- **Landing Page Conversion**
- **Profile Pic Review Completion**
- **Registration Completion**
- **Feature Adoption**

## **Step 8: Set Up Alerts**

### **8.1 Conversion Alerts:**
- **Registration drop**: < 5% conversion
- **Feature usage drop**: < 10% of users
- **Error rate increase**: > 5% errors

## **Success Indicators:**

✅ **Events flowing**: See events in Mixpanel Live View
✅ **Funnels working**: Conversion rates showing
✅ **Cohorts populated**: Users in defined groups
✅ **Dashboards updated**: Real-time metrics
✅ **Alerts configured**: Monitoring key metrics

## **Next Steps:**

1. **Complete Mixpanel setup**
2. **Test all events**
3. **Create funnels and dashboards**
4. **Set up alerts**
5. **Document for Jules-Style migration**
