# RedEyeGuard Web-Phishing Detection Extension 

Project Overview

RedEye Guard is a Chrome-based phishing detection extension designed to identify, analyze, and classify potentially malicious websites in real time using a hybrid detection engine combining rule-based analysis and adaptive machine learning techniques.

The system evaluates URLs through structured feature extraction, statistical scoring, and threat pattern recognition to determine the likelihood of phishing or malicious activity. It is designed to operate fully within the browser environment, ensuring fast and lightweight execution without dependency on external cloud services.

The extension supports an advanced learning mode where detection accuracy can be improved using external model training. In this mode, a Python-based training pipeline can be executed in Windows or Linux environments to process datasets, refine model weights, and enhance classification performance over time.

This architecture enables the system to evolve from a static detection engine into an adaptive, continuously improving security model.

Key Features
Real-time phishing and malicious URL detection
Hybrid detection engine (rule-based + adaptive AI model)
URL feature extraction and entropy analysis
Brand impersonation and threat pattern recognition
Lightweight browser-native execution (no backend required)
Chrome toolbar integration for instant access
Whitelist and blacklist domain management
Optional external Python-based model training pipeline
Cross-platform support (Windows and Linux environments)
Installation Guide
1. Download the Project

Clone the repository using Git:

git clone https://github.com/YOUR_USERNAME/RedEyeGuardAIPro.git

Alternatively, download the project as a ZIP file and extract it to a local directory.

2. Open Chrome Extensions Manager

Launch Google Chrome and navigate to:

chrome://extensions/
3. Enable Developer Mode

Activate Developer Mode using the toggle switch located in the top-right corner of the page.

This is required to load unpacked extensions manually.

4. Load the Extension

Click on Load unpacked and select the extracted project folder:

RedEyeGuardAIPro/

Ensure the folder contains the manifest.json file.

5. Activation

Once loaded successfully, the extension icon will appear in the Chrome toolbar.

The system will automatically begin analyzing visited websites in real time.

Users can click the extension icon to view detection results and risk scores.

Advanced Training Mode

RedEye Guard AI Pro supports external model training for improved detection accuracy.

In advanced mode:

Python scripts are used to process phishing datasets
Model weights are updated based on labeled training data
Detection accuracy improves through iterative learning
Trained outputs can be reintegrated into the extension
Supported Environments
Windows (Python 3.8+)
Linux (Ubuntu/Debian-based distributions recommended)
System Architecture

The extension uses a layered detection approach:

URL Feature Extraction Layer
Heuristic Rule Engine
Adaptive Machine Learning Model
Threat Pattern Matching System
Final Risk Scoring Engine

The final output is a normalized risk score between 0 and 1, representing the probability of malicious activity.

Notes

This project is intended for cybersecurity research, educational purposes, and experimental AI development. It demonstrates how browser-based extensions can integrate lightweight machine learning models for real-time threat detection.
