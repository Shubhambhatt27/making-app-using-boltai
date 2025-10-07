# Firebase Deployment Guide

This guide will walk you through deploying the Firebase Cloud Functions and setting up your Firebase project for the Health Scanner app.

## Prerequisites

1. Node.js (v18 or higher)
2. Firebase CLI installed globally
3. A Firebase project created

## Step 1: Install Firebase CLI

If you haven't already installed the Firebase CLI:

```bash
npm install -g firebase-tools
```

## Step 2: Login to Firebase

```bash
firebase login
```

This will open a browser window for you to authenticate with your Google account.

## Step 3: Initialize Firebase Project

If you haven't already created a Firebase project:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard

## Step 4: Link Your Local Project

Update the `.firebaserc` file with your Firebase project ID:

```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

Or run:

```bash
firebase use --add
```

And select your project from the list.

## Step 5: Configure Gemini API Key

You need to set the Gemini API key as a Firebase environment variable:

```bash
firebase functions:config:set gemini.apikey="your-gemini-api-key-here"
```

Verify the configuration:

```bash
firebase functions:config:get
```

## Step 6: Install Functions Dependencies

Navigate to the functions directory and install dependencies:

```bash
cd functions
npm install
cd ..
```

## Step 7: Build Functions

Build the TypeScript functions:

```bash
cd functions
npm run build
cd ..
```

This will compile the TypeScript code in `functions/src/` to JavaScript in `functions/lib/`.

## Step 8: Deploy Firestore Rules

Deploy the Firestore security rules:

```bash
firebase deploy --only firestore:rules
```

## Step 9: Deploy Firestore Indexes

Deploy the Firestore indexes:

```bash
firebase deploy --only firestore:indexes
```

## Step 10: Deploy Storage Rules

Deploy the Cloud Storage security rules:

```bash
firebase deploy --only storage
```

## Step 11: Deploy Cloud Functions

Deploy all Cloud Functions:

```bash
firebase deploy --only functions
```

This will deploy:
- `onImageUpload` - Triggers when images are uploaded to Storage
- `analyzeIngredients` - Callable function for analyzing ingredients
- `retryScan` - Callable function for retrying failed scans

### Deploy Individual Functions

If you want to deploy specific functions:

```bash
# Deploy only the onImageUpload function
firebase deploy --only functions:onImageUpload

# Deploy only the analyzeIngredients function
firebase deploy --only functions:analyzeIngredients

# Deploy only the retryScan function
firebase deploy --only functions:retryScan
```

## Step 12: Deploy Everything

To deploy all Firebase services at once:

```bash
firebase deploy
```

## Monitoring and Logs

### View Function Logs

```bash
firebase functions:log
```

### View Specific Function Logs

```bash
firebase functions:log --only onImageUpload
```

### Real-time Logs

```bash
firebase functions:log --follow
```

## Testing with Firebase Emulators

Before deploying to production, test your functions locally with Firebase emulators:

### Start Emulators

```bash
firebase emulators:start
```

This will start emulators for:
- Authentication (port 9099)
- Firestore (port 8080)
- Cloud Functions (port 5001)
- Cloud Storage (port 9199)
- Emulator UI (port 4000)

### Update Environment Variables for Local Testing

When using emulators, update your app's `.env` file:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=localhost
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
EXPO_PUBLIC_GEMINI_API_KEY=your-gemini-api-key
```

## Verifying Deployment

After deployment, verify everything is working:

1. **Check Functions in Console**
   - Go to Firebase Console > Functions
   - Verify all three functions are deployed

2. **Check Firestore Rules**
   - Go to Firebase Console > Firestore Database > Rules
   - Verify rules are updated

3. **Check Storage Rules**
   - Go to Firebase Console > Storage > Rules
   - Verify rules are updated

4. **Test the Flow**
   - Upload an image through your app
   - Check Cloud Functions logs for execution
   - Verify Firestore document is created and updated

## Troubleshooting

### Functions Not Deploying

If functions fail to deploy:

```bash
# Check for syntax errors
cd functions
npm run build

# Check Firebase CLI version
firebase --version

# Update Firebase CLI
npm install -g firebase-tools@latest
```

### Permission Errors

If you get permission errors:

```bash
# Make sure you're logged in
firebase login --reauth

# Check which project you're using
firebase use
```

### Environment Configuration Issues

If environment variables aren't working:

```bash
# Check current config
firebase functions:config:get

# Set config again
firebase functions:config:set gemini.apikey="your-key"

# Redeploy functions
firebase deploy --only functions
```

### Storage Trigger Not Working

If the `onImageUpload` function isn't triggering:

1. Verify Storage rules allow writes
2. Check that images are being uploaded to `scan_images/{userId}/{fileName}` path
3. Check Cloud Functions logs for errors
4. Ensure the function is deployed: `firebase deploy --only functions:onImageUpload`

## Costs and Quotas

### Firebase Free Tier (Spark Plan)

- Cloud Functions: 125,000 invocations/month, 40,000 GB-seconds
- Cloud Storage: 5 GB total storage, 1 GB/day downloads
- Cloud Firestore: 50,000 reads/day, 20,000 writes/day, 20,000 deletes/day

### Gemini API Free Tier

- 60 requests per minute
- Check current quotas at [Google AI Studio](https://makersuite.google.com/app/apikey)

### Monitoring Usage

Monitor usage in Firebase Console:
- Go to Usage and billing
- Set up budget alerts

## Production Checklist

Before going to production:

- [ ] All environment variables configured
- [ ] Security rules tested and deployed
- [ ] Functions tested with emulators
- [ ] Error handling verified
- [ ] Logging configured
- [ ] Budget alerts set up
- [ ] Monitoring dashboard created
- [ ] Backup strategy in place

## Updating Functions

To update functions after making changes:

1. Make changes to `functions/src/index.ts`
2. Build: `cd functions && npm run build`
3. Test with emulators: `firebase emulators:start`
4. Deploy: `firebase deploy --only functions`

## Rollback

If something goes wrong, you can rollback to a previous version:

```bash
# List previous deployments
firebase functions:list

# Rollback to previous version
firebase deploy --only functions --force
```

## Support

For issues:
- Check [Firebase Documentation](https://firebase.google.com/docs)
- Check [Gemini API Documentation](https://ai.google.dev/docs)
- Check Cloud Functions logs: `firebase functions:log`
