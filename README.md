# Stream Disc App MVP

A voice identity intelligence system built with Next.js, TypeScript, and Firebase. Features two powerful modes:
- **VIIM (Voice Identity Intelligence Model)**: Multi-speaker identification with dataset management
- **VoiceLock**: Personal voice authentication and verification

## 🚀 Features

### VIIM Mode
- **Multi-Speaker Identification**: Identify speakers from a dataset of enrolled voices
- **Dataset Management**: Create and manage multiple voice datasets
- **Voice Fingerprinting**: AI-powered voice enrollment with ECAPA-TDNN embeddings
- **Speaker Verification**: Verify voice identity with confidence scores
- **Recording Search**: Find similar recordings in your dataset

### VoiceLock Mode
- **Personal Voice Authentication**: Secure voice-based authentication
- **Voice Profile Setup**: Create your personal voice lock profile
- **Real-time Verification**: Instant voice verification with similarity scores
- **Verification History**: Track all verification attempts and results

### Common Features
- **User Authentication**: Firebase Email/Password authentication
- **Analytics Dashboard**: Comprehensive verification statistics
- **Real-time Audio Processing**: Live audio recording and analysis
- **Beautiful UI**: Modern, responsive interface with smooth animations

## 🛠 Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Backend**: Firebase Firestore (Admin SDK)
- **Authentication**: Firebase Auth
- **ML Service**: Python-based VIIM ML service with ECAPA-TDNN
- **Icons**: Lucide React
- **Deployment**: Vercel (current) → Cloud Run (planned migration)

## 📋 Prerequisites

- Node.js 18+
- Python 3.8+ (for ML service)
- Firebase project with:
  - Firestore Database enabled
  - Authentication enabled (Email/Password)
  - Admin SDK service account key
- Vercel account (for deployment)

## 🏗 Build & Setup Instructions

### 1. Clone and Install

```bash
git clone https://github.com/YOUR_USERNAME/stream-disc-app-mvp.git
cd stream-disc-app-mvp
npm install
```

### 2. Environment Configuration

Create `.env.local` from the example:

```bash
cp .env.local.example .env.local
```

Fill in your Firebase credentials in `.env.local`:

```env
# Firebase Client Config
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# ML Service (optional for local development)
NEXT_PUBLIC_ML_SERVICE_URL=http://localhost:8000
```

### 3. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication:
   - Go to Authentication → Sign-in method
   - Enable Email/Password
3. Enable Firestore:
   - Go to Firestore Database → Create database
   - Start in production mode or test mode
4. Get Admin SDK credentials:
   - Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Extract values for `.env.local`

### 4. Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. ML Service Setup (Optional)

For full VIIM functionality, run the ML service:

```bash
cd services/viim-ml
pip install -r requirements.txt
python main.py
```

See [services/viim-ml/SETUP.md](services/viim-ml/SETUP.md) for detailed ML service setup.

## 🚀 Deployment

### Current: Vercel Deployment

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

4. **Add Environment Variables:**
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Add all variables from `.env.local`

### Planned: Cloud Run Migration

Documentation for Cloud Run deployment will be added when ready for migration.

## 📁 Project Structure

```
stream-disc-app-mvp/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── viim/                 # VIIM endpoints
│   │   │   ├── profile/          # User profile management
│   │   │   ├── enroll/           # Voice enrollment
│   │   │   ├── verify/           # Voice verification
│   │   │   ├── identify/         # Speaker identification
│   │   │   ├── datasets/         # Dataset management
│   │   │   ├── sessions/         # Session history
│   │   │   └── verifications/    # Verification history
│   │   └── voice-lock/           # VoiceLock endpoints
│   │       ├── profile/          # Profile management
│   │       ├── verify/           # Voice verification
│   │       ├── sessions/         # Session tracking
│   │       └── verifications/    # Verification history
│   ├── viim/                     # VIIM pages
│   │   ├── setup/                # Voice enrollment
│   │   ├── verify/               # Speaker verification
│   │   ├── interface/            # Main VIIM interface
│   │   ├── sessions/             # Session history
│   │   └── read/                 # Reading prompts
│   ├── voice-lock/               # VoiceLock pages
│   │   ├── setup/                # Profile setup
│   │   ├── verify/               # Verification
│   │   └── sessions/             # History
│   ├── dashboard/                # Analytics dashboard
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── viim/                     # VIIM-specific components
│   │   ├── VIIM.tsx              # Main VIIM interface
│   │   ├── VIIMRecorder.tsx      # Audio recorder
│   │   ├── VIIMAnimation.tsx     # Voice visualization
│   │   └── ...
│   ├── AuthGate.tsx              # Authentication guard
│   ├── AuthModal.tsx             # Login/signup modal
│   ├── Navbar.tsx                # Navigation bar
│   ├── RecordButton.tsx          # Recording control
│   └── ...
├── contexts/                     # React contexts
│   ├── AuthContext.tsx           # Authentication state
│   └── VIIMContext.tsx           # VIIM state management
├── lib/                          # Core libraries
│   ├── firebaseAdmin.ts          # Firebase Admin SDK
│   ├── firebaseClient.ts         # Firebase Client SDK
│   ├── firestore.ts              # Firestore helpers
│   ├── viimEngine.ts             # VIIM processing engine
│   ├── voiceLockEngine.ts        # VoiceLock engine
│   ├── mlServiceClient.ts        # ML service integration
│   └── models/                   # Model configurations
│       ├── audioModels.ts        # Audio processing models
│       ├── streamdisc.ts         # StreamDisc model
│       └── ...
├── services/                     # External services
│   └── viim-ml/                  # Python ML service
│       ├── main.py               # FastAPI server
│       ├── models/               # ML models
│       ├── utils/                # Utilities
│       ├── requirements.txt      # Python dependencies
│       └── Dockerfile            # Container config
├── types/                        # TypeScript types
│   ├── viim.ts                   # VIIM types
│   └── voiceLock.ts              # VoiceLock types
├── functions/                    # Firebase Functions
│   ├── src/
│   │   └── index.ts
│   └── package.json
└── public/                       # Static assets
```

