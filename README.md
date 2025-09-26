# Mood Journal

A mobile-first application for daily mood tracking, self-reflection (voice/text), and AI-powered journaling insights. Built with React Native (Expo) frontend and Flask backend with MongoDB.

## Features

- **User Authentication:** Email-password signup & login with JWT
- **Mood Journal Entry:** Daily mood tracking with 5 emotion options (Happy, Sad, Neutral, Angry, Anxious)
- **Voice Notes:** Record and playback 30-second audio reflections
- **AI Insights:** Personalized mood analysis and insights using OpenAI
- **Trend Visualization:** Mood history and statistics
- **Offline Support:** Local-first data storage with background sync

## Project Structure

## Prerequisites

- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **Expo CLI** (`npm install -g @expo/cli`)
- **Android Studio** (for Android emulator) or **Xcode** (for iOS simulator)

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

pip install -r requirements.txt
```

### 2. Environment Configuration

Create a `.env` file in the `backend` directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/mood_journal
MONGODB_DB=mood_journal

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-here
JWT_ACCESS_TOKEN_EXPIRES=86400

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here

# File Upload Configuration
UPLOAD_FOLDER=uploads
MAX_AUDIO_SIZE=16777216  # 16MB in bytes

# Flask Configuration
FLASK_ENV=development

UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=16777216
ALLOWED_AUDIO_EXTENSIONS=mp3,wav,m4a,aac

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:8081,exp://localhost:8081

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json
```
### 3. Start MongoDB

**Option A: MongoDB Atlas (Cloud) - This is what I have used**
- Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
- Create a new cluster
- Get your connection string and update `MONGODB_URI` in `.env`

**You can connect to your local mongodb installation. Just change the url in the env file.**

### 4. Run the Backend Server

```bash
cd backend
python app.py
```

**If you get error importing magic just install libmagic via brew since its required for python-magic (used to check mime types of audio) package.**

```python
brew install libmagic

```

The backend will start on `http://localhost:8000`

**Expected output:**


## Frontend Setup

### 1. Install Dependencies

```bash
cd mood-journal-app
npm install
```

### 2. Configure API Endpoint

Update the API base URL in `service/api.ts` based on your platform:

```typescript
// For Android Emulator:
const API_BASE_URL = "http://10.0.2.2:8000";

// For iOS Simulator:
const API_BASE_URL = "http://127.0.0.1:8000";

// For Physical Device (replace with your computer's IP):
// You can get the required ip adrress when running the backend. Replace the base url string with this for testing on mobile device.
// Make sure that both devices are connected to the same wifi

const API_BASE_URL = "http://192.168.1.100:8000";
```

### 3. Start the Development Server

```bash
cd mood-journal-app
npx expo start
```

### 4. Run on Device/Emulator

**Android Emulator:**
1. Start Android Studio
2. Open AVD Manager and start an emulator
3. Press `a` in the Expo CLI terminal

**iOS Simulator (macOS only):**
1. Press `i` in the Expo CLI terminal

**Physical Device:**
1. Install Expo Go app from App Store/Play Store
2. Scan the QR code with Expo Go

## API Endpoints

### Authentication
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user
- `POST /auth/logout` - User logout

### Mood Entries
- `POST /api/entries` - Create mood entry
- `GET /api/entries` - Get user's mood entries
- `GET /api/entries/<id>` - Get specific entry
- `PUT /api/entries/<id>` - Update entry
- `DELETE /api/entries/<id>` - Delete entry
- `GET /api/entries/stats` - Get mood statistics

### Audio
- `POST /api/audio/upload` - Upload audio file
- `GET /api/audio/<filename>` - Stream audio file
- `DELETE /api/audio/<filename>` - Delete audio file

### AI Insights
- `GET /api/insights/entry/<id>` - Get entry insight
- `GET /api/insights/weekly` - Get weekly summary

## Troubleshooting

### Backend Issues

**MongoDB Connection Error:**

**Port Already in Use:**
```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>
```

**Missing Dependencies:**
```bash
# Reinstall requirements
pip install -r requirements.txt --force-reinstall
```

### Frontend Issues

**Network Error on Android Emulator:**
- Ensure API_BASE_URL is set to `http://10.0.2.2:8000`

**Network Error on Physical Device:**
- Use your computer's IP address instead of localhost
- Ensure both devices are on the same network
- Check firewall settings

**Expo CLI Issues:**
```bash
# Clear Expo cache
npx expo start --clear

# Update Expo CLI
npm install -g @expo/cli@latest
```

### Common Development Issues

**Audio Upload Fails:**
- Check file size (max 16MB)
- Ensure file format is supported (mp3, wav, m4a, ogg, aac, flac)
- Verify backend audio upload endpoint is working

**AI Insights Not Generating:**
- Check OpenAI API key is valid
- Verify internet connection
- Check backend logs for AI service errors

## Development Workflow

1. **Start Backend:** `cd backend && python app.py`
2. **Start Frontend:** `cd mood-journal-app && npx expo start`
3. **Test on Device:** Use Expo Go or emulator
4. **View Logs:** Check terminal output for errors

---