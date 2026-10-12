import os
import sys
import dotenv
from pymongo import MongoClient

dotenv.config({ path: 'backend/.env' }) if hasattr(dotenv, 'config') else None
# Load dotenv manually if needed
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                k, v = line.strip().split('=', 1)
                os.environ[k] = v

mongo_uri = os.environ.get('MONGODB_URI', 'mongodb://127.0.0.1:27017/personal_ott')
print(f"[Embedding Script] Connecting to MongoDB: {mongo_uri}")

try:
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer("all-MiniLM-L6-v2")
    print("[Embedding Script] Loaded SentenceTransformer MiniLM model!")
except Exception as e:
    print(f"[Embedding Script] SentenceTransformer fallback to HashingVectorizer: {e}")
    from sklearn.feature_extraction.text import HashingVectorizer
    import numpy as np
    model = None
    vectorizer = HashingVectorizer(n_features=384, alternate_sign=False)

client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
# Extract db name from URI or default
db_name = 'personal_ott'
if '/' in mongo_uri.split('?')[0]:
    parts = mongo_uri.split('?')[0].split('/')
    if parts[-1]:
        db_name = parts[-1]

db = client[db_name]
videos_collection = db['videos']

videos = list(videos_collection.find({}))
print(f"[Embedding Script] Found {len(videos)} video records in MongoDB.")

updated_count = 0
for v in videos:
    text_to_embed = f"{v.get('title', '')}. {v.get('description', '')}"
    if model is not None:
        embedding = model.encode(text_to_embed).tolist()
    else:
        vec = vectorizer.transform([text_to_embed]).toarray()[0]
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        embedding = vec.tolist()

    videos_collection.update_one({'_id': v['_id']}, {'$set': {'embedding': embedding}})
    updated_count += 1
    print(f" -> ✓ Embedded [{updated_count}/{len(videos)}]: {v.get('title')}")

print(f"\n[Success] Generated 384-dimensional MiniLM embeddings for all {updated_count} video documents!")
