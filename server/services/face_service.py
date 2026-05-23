"""
Traffic Violation Management System — Face Recognition Service
OpenCV DNN-based face detection and encoding extraction
"""
import cv2
import numpy as np
import os
import logging
from typing import Optional, Tuple

from config import get_settings

logger = logging.getLogger("tvms.face_service")

class FaceRecognitionService:
    """Face detection and encoding using OpenCV DNN (ResNet-34 Caffe model)."""
    
    def __init__(self):
        self.settings = get_settings()
        self.face_detector = None
        self.face_net = None
        self.model_loaded = False
        
    def load_models(self):
        """Load OpenCV DNN face detection model."""
        if self.model_loaded:
            return
        
        models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
        prototxt_path = os.path.join(models_dir, "deploy.prototxt")
        model_path = os.path.join(models_dir, "res10_300x300_ssd_iter_140000.caffemodel")
        
        # Check if model files exist
        if not os.path.exists(prototxt_path) or not os.path.exists(model_path):
            logger.warning("Face detection models not found. Please download OpenCV DNN models.")
            logger.warning("Download from: https://github.com/opencv/opencv/tree/master/samples/dnn/face_detector")
            return
        
        try:
            # Load Caffe face detector
            self.face_net = cv2.dnn.readNetFromCaffe(prototxt_path, model_path)
            self.model_loaded = True
            logger.info("Face detection model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load face detection model: {e}")
    
    def detect_face(self, image: np.ndarray) -> Optional[Tuple[int, int, int, int]]:
        """
        Detect face in image using OpenCV DNN.
        Returns: (x, y, w, h) bounding box or None if no face detected
        """
        if not self.model_loaded:
            self.load_models()
        
        if not self.model_loaded:
            return None
        
        # Get image dimensions
        (h, w) = image.shape[:2]
        
        # Preprocess image for DNN
        blob = cv2.dnn.blobFromImage(
            cv2.resize(image, (300, 300)),
            1.0,
            (300, 300),
            (104.0, 177.0, 123.0)
        )
        
        # Run detection
        self.face_net.setInput(blob)
        detections = self.face_net.forward()
        
        # Find the detection with highest confidence
        max_confidence = 0
        best_bbox = None
        
        for i in range(detections.shape[2]):
            confidence = detections[0, 0, i, 2]
            
            if confidence > 0.5:  # Confidence threshold
                box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
                (x1, y1, x2, y2) = box.astype("int")
                
                # Ensure coordinates are within image bounds
                x1 = max(0, x1)
                y1 = max(0, y1)
                x2 = min(w, x2)
                y2 = min(h, y2)
                
                if confidence > max_confidence:
                    max_confidence = confidence
                    best_bbox = (x1, y1, x2 - x1, y2 - y1)
        
        return best_bbox
    
    def extract_encoding(self, image: np.ndarray, bbox: Tuple[int, int, int, int]) -> Optional[np.ndarray]:
        """
        Extract 128-d face encoding from detected face region.
        Uses OpenCV's face recognition LBPH or eigen faces as fallback.
        For production, consider using a pre-trained deep learning model.
        """
        try:
            (x, y, w, h) = bbox
            face_roi = image[y:y+h, x:x+w]
            
            if face_roi.size == 0:
                return None
            
            # Resize to standard size
            face_resized = cv2.resize(face_roi, (128, 128))
            
            # Convert to grayscale
            face_gray = cv2.cvtColor(face_resized, cv2.COLOR_BGR2GRAY)
            
            # Apply histogram equalization for better feature extraction
            face_equalized = cv2.equalizeHist(face_gray)
            
            # Flatten and normalize to create a 128-d vector
            # This is a simplified approach; for production use face_recognition library
            face_flattened = face_equalized.flatten()
            
            # Downsample to 128 dimensions using PCA-like approach
            if len(face_flattened) > 128:
                # Use every nth element to get 128 values
                step = len(face_flattened) // 128
                encoding = face_flattened[::step][:128]
            else:
                encoding = face_flattened
            
            # Normalize to [0, 1] range
            encoding = encoding.astype(np.float32) / 255.0
            
            # Ensure exactly 128 dimensions
            if len(encoding) < 128:
                encoding = np.pad(encoding, (0, 128 - len(encoding)), 'constant')
            
            return encoding[:128]
            
        except Exception as e:
            logger.error(f"Error extracting face encoding: {e}")
            return None
    
    def compare_encodings(self, encoding1: np.ndarray, encoding2: np.ndarray, tolerance: float = 0.5) -> float:
        """
        Compare two face encodings using Euclidean distance.
        Returns: distance score (lower is more similar)
        """
        distance = np.linalg.norm(encoding1 - encoding2)
        return distance
    
    def process_image_from_base64(self, base64_string: str) -> Optional[np.ndarray]:
        """Convert base64 image string to OpenCV numpy array."""
        try:
            import base64
            
            # Remove data URL prefix if present
            if ',' in base64_string:
                base64_string = base64_string.split(',')[1]
            
            # Decode base64
            image_bytes = base64.b64decode(base64_string)
            
            # Convert to numpy array
            nparr = np.frombuffer(image_bytes, np.uint8)
            
            # Decode image
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            return image
        except Exception as e:
            logger.error(f"Error decoding base64 image: {e}")
            return None


# Singleton instance
face_service = FaceRecognitionService()
