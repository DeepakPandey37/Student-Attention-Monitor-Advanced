import os
import webbrowser
import threading

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

from config           import FLASK_PORT, FLASK_HOST
from emotion_detector import analyze_frame
from session_manager  import save_report, read_logs
from questions        import QUESTIONS

# ── Path to React build folder ───────────────
BASE_DIR   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD_DIR  = os.path.join(BASE_DIR, 'frontend', 'dist')

app = Flask(__name__, static_folder=BUILD_DIR, static_url_path='')
CORS(app)



@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    """Serve React build files; fallback to index.html for client routing."""
    full_path = os.path.join(BUILD_DIR, path)
    if path != '' and os.path.exists(full_path):
        return send_from_directory(BUILD_DIR, path)
    return send_from_directory(BUILD_DIR, 'index.html')



@app.route('/api/questions', methods=['GET'])
def get_questions():
    public = [
        {k: v for k, v in q.items() if k != 'answer'}
        for q in QUESTIONS
    ]
    return jsonify(public)


@app.route('/api/analyze-frame', methods=['POST'])
def analyze():
    body = request.get_json(silent=True)
    if not body or 'frame' not in body:
        return jsonify({"error": "No frame provided"}), 400
    result = analyze_frame(body['frame'])
    return jsonify(result)


@app.route('/api/submit-test', methods=['POST'])
def submit_test():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "No data provided"}), 400

    answers   = data.get('answers', {})
    correct   = 0
    wrong     = 0
    attempted = 0
    details   = []

    for q in QUESTIONS:
        qid      = str(q['id'])
        user_ans = answers.get(qid)
        is_correct = (user_ans == q['answer']) if user_ans else None
        if user_ans:
            attempted += 1
            if is_correct:
                correct += 1
            else:
                wrong += 1
        details.append({
            "id":             q['id'],
            "question":       q['question'],
            "user_answer":    user_ans,
            "correct_answer": q['answer'],
            "is_correct":     is_correct
        })

    total     = len(QUESTIONS)
    score_pct = round((correct / total) * 100)

    report_data = {
        **data,
        'total_questions': total,
        'attempted':       attempted,
        'correct':         correct,
        'wrong':           wrong,
        'score_pct':       score_pct,
    }
    success, csv_path = save_report(report_data)

    return jsonify({
        "correct":     correct,
        "wrong":       wrong,
        "attempted":   attempted,
        "unattempted": total - attempted,
        "total":       total,
        "score_pct":   score_pct,
        "csv_saved":   success,
        "csv_path":    csv_path,
        "details":     details,
    })


@app.route('/api/logs', methods=['GET'])
def get_logs():
    """
    Return all rows from session_logs.csv as JSON.
    Rows are ordered newest-first.
    """
    rows = read_logs()
    return jsonify(list(reversed(rows)))



def _open_browser():
    webbrowser.open(f'http://127.0.0.1:{FLASK_PORT}')

if __name__ == '__main__':
    if not os.path.exists(BUILD_DIR):
        print("\n❌  ERROR: React build not found!")
        print("   Run this first:")
        print("   cd frontend && npm run build")
        exit(1)

    print("\n" + "="*52)
    print("  Student Attention Monitor")
    print("="*52)
    print(f"  Opening: http://127.0.0.1:{FLASK_PORT}")
    print("="*52 + "\n")

    threading.Timer(1.5, _open_browser).start()
    app.run(host=FLASK_HOST, port=FLASK_PORT, debug=False)