# Weekly Insights Generator for Jules Dating

## 🎯 What This Does

This system generates weekly data insights about your Jules Dating app that you can share with users to increase engagement. It analyzes user activity and creates personalized insights and tips.

## 📊 What You Get

### Community Overview
- Total registered users
- Active users this week
- Engagement rate
- Profile pic reviews completed
- Fit checks completed
- Chat messages sent
- Average ratings

### User Insights
- Personalized feedback based on their activity
- Tips for improving their dating profile
- Encouragement based on engagement levels

### Actionable Recommendations
- What to focus on to increase engagement
- Feature promotion suggestions
- User retention strategies

## 🚀 How to Use

### Option 1: Run the Script Directly (Recommended)

```bash
cd /Users/stevesalta/jules-dating/backend
node generate-weekly-insights.js
```

This will:
- Connect to your database
- Analyze the past week's data
- Generate insights for all active users
- Save a report to `weekly-insights-YYYY-MM-DD.txt`
- Display the report in the console
- Show actionable recommendations

### Option 2: Use the API Endpoint

1. Start the insights API:
```bash
node generate-insights-endpoint.js
```

2. Call the API:
```bash
curl -H "Authorization: Bearer steve-jules-insights-2025" http://localhost:3001/generate-weekly-insights
```

## 📧 Sample Output

```
📊 JULES DATING WEEKLY INSIGHTS REPORT
Week of: 2025-09-30

🌟 COMMUNITY OVERVIEW:
• Total registered users: 22
• Active users this week: 0
• Engagement rate: 0.0%
• Profile pic reviews: 0
• Fit checks completed: 0
• Chat messages sent: 0
• Average profile pic rating: N/A/10
• Average fit check rating: N/A/10

💡 KEY INSIGHTS:
• 0 users actively engaged with Jules this week

📈 RECOMMENDATIONS:
• Consider sending engagement reminders to inactive users
• Promote profile pic review feature to increase usage
• Encourage more chat interactions with Jules

🎯 WEEKLY TIP TO SHARE WITH USERS:
"Your profile pic is your first impression - make it count! Try taking photos in natural light and don't forget to smile genuinely. Jules can help you pick the perfect pic! 📸✨"
```

## 💡 How to Share with Users

1. **Run the script weekly** (every Monday morning)
2. **Copy the "WEEKLY TIP"** from the output
3. **Send it to your users** via:
   - Email newsletter
   - Push notification
   - In-app message
   - Social media post

## 📈 Example User Engagement Messages

Based on the insights, you can create messages like:

- "This week, 15 users improved their profiles with Jules! 📸 Join them and get your personalized dating tips."
- "Our users are loving the fit check feature - 23 outfit reviews completed this week! 👔"
- "Pro tip: Users who upload 3+ photos get 40% more matches. Jules can help you pick the perfect pics! ✨"

## 🔧 Customization

You can modify the insights in `services/insightsService.js`:
- Add more insight templates
- Change the weekly tips
- Adjust rating thresholds
- Add new metrics

## 📅 Scheduling

Set up a weekly cron job to automatically generate insights:

```bash
# Add to crontab (runs every Monday at 9 AM)
0 9 * * 1 cd /path/to/jules-dating/backend && node generate-weekly-insights.js
```

## 🎯 Benefits

1. **User Engagement**: Regular insights keep users coming back
2. **Data-Driven Decisions**: Know what features are working
3. **Personalized Experience**: Users get tailored advice
4. **Community Building**: Share progress and tips
5. **Retention**: Regular communication improves user retention

## 📞 Support

If you need help or want to add more features, the system is built to be easily extensible. The main files are:
- `services/insightsService.js` - Core insight generation logic
- `controllers/insightsController.js` - API endpoints
- `generate-weekly-insights.js` - Main script to run

Happy analyzing! 📊✨
