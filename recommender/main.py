from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
import pickle
import os
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI()

# Load SVD model defensively — service must not crash if this file is absent
svd_model = None
possible_paths = [
    os.path.join(os.path.dirname(__file__), "svd_model.pkl"),
    os.path.join(os.path.dirname(__file__), "svd_modelNew.pkl")
]
SVD_PATH = next((p for p in possible_paths if os.path.exists(p)), None)

if SVD_PATH:
    try:
        with open(SVD_PATH, "rb") as f:
            svd_model = pickle.load(f)
        print(f"Successfully loaded SVD model pickle from {os.path.basename(SVD_PATH)}")
    except Exception as e:
        print(f"Warning: failed to load SVD model pickle — {e}")
else:
    print("Warning: SVD model pickle not found — SVD signal disabled, content-based path still works")

# Load embedding model once at startup
embedder = SentenceTransformer("all-MiniLM-L6-v2")


class EmbedRequest(BaseModel):
    text: str

class EmbedResponse(BaseModel):
    embedding: List[float]

class CatalogVideo(BaseModel):
    videoId: str
    embedding: List[float]

class RecommendRequest(BaseModel):
    watchedVideoIds: List[str]
    catalogEmbeddings: List[CatalogVideo]
    topN: Optional[int] = 10

class RecommendResponse(BaseModel):
    recommendations: List[str]


@app.get("/health")
def health():
    return {"status": "ok", "svd_loaded": svd_model is not None}


@app.post("/embed", response_model=EmbedResponse)
def embed(req: EmbedRequest):
    if not req.text or not req.text.strip():
        return {"embedding": [0.0] * 384}
    vector = embedder.encode(req.text).tolist()
    return {"embedding": vector}


@app.post("/recommend", response_model=RecommendResponse)
def recommend(req: RecommendRequest):
    if not req.catalogEmbeddings:
        return {"recommendations": []}

    watched_set = set(req.watchedVideoIds)

    watched_vectors = [
        np.array(v.embedding) for v in req.catalogEmbeddings
        if v.videoId in watched_set and v.embedding
    ]

    if not watched_vectors:
        return {"recommendations": []}

    taste_vector = np.mean(watched_vectors, axis=0).reshape(1, -1)

    candidates = [v for v in req.catalogEmbeddings if v.videoId not in watched_set and v.embedding]
    if not candidates:
        return {"recommendations": []}

    candidate_matrix = np.array([v.embedding for v in candidates])
    similarities = cosine_similarity(taste_vector, candidate_matrix)[0]

    ranked = sorted(
        zip([v.videoId for v in candidates], similarities),
        key=lambda x: x[1],
        reverse=True
    )

    top_n = req.topN if req.topN else 10
    top_ids = [video_id for video_id, score in ranked[:top_n]]
    return {"recommendations": top_ids}
