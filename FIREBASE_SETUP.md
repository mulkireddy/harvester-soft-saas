# Firebase Auth Setup (Hybrid)

To enable Free SMS OTP with Firebase while keeping Supabase for data, follow these steps:

## 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Create a new project (e.g., "harvester-auth").

## 2. Enable Phone Auth
1. In Firebase Console -> **Build** -> **Authentication**.
2. Click **Get Started**.
3. Select **Phone** provider -> Enable it.
4. (Optional) Add your own phone number in "Phone numbers for testing" to avoid SMS costs during dev.

## 3. Get Config
1. Project Settings (Gear Icon) -> General.
2. Scroll to "Your apps" -> Click `</>` (Web).
3. Register app (e.g., "Harvester Web").
4. Copy the **firebaseConfig** object. You will need this for the `.env` file.

## 4. Get Admin Service Account (For Backend)
1. Project Settings -> **Service accounts**.
2. Click **Generate new private key**.
3. This downloads a `.json` file.
4. You will need the contents of this JSON for the Supabase Edge Function to verify users.

## 5. Update .env
Create/Update your `.env` file with:

```env
# Existing Supabase
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

# New Firebase (Public)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```
