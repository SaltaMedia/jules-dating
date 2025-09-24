# Jules Dating App

AI-powered dating advice and profile optimization app. Get honest feedback on your profile pictures and dating advice from Jules, your confident wingwoman.

## Features

- **Profile Pic Review**: Get honest feedback on your dating profile pictures
- **Fit Check**: Outfit advice for dates and special occasions  
- **Chat**: Dating advice and conversation with Jules
- **Freemium Experience**: 1 free profile pic review, then sign up for full access

## Quick Start

1. **Install dependencies**
   ```bash
   npm run install:all
   ```

2. **Set up environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env with your configuration
   
   # Frontend  
   cp frontend/.env.local.example frontend/.env.local
   # Edit frontend/.env.local with your configuration
   ```

3. **Start development servers**
   ```bash
   npm run dev
   ```

## Project Structure

```
jules-dating/
├── backend/           # Node.js/Express API
├── frontend/          # Next.js React app
├── package.json       # Root package configuration
└── README.md         # This file
```

## Environment Setup

### Backend (.env)
- `MONGODB_URI` - MongoDB connection string
- `OPENAI_API_KEY` - OpenAI API key
- `JWT_SECRET` - JWT signing secret
- `CLOUDINARY_*` - Cloudinary image upload credentials

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_APP_NAME` - App name (Jules Dating)

## Deployment

- **Frontend**: Deploy to Vercel
- **Backend**: Deploy to Render
- **Database**: MongoDB Atlas
- **Domain**: dating.juleslabs.com

