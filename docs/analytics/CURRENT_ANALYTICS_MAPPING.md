# 📊 Current Analytics Event Mapping

## 🚨 **DUPLICATE EVENTS IDENTIFIED:**

### Chat Events (Multiple Tracking):
1. **Frontend**: `chat_message_sent` (line 545 in chat/page.tsx)
2. **Backend**: `Chat Message Sent` (line 131 in segment.js) 
3. **Backend**: `chat message_sent` (line 939 in chatController.js via universalTracker)
4. **Backend**: `chat message_sent` (line 47 in test-localhost-analytics.js)

### Feature Events (Confusing):
1. **Generic**: `Feature Used` (old format)
2. **Specific**: `chat message_sent` (new format I just changed)

---

## 📋 **CURRENT EVENT MAPPING TABLE:**

| **User Action** | **Frontend Event** | **Backend Event** | **Analytics Event Name** | **Status** |
|---|---|---|---|---|
| **LANDING PAGE** |
| Visit landing page | `Landing Page Visited` | - | `Landing Page Visited` | ✅ Clean |
| Click CTA button | `CTA Clicked` | - | `CTA Clicked` | ✅ Clean |
| **PROFILE PIC REVIEW** |
| Visit free review page | `Free Profile Pic Review Page Visited` | - | `Free Profile Pic Review Page Visited` | ✅ Clean |
| Submit review (free) | - | `Profile Pic Review Submitted` | `Profile Pic Review Submitted` | ✅ Clean |
| Complete review (free) | `Free Profile Pic Review Completed` | - | `Free Profile Pic Review Completed` | ✅ Clean |
| Click sign up after review | `Sign Up Clicked After Profile Pic Review` | - | `Sign Up Clicked After Profile Pic Review` | ✅ Clean |
| Visit auth review page | `Profile Pic Review Page Visited` | - | `Profile Pic Review Page Visited` | ✅ Clean |
| Submit review (auth) | `Profile Pic Review Submitted` | `Profile Pic Review Submitted` | `Profile Pic Review Submitted` | ⚠️ Duplicate |
| Complete review (auth) | `Profile Pic Review Completed` | - | `Profile Pic Review Completed` | ✅ Clean |
| **REGISTRATION** |
| Complete registration | - | `Registration Completed` | `Registration Completed` | ✅ Clean |
| **LOGIN** |
| User login | - | `User Logged In` | `User Logged In` | ✅ Clean |
| **CHAT** |
| Open chat page | `chat_opened` | - | `chat_opened` | ✅ Clean |
| Send message (frontend) | `chat_message_sent` | - | `chat_message_sent` | ⚠️ Duplicate |
| Send message (backend) | - | `Chat Message Sent` | `Chat Message Sent` | ⚠️ Duplicate |
| Send message (backend) | - | `chat message_sent` | `chat message_sent` | ⚠️ Duplicate |
| Receive response | `chat_response_received` | - | `chat_response_received` | ✅ Clean |
| **PAGE NAVIGATION** |
| Visit any page | `[Page Name] Visited` | - | `Registration Page Visited`, `Chat Page Visited`, etc. | ✅ Clean |
| **SESSIONS** |
| Start session | `Session Started` | - | `Session Started` | ✅ Clean |
| End session | `Session Ended` | - | `Session Ended` | ✅ Clean |

---

## 🎯 **RECOMMENDED CLEAN MAPPING:**

Please tell me which KPIs you want to track, and I'll create a clean, non-duplicate mapping. For example:

### **Core Funnel Events:**
- Landing Page Visited
- CTA Clicked  
- Registration Completed
- User Logged In
- Chat Message Sent (once, not 3 times!)

### **Feature Usage Events:**
- Profile Pic Review Submitted
- Fit Check Submitted
- Wardrobe Item Added

### **Engagement Events:**
- Chat Opened
- Session Started/Ended

**What specific KPIs do you want to track?** I'll clean up all the duplicates and create a single, clear mapping.
