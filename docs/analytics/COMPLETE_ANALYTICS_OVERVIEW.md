# 🎯 Complete Analytics Overview - Jules Dating → Jules-Style Migration

## **📊 Current Analytics Architecture**

### **Data Flow:**
```
Frontend (Next.js) → Segment → Mixpanel
Backend (Node.js) → Segment → Mixpanel
```

### **Key Components:**
- **Segment**: Event collection and routing
- **Mixpanel**: Analytics dashboard and insights
- **Frontend**: User interaction tracking
- **Backend**: Server-side event tracking

---

## **🔧 Technical Implementation**

### **1. Frontend Analytics (`frontend/src/utils/segment.ts`)**

#### **Segment Client Setup:**
```typescript
// Snippet-based Segment implementation
class SegmentClient {
  private loadSegmentSnippet(writeKey: string): Promise<void>
  async track(event: string, properties: Record<string, any>)
  trackLandingPageVisit(source: string, properties: Record<string, any>)
  trackCTAClick(buttonText: string, location: string, properties: Record<string, any>)
  trackFeatureUsage(feature: string, action: string, properties: Record<string, any>)
}
```

#### **Environment Variables:**
```bash
# Frontend (.env.local)
NEXT_PUBLIC_SEGMENT_WRITE_KEY=your_segment_write_key
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

### **2. Backend Analytics (`backend/utils/segment.js`)**

#### **Segment Server Setup:**
```javascript
// Server-side Segment implementation
class SegmentServer {
  track(userId, event, properties)
  trackSignup(userId, method, properties)
  trackLogin(userId, method, properties)
  trackChatMessage(userId, properties)
  trackFeatureUsage(userId, feature, action, properties)
}
```

#### **Environment Variables:**
```bash
# Backend (.env)
SEGMENT_WRITE_KEY=your_segment_write_key
ENABLE_ANALYTICS=true
```

### **3. Global Page Tracking (`frontend/src/components/LayoutWrapper.tsx`)**

#### **Automatic Page Tracking:**
```typescript
// Tracks every page visit with specific event names
const pageEventName = getPageEventName(pathname);
segment.track(pageEventName, {
  page: pathname,
  session_id: sessionId,
  timestamp: new Date().toISOString()
});
```

---

## **📈 Event Mapping & KPIs**

### **🎯 Core Funnel Events:**

| **User Journey Step** | **Segment Event** | **Mixpanel Event** | **KPI** |
|---|---|---|---|
| **Landing** | `Landing Page Visited` | `Landing Page Visited` | Landing page sessions |
| **Engagement** | `CTA Clicked` | `CTA Clicked` | CTA conversion rate |
| **Free Experience** | `Free Profile Pic Review Page Visited` | `Free Profile Pic Review Page Visited` | Free experience engagement |
| **Submission** | `Free Profile Pic Review Submitted` | `Free Profile Pic Review Submitted` | Free review completion |
| **Conversion** | `Sign Up Clicked After Profile Pic Review` | `Sign Up Clicked After Profile Pic Review` | Free-to-paid conversion |
| **Registration** | `User Registered` | `User Registered` | New user signups |
| **Login** | `User Logged In` | `User Logged In` | User retention |
| **Engagement** | `Chat Message Sent` | `Chat Message Sent` | Feature usage |
| **Feature Usage** | `Fit Check Item Added` | `Fit Check Item Added` | Feature adoption |
| **Completion** | `Fit Check Submitted` | `Fit Check Submitted` | Feature completion |

### **📊 Page Session Events:**

| **Page** | **Event Name** | **Purpose** |
|---|---|---|
| `/` | `Landing Page Visited` | Homepage engagement |
| `/register` | `Registration Page Visited` | Signup funnel |
| `/login` | `Login Page Visited` | User retention |
| `/chat` | `Chat Page Visited` | Feature usage |
| `/fitcheck` | `Fit Check Page Visited` | Feature adoption |
| `/profile-pic-review` | `Profile Pic Review Page Visited` | Feature usage |
| `/onboarding` | `Onboarding Page Visited` | User onboarding |
| `/tips` | `Tips Page Visited` | Content engagement |

### **🔧 Feature Usage Events:**

| **Feature** | **Event Pattern** | **Example** |
|---|---|---|
| **Chat** | `chat message_sent` | User engagement |
| **Fit Check** | `fit_check completed` | Feature completion |
| **Profile Review** | `profile_pic_review completed` | Feature usage |

---

## **🎯 Mixpanel Configuration**

### **1. Funnels Setup:**

#### **Main Conversion Funnel:**
```
Step 1: Landing Page Visited
Step 2: CTA Clicked  
Step 3: Free Profile Pic Review Page Visited
Step 4: Free Profile Pic Review Submitted
Step 5: Sign Up Clicked After Profile Pic Review
Step 6: User Registered
```

#### **Feature Adoption Funnel:**
```
Step 1: User Logged In
Step 2: Chat Page Visited
Step 3: Chat Message Sent
Step 4: Fit Check Page Visited
Step 5: Fit Check Item Added
Step 6: Fit Check Submitted
```

### **2. Cohorts Setup:**

#### **User Cohorts:**
- **New Users**: `User Registered` in last 7 days
- **Active Users**: Any event in last 7 days
- **Engaged Users**: `Chat Message Sent` in last 7 days
- **Feature Users**: `Fit Check Submitted` in last 30 days

#### **Behavioral Cohorts:**
- **High Engagers**: 5+ events in last 7 days
- **Feature Adopters**: Used 2+ features in last 30 days
- **Retained Users**: Active in last 7 days AND 30 days ago

### **3. Dashboards Setup:**

#### **Key Metrics Dashboard:**
- **Total Users** (cumulative)
- **Daily Active Users** (DAU)
- **Weekly Active Users** (WAU)
- **Monthly Active Users** (MAU)
- **Conversion Rate**: Landing → Registration
- **Feature Usage Rate**: % users using each feature
- **Retention Rate**: Day 1, 7, 30

#### **Funnel Analysis Dashboard:**
- **Landing Page Conversion**
- **Free Experience Completion**
- **Registration Completion**
- **Feature Adoption Rates**

---

## **🚀 Jules-Style Migration Plan**

### **Phase 1: Environment Setup**

#### **1.1 Create Segment Source:**
```bash
# In Segment Dashboard
1. Create new source: "Jules-Style"
2. Get write key
3. Configure settings
```

#### **1.2 Create Mixpanel Project:**
```bash
# In Mixpanel
1. Create project: "Jules-Style"
2. Get project token
3. Connect to Segment
```

#### **1.3 Environment Variables:**
```bash
# Frontend (.env.local)
NEXT_PUBLIC_SEGMENT_WRITE_KEY=jules_style_segment_key
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# Backend (.env)
SEGMENT_WRITE_KEY=jules_style_segment_key
ENABLE_ANALYTICS=true
```

### **Phase 2: Code Migration**

#### **2.1 Copy Analytics Files:**
```bash
# Copy from Jules-Dating to Jules-Style
frontend/src/utils/segment.ts
frontend/src/components/LayoutWrapper.tsx
backend/utils/segment.js
backend/utils/universalTracker.js
```

#### **2.2 Update Event Names:**
```typescript
// Update event names for Jules-Style context
'Landing Page Visited' → 'Style Landing Page Visited'
'Profile Pic Review' → 'Style Review'
'Fit Check' → 'Outfit Check'
```

#### **2.3 Update Page Mappings:**
```typescript
// Update getPageEventName for Jules-Style pages
const pageMap = {
  '/': 'Style Landing Page Visited',
  '/outfit-check': 'Outfit Check Page Visited',
  '/style-review': 'Style Review Page Visited',
  '/wardrobe': 'Wardrobe Page Visited'
};
```

### **Phase 3: Testing & Validation**

#### **3.1 Test Events:**
```javascript
// Test script for Jules-Style
window.analytics.track('Style Landing Page Visited', {
  test: true,
  source: 'migration_test'
});
```

#### **3.2 Verify Mixpanel:**
- Check Live View for events
- Verify funnels are working
- Test cohort creation
- Validate dashboard metrics

### **Phase 4: Cleanup & Optimization**

#### **4.1 Remove Old Analytics:**
- Remove custom analytics code
- Clean up unused tracking
- Update documentation

#### **4.2 Optimize Performance:**
- Review event frequency
- Optimize payload sizes
- Monitor error rates

---

## **📋 Migration Checklist**

### **Pre-Migration:**
- [ ] Jules-Style codebase ready
- [ ] Segment source created
- [ ] Mixpanel project created
- [ ] Environment variables prepared

### **Migration:**
- [ ] Copy analytics files
- [ ] Update event names
- [ ] Update page mappings
- [ ] Test frontend events
- [ ] Test backend events
- [ ] Verify Mixpanel connection

### **Post-Migration:**
- [ ] Set up funnels
- [ ] Create cohorts
- [ ] Build dashboards
- [ ] Set up alerts
- [ ] Remove old analytics
- [ ] Document changes

---

## **🎯 Key Success Metrics**

### **Technical Metrics:**
- ✅ **Event Delivery**: 99%+ events reaching Mixpanel
- ✅ **Data Quality**: No duplicate events
- ✅ **Performance**: <100ms tracking overhead
- ✅ **Error Rate**: <1% tracking errors

### **Business Metrics:**
- 📈 **Conversion Rate**: Landing → Registration
- 📈 **Feature Adoption**: % users using features
- 📈 **User Retention**: Day 1, 7, 30 retention
- 📈 **Engagement**: Events per user per session

---

## **🔧 Troubleshooting Guide**

### **Common Issues:**

#### **Events Not Appearing in Mixpanel:**
1. Check Segment debugger
2. Verify Mixpanel connection
3. Check environment variables
4. Test with direct API calls

#### **Duplicate Events:**
1. Check for multiple tracking calls
2. Verify session storage logic
3. Review page navigation logic

#### **Performance Issues:**
1. Check event payload sizes
2. Review tracking frequency
3. Monitor network requests

---

**🎉 This complete setup provides enterprise-grade analytics for Jules-Style with the same robust tracking as Jules-Dating!**
