========================================
OpenCV DNN Face Detection Models
========================================

This directory should contain the following files for face recognition:

1. deploy.prototxt
   - Caffe model architecture definition
   - Size: ~29 KB
   
2. res10_300x300_ssd_iter_140000.caffemodel
   - Pre-trained face detection weights
   - Size: ~10 MB

Download Links:
---------------
Option 1: OpenCV GitHub Repository
- https://github.com/opencv/opencv/tree/master/samples/dnn/face_detector
- Right-click on each file and select "Save link as..."
- Save both files in this directory (server/models/)

Option 2: Direct Download Links
- deploy.prototxt: https://raw.githubusercontent.com/opencv/opencv/master/samples/dnn/face_detector/deploy.prototxt
- res10_300x300_ssd_iter_140000.caffemodel: https://raw.githubusercontent.com/opencv/opencv_3rdparty/dnn_samples_face_detector_20170830/res10_300x300_ssd_iter_140000.caffemodel

Option 3: Using PowerShell (Run from server/models/ directory)
--------------------------------------------------------------
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/opencv/opencv/master/samples/dnn/face_detector/deploy.prototxt" -OutFile "deploy.prototxt"

Invoke-WebRequest -Uri "https://raw.githubusercontent.com/opencv/opencv_3rdparty/dnn_samples_face_detector_20170830/res10_300x300_ssd_iter_140000.caffemodel" -OutFile "res10_300x300_ssd_iter_140000.caffemodel"

Note: The .caffemodel file is ~10MB and may take a minute to download.

Verification:
-------------
After downloading, verify that both files exist:
- server/models/deploy.prototxt
- server/models/res10_300x300_ssd_iter_140000.caffemodel

The system will warn you at startup if these files are missing.
