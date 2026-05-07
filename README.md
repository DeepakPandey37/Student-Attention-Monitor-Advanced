# 🎓 Student Attention Monitor

> An AI-powered mock test platform with real-time facial emotion detection, built to track student attention during online assessments.

---

## 📌 Table of Contents

- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [System Architecture](#-system-architecture)
- [Module Breakdown](#-module-breakdown)
  - [Backend](#backend-python--flask)
  - [Frontend](#frontend-react--vite)
- [How It Works — Flow](#-how-it-works--flow)
- [Emotion Detection Logic](#-emotion-detection-logic)
- [Attention Scoring System](#-attention-scoring-system)
- [Database / Logging](#-database--logging)
- [API Endpoints](#-api-endpoints)
- [Questions Bank](#-questions-bank)
- [Configuration](#-configuration)
- [Installation & Setup](#-installation--setup)
- [Screenshots / UI Screens](#-screenshots--ui-screens)
- [Limitations & Future Scope](#-limitations--future-scope)

---

## 📖 Project Overview

**Student Attention Monitor** is a full-stack web application that conducts a 10-question mock test (Mixed: General Knowledge + Computer Science) while simultaneously monitoring the student's facial emotions via webcam. At the end of the test, a detailed session report is generated — showing the student's test score, emotion distribution, attention score, question-wise review, and dominant emotion — all saved to a CSV log file for history tracking.

The application runs entirely locally. The Flask backend handles emotion analysis and test logic, while the React frontend manages the UI, webcam feed, and question flow.

---

## ✨ Key Features

- 🎥 **Real-time webcam emotion detection** using DeepFace + MTCNN
- 📊 **Attention scoring** based on detected emotions (attentive vs. distracted)
- 📝 **10-question MCQ mock test** (Mixed: GK + CS)
- 🧾 **Detailed session report** with score, attention %, emotion breakdown, question-wise review
- 📋 **Session history** — all past sessions logged to CSV and viewable in-browser
- 💾 **CSV auto-save** after every test submission
- ⚡ **One-command launch** via `start.py` or `BabeStart.bat` (Windows)
- 🌐 **Fully local** — no cloud, no external API calls for core functionality

---

## 🛠 Tech Stack

| Layer       | Technology                                      |
|-------------|------------------------------------------------|
| Frontend    | React 18, Vite 5, Axios                        |
| Backend     | Python, Flask 3, Flask-CORS                    |
| AI / ML     | DeepFace, MTCNN, OpenCV, NumPy, TF-Keras       |
| Styling     | Plain CSS (CSS Variables, no UI library)        |
| Data Store  | CSV file (`session_logs.csv`)                  |
| Launcher    | Python (`start.py`) / Windows Batch (`BabeStart.bat`) |

---

## 📁 Project Structure

```
student-attention-monitor/
│
├── backend/
│   ├── app.py                # Flask API server + React static server
│   ├── emotion_detector.py   # DeepFace frame analysis module
│   ├── session_manager.py    # CSV save + read logic
│   ├── questions.py          # MCQ question bank (10 questions)
│   └── config.py             # Constants (ports, emotions, file paths)
│
├── frontend/
│   ├── index.html            # Root HTML
│   ├── vite.config.js        # Vite config with API proxy
│   ├── package.json          # npm dependencies
│   └── src/
│       ├── main.jsx          # React entry point
│       ├── App.jsx           # Screen router (welcome → test → result)
│       ├── App.css           # Global CSS variables + shared styles
│       ├── api.js            # Axios API helper functions
│       └── components/
│           ├── WelcomeScreen.jsx   # Name entry + permission request
│           ├── MockTest.jsx        # Test UI + webcam + emotion polling
│           └── ResultScreen.jsx    # Report + session history modal
│
├── session_logs.csv          # Auto-created; stores all session records
├── requirements.txt          # Python dependencies
├── start.py                  # Cross-platform one-command launcher
└── BabeStart.bat             # Windows launcher (opens both servers)
```

---

## 🏗 System Architecture

```
Browser (React Frontend — port 5173 in dev / served by Flask in prod)
        │
        │  HTTP (Axios)
        ▼
Flask Backend (port 5000)
   ├── /api/questions        → returns MCQ list (answer hidden)
   ├── /api/analyze-frame    → accepts base64 frame, returns emotion
   ├── /api/submit-test      → scores test, saves CSV, returns report
   └── /api/logs             → returns all session_logs.csv rows as JSON
        │
        ├── emotion_detector.py  → DeepFace + MTCNN
        ├── session_manager.py   → CSV read/write
        ├── questions.py         → MCQ bank
        └── config.py            → settings
```

In **development**, Vite proxies `/api/*` requests to `localhost:5000`.  
In **production** (after `npm run build`), Flask serves the React build directly and handles all routes.

---

## 📦 Module Breakdown

### Backend (Python + Flask)

#### `app.py`
- Main Flask application
- Serves the React production build as static files (`/frontend/dist`)
- Registers all API routes
- Auto-opens the browser 1.5s after server starts (production mode)
- Uses `flask-cors` to allow cross-origin requests during development

#### `emotion_detector.py`
- Accepts a base64-encoded JPEG frame from the frontend
- Decodes and resizes the frame to **640×480** for better facial detail
- Applies **CLAHE** (Contrast Limited Adaptive Histogram Equalization) preprocessing to enhance subtle expressions
- Runs **DeepFace** emotion analysis with a **fallback chain**: tries `mtcnn` first (more accurate), falls back to `opencv` if mtcnn is unavailable
- Returns: `emotion` (dominant), `face_detected` (bool), `scores` (all 7 emotion probabilities), `error`

#### `session_manager.py`
- `save_report(data)` — takes the full test + emotion result dict and appends a row to `session_logs.csv`
- Computes: `total_frames`, `attentive_frames`, `distracted_frames`, `attention_pct`, `dominant_emotion`
- **Bug fix included**: If `total_frames = 0`, `dominant_emotion` is set to `"N/A"` (previously `max()` on an all-zero dict returned `"angry"` alphabetically)
- `read_logs()` — reads the CSV and returns all rows as a list of dicts

#### `questions.py`
- Stores the question bank as a Python list of dicts
- Each question has: `id`, `subject` (GK/CS), `question`, `options` (list of 4), `answer`
- The API strips `answer` before sending to frontend

#### `config.py`
- `FLASK_PORT = 5000`, `FLASK_HOST = "0.0.0.0"`
- `ATTENTIVE_EMOTIONS = {'happy', 'neutral', 'surprise'}`
- `INATTENTIVE_EMOTIONS = {'angry', 'disgust', 'fear', 'sad'}`
- `EMOTIONS_LIST = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']`
- `LOG_FILE` — path to `session_logs.csv` (placed at project root, one level above `backend/`)
- `FRONTEND_ORIGINS` — allowed CORS origins (localhost ports 5173–5177)

---

### Frontend (React + Vite)

#### `App.jsx`
- Top-level screen router
- State: `screen` (`'welcome'` | `'test'` | `'result'`), `studentName`, `testResult`
- Flow: WelcomeScreen → MockTest → ResultScreen → (retry) → WelcomeScreen

#### `WelcomeScreen.jsx`
- Collects student name via text input
- Requests browser camera + microphone permissions using `navigator.mediaDevices.getUserMedia`
- Shows test info: 10 questions, 10-minute duration, GK+CS subject
- Validates name before allowing start; shows error if permissions denied

#### `MockTest.jsx`
- Core test + monitoring component
- Displays one question at a time with 4 radio-button options
- Tracks: selected answers, time elapsed, emotion frame counts
- Polls the backend every ~2 seconds by capturing a webcam frame (via `<canvas>` + `toDataURL`) and sending it to `/api/analyze-frame`
- Accumulates `emotion_counts` dict throughout the session
- On submission: POSTs to `/api/submit-test` with `student_name`, `answers`, `time_taken`, `emotion_counts`
- Shows live emotion badge and recording indicator during test

#### `ResultScreen.jsx`
- Displays the complete session report after test submission
- Sections:
  - **6 stat cards**: Test Score, Correct, Wrong, Unattempted, Attention %, Time Taken
  - **Verdict card**: Overall verdict (Excellent/Good/Fair/Needs Work) + Attention label
  - **Emotion distribution**: Bar chart for all 7 emotions with frame counts and percentages
  - **Question-wise review**: Every question with user's answer, correct answer, pass/fail indicator
- **Session History Modal**: fetches `/api/logs` and renders all past sessions in a sortable table
- Color-coded verdicts: ≥85% = Excellent (green), ≥70% = Good (green), ≥50% = Fair (yellow), <50% = Needs Work (red)

#### `api.js`
- Thin Axios wrapper: `fetchQuestions()`, `analyzeFrame(frameBase64)`, `submitTest(payload)`
- All calls use relative path `/api` (works with both Vite proxy and Flask static serving)

#### `App.css`
- CSS custom properties (variables): `--bg`, `--panel`, `--accent`, `--green`, `--red`, `--yellow`, `--white`, `--subtext`, `--radius`
- Shared utility classes: `.card`, `.btn`, `.btn-green`, `.btn-red`, `.btn-accent`, `.emotion-badge`, `.fade-in`, `.pulse`
- Dark theme throughout (`#1a1a2e` background)

---

## 🔄 How It Works — Flow

```
1. Student opens app → WelcomeScreen
2. Enters name → clicks "Start Mock Test"
3. Browser requests camera + microphone permissions
4. MockTest screen loads:
   a. Fetches 10 questions from /api/questions
   b. Starts 10-minute countdown timer
   c. Every ~2 seconds: captures webcam frame → sends to /api/analyze-frame → gets emotion
   d. Emotion counts accumulate in a dict: { happy: 12, neutral: 30, angry: 2, ... }
   e. Student answers questions and clicks Submit (or timer expires)
5. POST /api/submit-test with: { student_name, answers, time_taken, emotion_counts }
6. Backend:
   a. Scores the answers (correct/wrong/unattempted)
   b. Saves full report to session_logs.csv
   c. Returns scored result with details
7. ResultScreen displays the full report
8. Student can click "View All Sessions" to see historical data
```

---

## 🧠 Emotion Detection Logic

DeepFace recognizes **7 emotions**: `angry`, `disgust`, `fear`, `happy`, `sad`, `surprise`, `neutral`

**Preprocessing pipeline:**
1. Base64 decode → NumPy array → OpenCV decode
2. Resize to 640×480
3. CLAHE contrast enhancement (helps detect subtle emotions like fear/disgust/surprise)
4. BGR → RGB conversion
5. DeepFace analyze with `actions=['emotion']`

**Backend selection (fallback chain):**
- Primary: `mtcnn` — better at detecting faces at angles and distances
- Fallback: `opencv` — used if mtcnn is not installed or fails

**Response schema:**
```json
{
  "emotion": "neutral",
  "face_detected": true,
  "scores": {
    "angry": 0.5, "disgust": 0.1, "fear": 1.2,
    "happy": 5.3, "sad": 0.8, "surprise": 2.1, "neutral": 90.0
  },
  "error": null
}
```

---

## 📈 Attention Scoring System

| Category     | Emotions                            |
|--------------|-------------------------------------|
| Attentive    | `happy`, `neutral`, `surprise`      |
| Distracted   | `angry`, `disgust`, `fear`, `sad`   |

**Formula:**
```
Attention Score (%) = (Attentive Frames / Total Frames) × 100
```

**Attention Labels:**
| Score   | Label                      |
|---------|----------------------------|
| ≥ 75%   | Highly Attentive ✅        |
| 50–74%  | Moderate Attention ⚠️      |
| < 50%   | Frequently Distracted 🚨   |

If no frames were captured (camera not detected), attention is shown as `N/A`.

---

## 🗃 Database / Logging

All sessions are saved to `session_logs.csv` at the project root.

**CSV Columns:**

| Column               | Description                                      |
|----------------------|--------------------------------------------------|
| Date                 | YYYY-MM-DD                                       |
| Time                 | HH:MM:SS                                         |
| Student Name         | Name entered at welcome screen                   |
| Subject              | Always "Mixed (GK + CS)"                         |
| Total Questions      | Always 10                                        |
| Attempted            | Questions answered                               |
| Correct              | Correct answers                                  |
| Wrong                | Incorrect answers                                |
| Unattempted          | Skipped questions                                |
| Test Score (%)       | (Correct / Total) × 100                          |
| Time Taken (s)       | Seconds from start to submit                     |
| Total Frames         | Total emotion frames captured                    |
| Attentive Frames     | Frames with happy/neutral/surprise               |
| Distracted Frames    | Frames with angry/disgust/fear/sad               |
| Attention Score (%)  | Attentive Frames / Total Frames × 100            |
| Dominant Emotion     | Emotion with highest frame count ("N/A" if none) |
| Frames_Angry         | Frame count for each individual emotion          |
| Frames_Disgust       | ↑                                                |
| Frames_Fear          | ↑                                                |
| Frames_Happy         | ↑                                                |
| Frames_Sad           | ↑                                                |
| Frames_Surprise      | ↑                                                |
| Frames_Neutral       | ↑                                                |

---

## 🌐 API Endpoints

| Method | Endpoint             | Description                                             |
|--------|----------------------|---------------------------------------------------------|
| GET    | `/api/questions`     | Returns 10 MCQs (answer field stripped)                |
| POST   | `/api/analyze-frame` | Body: `{ frame: "<base64 JPEG>" }` → emotion result    |
| POST   | `/api/submit-test`   | Body: `{ student_name, answers, time_taken, emotion_counts }` → full scored report |
| GET    | `/api/logs`          | Returns all CSV rows as JSON array (newest-first)       |

---

## ❓ Questions Bank

10 questions, alternating between GK and CS:

| # | Subject | Topic                              |
|---|---------|-------------------------------------|
| 1 | CS      | CPU full form                       |
| 2 | GK      | Red Planet                          |
| 3 | CS      | LIFO data structure (Stack)         |
| 4 | GK      | Telephone inventor                  |
| 5 | CS      | RAM full form                       |
| 6 | GK      | Capital of Japan                    |
| 7 | CS      | Python: `2 ** 10` output            |
| 8 | GK      | Bones in human body                 |
| 9 | CS      | Which is NOT a programming language (HTML) |
| 10| GK      | Painter of Mona Lisa                |

---

## ⚙️ Configuration

All configurable constants are in `backend/config.py`:

```python
FLASK_PORT    = 5000
FLASK_HOST    = "0.0.0.0"

ATTENTIVE_EMOTIONS   = {'happy', 'neutral', 'surprise'}
INATTENTIVE_EMOTIONS = {'angry', 'disgust', 'fear', 'sad'}
EMOTIONS_LIST        = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']

LOG_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "session_logs.csv")
```

---

## 🚀 Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- Webcam access

### 1. Clone the repository
```bash
git clone https://github.com/your-username/student-attention-monitor.git
cd student-attention-monitor
```

### 2. Install Python dependencies
```bash
cd backend
pip install -r requirements.txt
```

**`requirements.txt` contents:**
```
flask>=3.0.0
flask-cors>=4.0.0
deepface>=0.0.93
opencv-python>=4.10.0.84
numpy>=2.1.0
tf-keras>=2.18.0
mtcnn>=0.1.1
```

### 3. Install Node dependencies
```bash
cd frontend
npm install
```

### 4. Run the app

#### Option A — Python launcher (cross-platform)
```bash
python start.py
```
Starts React dev server → waits 4s → starts Flask → opens browser automatically.

#### Option B — Windows batch file
```
Double-click BabeStart.bat
```
Opens two terminal windows (Flask + React) and launches the browser.

#### Option C — Manual (Development)
```bash
# Terminal 1 — Frontend
cd frontend
npm run dev

# Terminal 2 — Backend
cd backend
python app.py
```
Frontend: `http://localhost:5173` | Backend: `http://localhost:5000`

#### Option D — Production build (Flask serves everything)
```bash
cd frontend
npm run build

cd ../backend
python app.py
# Opens http://127.0.0.1:5000
```

---

## 🖥 Screenshots / UI Screens

### Screen 1 — Welcome Screen
- Student name input
- Test info (10 questions, 10 minutes, GK+CS)
- Camera + microphone permission request
- Start button

### Screen 2 — Mock Test
- Question display with 4 radio-button options
- Live webcam feed
- Real-time emotion badge (e.g., "😊 happy")
- Countdown timer
- Question navigation / Submit button

### Screen 3 — Result Screen
- 6 stat cards: Score, Correct, Wrong, Unattempted, Attention %, Time Taken
- Overall verdict (color-coded)
- Emotion distribution bar chart (7 emotions)
- Question-wise review (every question with user answer, correct answer, pass/fail)
- "View All Sessions" button → modal with full CSV history table

---

## 🚀 Future Applications & Vision

> **This project was built as a proof-of-concept and trial showcase.** The current implementation demonstrates the core idea using a simple MCQ assessment — but the underlying system is designed to scale across multiple real-world domains.

---

### 🎯 What This System Is Actually Built For

The attention monitoring engine at the core of this project is **not limited to mock tests**. It is a general-purpose **real-time human attention and emotion tracking layer** that can be plugged into any video-based or interactive digital experience.

---

### 📡 Planned Application Areas

#### 1. 🏫 Online Education — Live Class Attention Monitoring
- Integrate with video lecture platforms (Zoom, Google Meet, custom LMS)
- Monitor student attention and emotional engagement **throughout a live or recorded lecture**
- Generate per-student and class-wide attention heatmaps
- Alert teachers in real-time if a significant portion of the class becomes disengaged
- Identify which parts of a lecture caused the most distraction or confusion

#### 2. 📝 Online Assessments & Proctoring
- The current demo showcases this use case
- Future versions will include: tab-switch detection, multiple-face detection, gaze tracking, and AI-based suspicious behavior flagging
- Attention score to be used alongside test score for a more holistic student performance profile

#### 3. 📺 OTT Platforms — Content Engagement Analytics
- Integrate attention monitoring into streaming platforms (similar to Netflix, YouTube)
- Detect viewer emotion and engagement in real-time while content plays
- Use aggregated attention data to understand **which scenes, genres, or moments** cause drop-off, excitement, boredom, or surprise
- Help content creators and studios make data-driven decisions on storytelling, pacing, and editing
- Enable personalized content recommendations based on a user's emotional response history

#### 4. 🏢 Corporate Training & E-Learning
- Monitor employee attention during mandatory training modules
- Track which training content is engaging vs. ineffective
- Generate completion + engagement reports for HR teams

#### 5. 🎮 Gaming & Interactive Media
- Adapt game difficulty or pacing based on player emotion (frustration → easier; boredom → more challenge)
- Real-time emotion feedback for game developers during playtesting sessions

---

### 🔬 Technical Improvements Planned

| Area | Current State | Planned Improvement |
|------|--------------|---------------------|
| Emotion Model | DeepFace (general purpose) | Fine-tuned model trained specifically on student/viewer attention data |
| Detection Speed | ~2s polling interval | Real-time continuous stream processing |
| Accuracy | MTCNN + CLAHE preprocessing | Custom attention classifier on top of emotion scores |
| Gaze Tracking | Not implemented | Eye tracking to detect screen focus vs. distraction |
| Multi-face Support | Single face only | Classroom-scale multi-student tracking |
| Storage | CSV file | Database backend (PostgreSQL/MongoDB) with dashboards |
| AI Integration | Rule-based attention scoring | ML model trained on labeled attention sessions |
| Deployment | Local only | Cloud-deployable with WebRTC support |

---

### 💡 Core Vision

> Build an **emotion-aware layer for digital experiences** — that understands not just *what* a user is doing, but *how they feel while doing it* — and uses that signal to improve content, education, and engagement at scale.

The mock test in this repository is just the beginning. The architecture — webcam → frame capture → emotion analysis → session reporting — is intentionally modular and can be adapted to any of the above use cases with minimal changes to the core engine.

---

### Current Limitations
- Questions are hardcoded in `questions.py` (no database, no admin panel)
- CSV is the only storage — no proper database
- Single subject set (GK + CS, 10 fixed questions)
- No user authentication or login system
- Emotion polling every ~2s may miss rapid expression changes
- Camera must be active throughout the test for attention tracking to work

### Possible Future Enhancements
- Admin panel to add/edit questions dynamically
- Replace CSV with SQLite or PostgreSQL
- Add multiple subject sets and difficulty levels
- Implement user login with session history per account
- Export session report as PDF
- Add a proctoring mode (detect tab switching, multiple faces, etc.)
- Mobile responsive design improvements
- Smarter attention model trained specifically for student behavior

---

## 👨‍💻 Developer Notes

- The project uses **CSS custom properties** exclusively for theming — all colors are defined once in `:root` in `App.css`
- DeepFace downloads model weights on first run (~300MB) — initial startup will be slow
- The CLAHE preprocessing step was added specifically to improve detection of `fear`, `disgust`, and `surprise` which are harder to detect without contrast enhancement
- The `dominant_emotion = "N/A"` fix prevents a misleading "angry" reading when no frames were captured (Python's `max()` on an all-zero dict sorts alphabetically)
- Vite's `proxy` config in `vite.config.js` routes `/api/*` to Flask during development so no CORS issues arise

---

*Built with ❤️ — Student Attention Monitor*
