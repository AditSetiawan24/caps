from typing import Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from sentiment_inference import predict_sentiment
import pandas as pd
import pickle
import os

# Load recommendation artifacts
RECOMMENDATION_DIR = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(RECOMMENDATION_DIR, "cosine_similarity.pkl"), "rb") as f:
    cosine_sim = pickle.load(f)

with open(os.path.join(RECOMMENDATION_DIR, "movie_indices.pkl"), "rb") as f:
    indices = pickle.load(f)

unique_movies_df = pd.read_csv(os.path.join(RECOMMENDATION_DIR, "unique_movies_content_based.csv"))

app = FastAPI(
    title="Movie Sentiment AI Service",
    description="AI service untuk prediksi sentimen review film",
    version="1.0.0"
)


class SentimentRequest(BaseModel):
    user_id: Optional[int] = None
    movie_id: Optional[int] = None
    review_text: str

class RecommendRequest(BaseModel):
    title: str
    top_n: Optional[int] = 5


@app.get("/")
def root():
    return {
        "message": "Movie Sentiment AI Service is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok"
    }


@app.post("/predict-sentiment")
def predict_sentiment_api(request: SentimentRequest):
    if request.review_text is None or request.review_text.strip() == "":
        raise HTTPException(
            status_code=400,
            detail="review_text tidak boleh kosong"
        )

    result = predict_sentiment(request.review_text)

    return {
        "user_id": request.user_id,
        "movie_id": request.movie_id,
        "review_text": result["original_text"],
        "cleaned_text": result["cleaned_text"],
        "review_type": result["review_type"],
        "char_length": result["char_length"],
        "sentiment": result["sentiment"],
        "confidence": result["confidence"],
        "word_count": result["word_count"],
        "is_reliable": result["is_reliable"],
        "source": result["source"],
        "note": result["note"]
    }

@app.post("/recommend")
def recommend_movies(request: RecommendRequest):
    title = request.title
    top_n = request.top_n

    if title not in indices:
        # Fallback if movie not found: return top popular/highest rated movies
        top_movies = unique_movies_df.sort_values("final_score", ascending=False).head(top_n)
        return {"recommendations": top_movies["movie_id"].tolist()}

    idx = indices[title]
    if isinstance(idx, pd.Series):
        idx = idx.iloc[0]

    target_genre = unique_movies_df.iloc[idx]["genre_utama"]

    sim_scores = list(enumerate(cosine_sim[idx]))
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
    
    # Filter agar hanya film dengan genre_utama yang persis sama yang muncul
    filtered_indices = []
    for i, score in sim_scores:
        if i == idx:
            continue # Lewati film itu sendiri
        if unique_movies_df.iloc[i]["genre_utama"] == target_genre:
            filtered_indices.append(i)
        if len(filtered_indices) == top_n:
            break
            
    recommended = unique_movies_df.iloc[filtered_indices]
    
    return {"recommendations": recommended["movie_id"].tolist()}