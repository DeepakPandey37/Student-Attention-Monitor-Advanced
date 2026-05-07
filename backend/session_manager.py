import csv
import os
from datetime import datetime

from config import LOG_FILE, EMOTIONS_LIST, ATTENTIVE_EMOTIONS


def save_report(data: dict) -> tuple[bool, str]:
   
    emotion_counts   = data.get('emotion_counts', {})
    total_frames     = sum(emotion_counts.values())
    attentive_frames = sum(emotion_counts.get(e, 0) for e in ATTENTIVE_EMOTIONS)
    distracted_frames = total_frames - attentive_frames
    attention_pct    = (
        round((attentive_frames / total_frames) * 100)
        if total_frames > 0 else 0
    )

   
    if total_frames > 0 and emotion_counts:
        dominant_emotion = max(emotion_counts, key=emotion_counts.get)
    else:
        dominant_emotion = "N/A"

    row = {
        "Date":                datetime.now().strftime("%Y-%m-%d"),
        "Time":                datetime.now().strftime("%H:%M:%S"),
        "Student Name":        data.get('student_name', 'Unknown'),
        "Subject":             "Mixed (GK + CS)",
        "Total Questions":     data.get('total_questions', 10),
        "Attempted":           data.get('attempted', 0),
        "Correct":             data.get('correct', 0),
        "Wrong":               data.get('wrong', 0),
        "Unattempted":         data.get('total_questions', 10) - data.get('attempted', 0),
        "Test Score (%)":      data.get('score_pct', 0),
        "Time Taken (s)":      data.get('time_taken', 0),
        "Total Frames":        total_frames,
        "Attentive Frames":    attentive_frames,
        "Distracted Frames":   distracted_frames,
        "Attention Score (%)": attention_pct,
        "Dominant Emotion":    dominant_emotion,
    }

   
    for e in EMOTIONS_LIST:
        row[f"Frames_{e.capitalize()}"] = emotion_counts.get(e, 0)

    try:
        file_exists = os.path.exists(LOG_FILE)
        with open(LOG_FILE, "a", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=row.keys())
            if not file_exists:
                writer.writeheader()
            writer.writerow(row)
        return True, os.path.abspath(LOG_FILE)
    except Exception as exc:
        return False, str(exc)


def read_logs() -> list[dict]:
   
    if not os.path.exists(LOG_FILE):
        return []
    try:
        with open(LOG_FILE, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            return list(reader)
    except Exception:
        return []