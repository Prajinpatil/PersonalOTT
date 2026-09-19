import requests
import json

def test_service():
    print("[Testing Recommender Microservice]")
    
    # 1. Health
    h_res = requests.get("http://127.0.0.1:8000/health")
    print("Health Status:", h_res.status_code, h_res.json())

    # 2. Embed
    e_res = requests.post("http://127.0.0.1:8000/embed", json={"text": "futuristic sci-fi robot counter attack"})
    print("Embed Status:", e_res.status_code)
    vec = e_res.json()["embedding"]
    print("Embedding Vector Length:", len(vec), "First 3 elements:", vec[:3])

    # 3. Recommend
    dummy_catalog = [
        {"videoId": "video1", "embedding": vec},
        {"videoId": "video2", "embedding": [x * 0.9 for x in vec]},
        {"videoId": "video3", "embedding": [0.0] * 384}
    ]
    r_res = requests.post("http://127.0.0.1:8000/recommend", json={
        "watchedVideoIds": ["video1"],
        "catalogEmbeddings": dummy_catalog,
        "topN": 2
    })
    print("Recommend Status:", r_res.status_code, r_res.json())

if __name__ == "__main__":
    test_service()