## 🔧 Build Scripts

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)

# Production Build
npm run build            # Build for production
npm run start            # Start production server

# Linting
npm run lint             # Run ESLint

# Firebase Functions
cd functions
npm install              # Install function dependencies
npm run build            # Build functions
npm run deploy           # Deploy to Firebase
```

## 🗄 Data Models

### VIIM Profile
- **Collection**: `users/{uid}/viimProfile`
- **Fields**: 
  - `viimId`: Unique identifier
  - `hasVIIM`: Boolean enrollment status
  - `datasets`: Array of dataset IDs
  - `activeDataset`: Current dataset ID
  - `createdAt`, `updatedAt`

### VIIM Dataset
- **Collection**: `viimDatasets`
- **Fields**:
  - `id`: Dataset identifier
  - `name`: Dataset name
  - `creatorId`: Owner user ID
  - `enrolledSpeakers`: Count
  - `createdAt`

### VIIM Enrollments
- **Collection**: `viimEnrollments`
- **Fields**:
  - `datasetId`, `speakerId`, `voiceprint`
  - `createdAt`

### VoiceLock Profile
- **Collection**: `users/{uid}/voiceLockProfile`
- **Fields**:
  - `voiceLockId`, `hasVoiceLock`
  - `samplesCount`, `calibrationLevel`
  - `createdAt`, `updatedAt`

### Verifications
- **Collection**: `viimVerifications` / `voiceLockVerifications`
- **Fields**:
  - `userId`, `similarityScore`, `grade`
  - `serial`, `createdAt`

## 🔐 Security Notes

- Never commit `.env.local` or Firebase credentials
- Keep Firebase Admin SDK private key secure
- Use Firebase Security Rules for Firestore
- Implement proper API authentication
- Sanitize user inputs

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Type checking
npx tsc --noEmit
```

## 📚 Additional Documentation

- [VIIM Quick Start](VIM_QUICK_START.md)
- [VoiceLock Setup](SETUP_INSTRUCTIONS.md)
- [ML Service Setup](services/viim-ml/SETUP.md)
- [Firebase Setup Guide](FIREBASE_SETUP.md)
- [Backend Flow](BACKEND_FLOW.md)
- [Project Roadmap](PROJECT_ROADMAP.md)

## 🐛 Troubleshooting

### Build Errors
- Clear `.next` folder: `rm -rf .next` (or `rmdir /s .next` on Windows)
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version: `node -v` (should be 18+)

### Firebase Issues
- Verify credentials in `.env.local`
- Check Firestore rules
- Ensure APIs are enabled in Firebase Console

### ML Service Issues
- Check Python version: `python --version` (should be 3.8+)
- Install dependencies: `pip install -r requirements.txt`
- Verify ML service URL in environment variables

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for more details.

## 🗺 Roadmap

- [x] VIIM multi-speaker identification
- [x] VoiceLock authentication
- [x] Dataset management
- [x] Firebase integration
- [x] Vercel deployment
- [ ] Cloud Run migration
- [ ] Enhanced ML models
- [ ] Real-time collaboration
- [ ] Mobile app
- [ ] API webhooks

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open a GitHub issue.

---

Built with ❤️ using Next.js, Firebase, and Voice AI
