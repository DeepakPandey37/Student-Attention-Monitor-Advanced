FLASK_PORT    = 5000
FLASK_HOST    = "0.0.0.0"


FRONTEND_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:5177",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5176",
]


ATTENTIVE_EMOTIONS   = {'happy', 'neutral', 'surprise'}
INATTENTIVE_EMOTIONS = {'angry', 'disgust', 'fear', 'sad'}
EMOTIONS_LIST        = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']


import os
LOG_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "session_logs.csv")