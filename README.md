# VoiceLock™ by Stream Disc

A voice security system built with Next.js, TypeScript, and Firebase. This functional prototype demonstrates the VoiceLock concept with a clean architecture designed for AI integration in the next phase.

## Features

- **User Authentication**: Firebase Email/Password authentication
- **VoiceLock Profile Setup**: Create and manage your voice profile
- **Asset Verification**: Verify assets with VoiceLock scoring and serial generation
- **Analytics Dashboard**: Track verifications and view detailed statistics
- **Clean Architecture**: Structured for easy ML model integration

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend**: Firebase Firestore (via Admin SDK)
- **Authentication**: Firebase Auth
- **VoiceLock Engine**: Functional prototype engine with deterministic scoring for design and demo purposes

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase project with Firestore and Authentication enabled
- Firebase Admin SDK service account key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd stream-disc-voice-lock
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

4. Fill in your Firebase credentials in `.env.local`:
   - Get your Firebase client config from Firebase Console > Project Settings > General
   - Get your Admin SDK service account key from Firebase Console > Project Settings > Service Accounts

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication with Email/Password provider
3. Enable Firestore Database
4. Create a service account:
   - Go to Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file and extract the values for `.env.local`

## Project Structure

```
stream-disc-voice-lock/
├── app/
│   ├── api/
│   │   └── voice-lock/
│   │       ├── profile/route.ts
│   │       ├── verify/route.ts
│   │       └── verifications/route.ts
│   ├── dashboard/
│   │   └── page.tsx
│   ├── voice-lock/
│   │   ├── setup/page.tsx
│   │   └── verify/page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── AuthGate.tsx
│   ├── AuthModal.tsx
│   ├── Navbar.tsx
│   ├── StatsCards.tsx
│   └── VerificationsTable.tsx
├── contexts/
│   └── AuthContext.tsx
├── lib/
│   ├── firebaseAdmin.ts
│   ├── firebaseClient.ts
│   ├── firestore.ts
│   └── voiceLockEngine.ts
└── types/
    └── voiceLock.ts
```

## VoiceLock Engine

The current implementation is a functional prototype that generates deterministic scores based on `userId` and `assetId`. This phase focuses on function, design, and demonstration before moving to AI integration.

**Next Phase - AI Integration:**
1. Replace the `runVoiceLock` function in `lib/voiceLockEngine.ts`
2. Call your ML service (e.g., Cloud Run, Vertex AI)
3. Return the same `VoiceLockResult` type

## Data Models

### User Document
- Collection: `users`
- Document ID: Firebase Auth UID
- Fields: `email`, `createdAt`, `updatedAt`

### VoiceLock Profile
- Collection: `users/{uid}/voiceLockProfile`
- Document ID: `profile`
- Fields: `voiceLockId`, `hasVoiceLock`, `samplesCount`, `calibrationLevel`, `createdAt`, `updatedAt`

### VoiceLock Verification
- Collection: `voiceLockVerifications`
- Fields: `userId`, `assetId`, `similarityScore`, `grade`, `serial`, `createdAt`

## License

MIT
