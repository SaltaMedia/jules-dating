# 🎯 Clean Analytics Mapping - Jules Dating KPIs

## 📊 **CORE METRICS MAPPING:**

| **KPI Category** | **User Action** | **Analytics Event Name** | **Properties** | **Source** |
|---|---|---|---|---|
| **USERS** |
| User Registration | Complete registration | `User Registered` | `method: email/oauth`, `source` | Backend |
| **ACTIVE USERS** |
| Daily/Weekly/Monthly Usage | Any feature usage | `User Active` | `feature`, `timestamp` | Backend |
| **LANDING PAGE** |
| Landing Page Visits | Visit landing page | `Landing Page Visited` | `source`, `utm_*` | Frontend |
| CTA Clicks | Click "Get FREE Profile Pic Review" | `CTA Clicked` | `button: "Get FREE Profile Pic Review"`, `location` | Frontend |
| CTA Clicks | Click "Sign Up for FREE!" | `CTA Clicked` | `button: "Sign Up for FREE!"`, `location` | Frontend |
| **FREE PROFILE PIC REVIEW** |
| Free Review Submitted | Submit free profile pic review | `Free Profile Pic Review Submitted` | `has_specific_question`, `rating` | Backend |
| **SIGN-UP FLOW** |
| Sign-up Clicks | Click sign-up from any page | `Sign Up Clicked` | `source_page`, `context` | Frontend |
| **REGISTRATION** |
| Email Registration | Complete email registration | `User Registered` | `method: "email"`, `source` | Backend |
| OAuth Registration | Complete OAuth registration | `User Registered` | `method: "oauth"`, `provider` | Backend |
| **LOGIN** |
| Email Login | Login with email | `User Logged In` | `method: "email"` | Backend |
| OAuth Login | Login with OAuth | `User Logged In` | `method: "oauth"`, `provider` | Backend |
| **CHAT** |
| Chat Messages | Send chat message | `Chat Message Sent` | `user_id`, `message_length`, `intent` | Backend |
| **FIT CHECKS** |
| Fit Check Started | Start fit check | `Fit Check Started` | `user_id`, `source` | Frontend |
| Fit Check Completed | Complete fit check | `Fit Check Completed` | `user_id`, `rating`, `items_count` | Backend |
| **PROFILE PIC REVIEW (AUTH)** |
| Profile Review Started | Start authenticated profile review | `Profile Pic Review Started` | `user_id`, `source` | Frontend |
| Profile Review Completed | Complete authenticated profile review | `Profile Pic Review Completed` | `user_id`, `rating`, `has_specific_question` | Backend |
| **PAGE SESSIONS** |
| Chat Page Session | Visit chat page | `Page Session Started` | `page: "chat"`, `user_id` | Frontend |
| Fit Check Page Session | Visit fit check page | `Page Session Started` | `page: "fit_check"`, `user_id` | Frontend |
| Profile Review Page Session | Visit profile review page | `Page Session Started` | `page: "profile_pic_review"`, `user_id` | Frontend |
| Tips Page Session | Visit tips page | `Page Session Started` | `page: "tips"`, `user_id` | Frontend |
| **ASK JULES** |
| Ask Jules Click | Click "Ask Jules" from profile review | `Ask Jules Clicked` | `source: "profile_pic_review"`, `context` | Frontend |
| **SESSION TRACKING** |
| Site Session | Start site session | `Session Started` | `session_id`, `timestamp` | Frontend |
| Site Session | End site session | `Session Ended` | `session_id`, `duration_ms` | Frontend |

---

## 🧹 **CLEANUP REQUIRED:**

### **Remove These Duplicate Events:**
1. ❌ `chat_message_sent` (frontend) - Keep only `Chat Message Sent` (backend)
2. ❌ `chat message_sent` (universalTracker) - Keep only `Chat Message Sent` (backend)  
3. ❌ `Profile Pic Review Submitted` (frontend) - Keep only backend version
4. ❌ `Feature Used` (generic) - Replace with specific events
5. ❌ `Page Visited` (generic) - Replace with `Page Session Started`

### **Add These Missing Events:**
1. ✅ `User Active` - For daily/weekly/monthly active users
2. ✅ `Fit Check Started` - Track fit check initiation
3. ✅ `Profile Pic Review Started` - Track authenticated review start
4. ✅ `Page Session Started` - Track page-level sessions
5. ✅ `Ask Jules Clicked` - Track Ask Jules button clicks

---

## 🎯 **IMPLEMENTATION PLAN:**

1. **Remove all duplicate tracking calls**
2. **Add missing KPI events**
3. **Standardize event names and properties**
4. **Test each KPI to ensure single, clean events**

**Ready to implement this clean mapping?**
