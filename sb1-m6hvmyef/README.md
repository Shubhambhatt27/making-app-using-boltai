# Health Scanner App

A React Native mobile application that uses AI to analyze food ingredient lists and provide health insights.

## Features

- **Smart Ingredient Scanning**: Use your phone's camera to scan ingredient lists
- **AI-Powered Analysis**: Get instant health scores and detailed explanations powered by Google Gemini AI
- **Scan History**: View your analysis history in a convenient chat-style interface
- **User Profiles**: Manage your account and track your health journey
- **Secure Authentication**: Email/password authentication with Firebase

## Getting Started

### Prerequisites

- Node.js 18+ 
- Expo CLI
- iOS Simulator or Android Emulator (or physical device)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Firebase Setup

To enable full functionality, you'll need to:

1. Create a Firebase project
2. Enable Authentication (Email/Password)
3. Set up Firestore database
4. Configure Firebase Storage
5. Update the Firebase configuration in `services/firebaseConfig.ts`

### Google AI Integration

1. Get a Google AI API key for Gemini
2. Set up Firebase Cloud Functions for AI processing
3. Implement the two-step analysis workflow as described in the PRD

## App Structure

```
app/
├── (tabs)/               # Main tab navigation
│   ├── index.tsx        # Home dashboard
│   ├── scan.tsx         # Camera scanning interface
│   ├── history.tsx      # Scan history (chat-style)
│   └── profile.tsx      # User profile management
├── auth/                # Authentication screens
│   ├── login.tsx        # Login screen
│   └── register.tsx     # Registration screen
└── _layout.tsx          # Root layout

components/
├── HealthScoreIndicator.tsx  # Health score display component
├── ScanCard.tsx             # Scan history card component
└── LoadingSpinner.tsx       # Loading indicator component

services/
├── firebaseConfig.ts        # Firebase configuration
├── authService.ts          # Authentication service
└── scanService.ts          # Scan and analysis service
```

## Key Features Implementation

### Camera Scanning
- Uses `expo-camera` for image capture
- Provides visual guides for proper framing
- Includes preview and retake functionality

### AI Analysis Workflow
1. **Image Capture**: User takes photo of ingredient list
2. **Text Extraction**: Gemini Vision API extracts ingredients via OCR
3. **Health Analysis**: Gemini Text API analyzes health implications
4. **Results Display**: Shows score, explanation, pros/cons

### Chat-Style History
- Displays scans as conversations between user and AI
- User messages show uploaded images
- AI responses show analysis cards with scores

### User Experience
- Smooth animations and transitions
- Loading states for all async operations
- Error handling with user-friendly messages
- Responsive design for various screen sizes

## Production Deployment

Before deploying to production:

1. Set up Firebase Cloud Functions for AI processing
2. Configure proper Firebase Security Rules
3. Add proper error logging and monitoring
4. Implement rate limiting for API calls
5. Add comprehensive testing
6. Set up CI/CD pipeline

## License

This project is for demonstration purposes. Please ensure you have proper licenses for all APIs and services used in production.