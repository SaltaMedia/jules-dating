# 🎯 Clear Analytics Mapping - Jules Dating

## 📊 **UPDATED EVENT MAPPING:**

| **User Action** | **Segment Event** | **What It Tracks** | **Properties** |
|---|---|---|---|
| **LANDING PAGE** |
| Visit landing page | `Landing Page Visited` | User visits homepage | `source`, `utm_*` |
| Click "Get FREE Profile Pic Review" | `CTA Clicked` | User clicks main CTA | `buttonText: "Get FREE Profile Pic Review"` |
| Click "Sign Up for FREE!" | `CTA Clicked` | User clicks sign up CTA | `buttonText: "Sign Up for FREE!"` |
| **PROFILE PIC REVIEW** |
| Submit free profile pic review | `Free Profile Pic Review Submitted` | User submits free review | `rating`, `has_specific_question` |
| Complete free profile pic review | `Free Profile Pic Review Completed` | Review completed successfully | `rating`, `has_specific_question` |
| **REGISTRATION & LOGIN** |
| Complete email registration | `User Registered` | New user signs up with email | `method: "email"` |
| Complete OAuth registration | `User Registered` | New user signs up with OAuth | `method: "oauth"` |
| Email login | `User Logged In` | User logs in with email | `method: "email"` |
| OAuth login | `User Logged In` | User logs in with OAuth | `method: "oauth"` |
| **CHAT** |
| Send chat message | `Chat Message Sent` | User sends message to Jules | `message_length`, `intent` |
| **FIT CHECK** |
| Upload/take picture for fit check | `Fit Check Item Added` | User uploads image for fit check | `itemType`, `source` |
| Submit fit check | `Fit Check Submitted` | User submits fit check for analysis | `rating`, `items_count` |
| Complete fit check | `Fit Check Completed` | Fit check analysis completed | `rating`, `items_count` |
| **PAGE SESSIONS** |
| Visit any page | `Page Session Started` | User visits specific page | `page: "chat/fit_check/profile_pic_review/tips"` |
| **SESSIONS** |
| Start site session | `Session Started` | User starts browsing | `session_id`, `timestamp` |
| End site session | `Session Ended` | User leaves site | `session_id`, `duration_ms` |

---

## 🎯 **KEY INSIGHTS:**

### **"Fit Check Item Added" = Image Upload**
- **When**: User takes a picture or uploads an image for fit check
- **Tracks**: Image uploads for outfit analysis
- **Properties**: `itemType`, `source`, `image_count`

### **"CTA Clicked" = Specific Button Tracking**
- **To see which button**: Click on "CTA Clicked" event in Segment debugger
- **Properties**: `buttonText` shows exact button name
- **Examples**: 
  - `buttonText: "Get FREE Profile Pic Review"`
  - `buttonText: "Sign Up for FREE!"`

### **"Chat Message Sent" = User Engagement**
- **When**: User sends any message to Jules
- **Tracks**: Chat engagement and conversation flow
- **Properties**: `message_length`, `intent`, `user_id`

---

## ✅ **CLEAN, NON-DUPLICATE EVENTS:**

- ✅ **No more duplicates** - Each action maps to exactly one event
- ✅ **Clear naming** - Event names explain what happened
- ✅ **Specific properties** - Each event includes relevant details
- ✅ **KPI focused** - Tracks your key metrics for user behavior

**Your analytics are now clean and ready for accurate funnel analysis!** 🎉
