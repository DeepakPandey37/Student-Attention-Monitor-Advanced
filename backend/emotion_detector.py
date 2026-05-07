import cv2
import numpy as np
import base64
from deepface import DeepFace


def _enhance(bgr: np.ndarray) -> np.ndarray:
    
    lab   = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l     = clahe.apply(l)
    lab   = cv2.merge([l, a, b])
    return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)


def analyze_frame(image_base64: str) -> dict:
    
    try:
        
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]

        img_bytes = base64.b64decode(image_base64)
        np_arr    = np.frombuffer(img_bytes, np.uint8)
        frame     = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame is None:
            return {"emotion": None, "face_detected": False,
                    "scores": None, "error": "Frame decode failed"}

       
        frame = cv2.resize(frame, (640, 480))

       
        frame = _enhance(frame)

        
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

       
        result = None
        for backend in ('mtcnn', 'opencv'):
            try:
                result = DeepFace.analyze(
                    rgb,
                    actions=['emotion'],
                    enforce_detection=True,
                    detector_backend=backend,
                    silent=True,
                )
                break   
            except ValueError:
                
                continue
            except Exception:
                
                continue

        if result is None:
            
            return {"emotion": None, "face_detected": False,
                    "scores": None, "error": None}

        emotion    = result[0]['dominant_emotion']
        raw_scores = result[0]['emotion']
        scores     = {k: float(v) for k, v in raw_scores.items()}

        return {
            "emotion":       emotion,
            "face_detected": True,
            "scores":        scores,
            "error":         None,
        }

    except Exception as exc:
        return {"emotion": None, "face_detected": False,
                "scores": None, "error": str(exc)}
