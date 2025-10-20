# 🎯 Segment Analytics - Clean KPI Mapping

## 📊 **SEGMENT EVENTS FOR YOUR KPIs:**

| **KPI** | **Segment Event Name** | **Properties** | **Source** |
|---|---|---|---|
| **USERS** |
| User Registration | `User Registered` | `method: email/oauth`, `source` | Backend |
| **ACTIVE USERS** |
| Daily/Weekly/Monthly Usage | `User Active` | `feature`, `timestamp` | Backend |
| **LANDING PAGE** |
| Landing Page Visits | `Landing Page Visited` | `source`, `utm_source`, `utm_medium`, `utm_campaign` | Frontend |
| CTA Clicks | `CTA Clicked` | `button_text`, `location`, `source` | Frontend |
| **FREE PROFILE PIC REVIEW** |
| Free Review Submitted | `Free Profile Pic Review Submitted` | `has_specific_question`, `rating` | Backend |
| **SIGN-UP FLOW** |
| Sign-up Clicks | `Sign Up Clicked` | `source_page`, `context` | Frontend |
| **REGISTRATION** |
| Email Registration | `User Registered` | `method: "email"`, `source` | Backend |
| OAuth Registration | `User Registered` | `method: "oauth"`, `provider` | Backend |
| **LOGIN** |
| Email Login | `User Logged In` | `method: "email"` | Backend |
| OAuth Login | `User Logged In` | `method: "oauth"`, `provider` | Backend |
| **CHAT** |
| Chat Messages | `Chat Message Sent` | `user_id`, `message_length`, `intent` | Backend |
| **FIT CHECKS** |
| Fit Check Started | `Fit Check Started` | `user_id`, `source` | Frontend |
| Fit Check Completed | `Fit Check Completed` | `user_id`, `rating`, `items_count` | Backend |
| **PROFILE PIC REVIEW (AUTH)** |
| Profile Review Started | `Profile Pic Review Started` | `user_id`, `source` | Frontend |
| Profile Review Completed | `Profile Pic Review Completed` | `user_id`, `rating`, `has_specific_question` | Backend |
| **PAGE SESSIONS** |
| Chat Page Session | `Page Session Started` | `page: "chat"`, `user_id` | Frontend |
| Fit Check Page Session | `Page Session Started` | `page: "fit_check"`, `user_id` | Frontend |
| Profile Review Page Session | `Page Session Started` | `page: "profile_pic_review"`, `user_id` | Frontend |
| Tips Page Session | `Page Session Started` | `page: "tips"`, `user_id` | Frontend |
| **ASK JULES** |
| Ask Jules Click | `Ask Jules Clicked` | `source: "profile_pic_review"`, `context` | Frontend |
| **SESSION TRACKING** |
| Site Session | `Session Started` | `session_id`, `timestamp` | Frontend |
| Site Session | `Session Ended` | `session_id`, `duration_ms` | Frontend |

---

## 🚨 **CURRENT SEGMENT DUPLICATES TO FIX:**

### **Chat Events (3 Duplicates!):**
1. ❌ Frontend: `chat_message_sent` 
2. ✅ Backend: `Chat Message Sent` (KEEP THIS ONE)
3. ❌ Backend: `chat message_sent` (universalTracker)

### **Profile Pic Review (2 Duplicates!):**
1. ❌ Frontend: `Profile Pic Review Submitted`
2. ✅ Backend: `Profile Pic Review Submitted` (KEEP THIS ONE)

### **Feature Events (Confusing!):**
1. ❌ Generic: `Feature Used`
2. ❌ New format: `chat message_sent` (I created this by mistake)

---

## 🧹 **SEGMENT CLEANUP ACTIONS:**

1. **Remove frontend chat tracking** - Keep only backend `Chat Message Sent`
2. **Remove frontend profile pic tracking** - Keep only backend version
3. **Remove universalTracker chat tracking** - Keep only segment.js version
4. **Revert feature tracking changes** - Back to simple `Feature Used` or specific events
5. **Add missing KPI events** - Fit Check Started, Profile Pic Review Started, etc.

**Ready to implement these Segment-specific fixes?**
