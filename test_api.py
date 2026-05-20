import requests
import json
url = "http://localhost:8000/api/predict-risk"
data = ["labour pain"]
try:
    response = requests.post(url, json=data)
    print("Status:", response.status_code)
    print("Response:", response.json())
except Exception as e:
    print("Error:", str(e))
