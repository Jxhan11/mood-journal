# Mood Journal + AI Reflection App

Objective: Design a mobile app where users can log their mood, record short voice reflections, and receive personalized AI insights. The app should support user authentication and trend visualization.

Core Requirements:

1. User Authentication
Sign up / login via email-password
Backend to verify token (jwt)

2. Mood Journal Entry
Log today's mood: Slider or emoji picker (1–5 scale or Happy/Neutral/Sad)

Record a 30s voice note

Optional text reflection field

Store the entry locally first (AsyncStorage) and sync to backend when online

3. Backend API (Flask + MongoDB)
EndpointDescription
POST /entry
Accepts mood, note, optional audio URL, timestamp
GET /entries
Fetch last 7/30 mood logs
GET /entry/:id/insight
Returns AI-generated insight (OpenAI-based)
POST /upload-audio
Accepts and stores audio files (optional)

4. AI Insight Summary

Based on mood + note + audio transcript (optional)

Use OpenAI API with a structured prompt

“Summarize this reflection. What emotional patterns are visible? What can the user take away?”

Return 2–3 sentence insight
5. Mood History \& Trends
Show last 7 entries in a scrollable list
Tap any entry → open detail view: mood, text, voice playback, AI insight

App flow: user creates account -> login -> add mood -> save (local +server) -> in history, open 1 entry -> show AI summary+stored details
Deliverables
GitHub repo with folders: app/ and backend/

Working API and sample data

README.md with:

Setup steps (frontend + backend)



***

# Mood Journal + AI Reflection App

A mobile-first application for daily mood tracking, self-reflection (voice/text), and AI-powered journaling insights. Designed for a seamless user experience with robust offline support, authentication, and trend visualization.

***

## Features

- **User Authentication:** Email-password signup \& login with JWT.
- **Mood Journal Entry:** Daily mood (emoji/slider), 30s voice note, and optional text reflection.
- **AI Insights:** Personalized summary/insights from mood+reflection, generated using OpenAI.
- **Trend Visualization:** Mood trends from last 7 or 30 entries, entry-level detail view with playback and AI summary.
- **Local-First Sync:** Save entries with AsyncStorage and background sync to backend API when online.

***

## Project Structure

```plaintext
mood-journal-app/
│
├── app/       # React Native frontend
│   ├── components/
│   ├── screens/
│   ├── services/  # API & storage utils
│   └── App.js
│
├── backend/   # Flask API + MongoDB
│   ├── main.py
│   ├── models.py
│   ├── routes.py
│   ├── utils/
│   └── requirements.txt
│
└── README.md
```


***

## Backend API Overview

| Endpoint | Method | Description |
| :-- | :-- | :-- |
| /signup | POST | Register user, returns JWT |
| /login | POST | User login, returns JWT |
| /verify-token | POST | Verify JWT token (for protected routes) |
| /entry | POST | Save new mood entry (mood, note, audio URL, timestamp) |
| /entries | GET | Fetch last 7 or 30 entries (user-filtered via JWT) |
| /entry/<id>/insight | GET | Get AI-generated summary for entry |
| /upload-audio | POST | Upload and store audio files (returns audio URL) |


***

## Frontend Workflow

1. **Auth:** User signs up/logs in (email/password), JWT is stored locally.
2. **Mood Entry:** User selects mood (emoji/slider), records 30s audio, adds optional text.
3. **Local First:** Entry is saved to AsyncStorage. If online, it is POSTed to `/entry`; otherwise, it will sync automatically on next app open.
4. **History View:** Mood/timestamp list of last 7 entries (from backend or local).
5. **Entry Detail:** Tap to view mood data, text, play back audio, and see AI-generated summary.
6. **Sync:** All POSTs use JWT for auth. Sync status is indicated in UI.

***

## AI Insight Prompt (OpenAI)

> "Summarize this reflection. What emotional patterns are visible? What can the user take away?
Mood: [user mood]
Note: [optional text]
Transcript: [optional transcript, if audio provided]"

Return: 2–3 sentence personalized insight.

***

## Sample README Instructions

### Backend Setup

```bash
cd backend/
python3 -m venv env
source env/bin/activate
pip install -r requirements.txt
# Set up .env with MONGO_URI and OpenAI credentials
python main.py
```


### Frontend Setup

```bash
cd app/
npx react-native init MoodJournalApp
npm install @react-native-async-storage/async-storage axios @react-navigation/native
# Add recording library: react-native-audio, expo-av, or similar
npx react-native run-android  # or run-ios
```


***

## Sample Data

```json
{
  "user_id": "abc123",
  "mood": 3,
  "note": "Felt better after the gym, but work stressed me out.",
  "audio_url": "/uploads/audio/12345.mp3",
  "timestamp": "2025-09-23T12:34:56Z",
  "ai_insight": "Today showed both resilience and stress. Regular fitness helps manage your stress, but consider pacing yourself at work."
}
```


***

## Deliverables

- Fully working API, MongoDB schema, and sample entries.
- Frontend app with authentication, offline-first entries, and mood/history visualization.
- Repository structured as above, containing both `app/` and `backend/`.
- Complete documentation and setup steps in `README.md`.

---
