import os
import re
import json
import unicodedata

import numpy as np
import tensorflow as tf
import keras

# HOTFIX: Monkey patch untuk mengatasi "Unrecognized keyword arguments passed to Layer: {'quantization_config': None}" 
# yang sering terjadi akibat perbedaan versi Keras saat menyimpan dan meload model.
original_layer_init = keras.layers.Layer.__init__

def patched_layer_init(self, *args, **kwargs):
    kwargs.pop('quantization_config', None)
    original_layer_init(self, *args, **kwargs)

keras.layers.Layer.__init__ = patched_layer_init


# PATH MODEL

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

SHORT_MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "short_sentiment_model_movie_sentiment_short_long_v1.keras"
)

LONG_MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "long_sentiment_model_movie_sentiment_short_long_v1.keras"
)

LABEL_MAPPING_PATH = os.path.join(
    BASE_DIR,
    "models",
    "label_mapping.json"
)


# LOAD MODEL DAN LABEL MAPPING

short_model = tf.keras.models.load_model(SHORT_MODEL_PATH)
long_model = tf.keras.models.load_model(LONG_MODEL_PATH)

with open(LABEL_MAPPING_PATH, "r") as f:
    loaded_label_mapping = json.load(f)


# PREPROCESSING

def normalize_unicode(text):
    text = unicodedata.normalize("NFKC", str(text))
    return text


def normalize_repeated_chars(text):
    # seruuuuu -> seruu, jelekkkk -> jelekk
    return re.sub(r"(.)\1{2,}", r"\1\1", text)


def normalize_number_two(text):
    # sia2 -> sia sia, buang2 -> buang buang
    return re.sub(r"\b([a-zA-Z]+)2\b", r"\1 \1", text)


def normalize_emojis(text):
    positive_emojis = r"[😀😃😄😁😆😊😍🥰😘😎🤩👍🔥👏💯✨❤️💕🍿]"
    negative_emojis = r"[😡🤬😠😤👎💔😭😢😞😩😫😴🤮]"

    text = re.sub(positive_emojis, " EMO_POSITIVE ", text)
    text = re.sub(negative_emojis, " EMO_NEGATIVE ", text)

    return text


def clean_noise(text):
    text = re.sub(r"http\S+|www\S+", " ", text)
    text = re.sub(r"@\w+", " ", text)
    text = re.sub(r"#", " ", text)

    # Pertahankan huruf, spasi, dan token emoji hasil normalisasi
    text = re.sub(r"[^a-zA-Z_\s]", " ", text)

    text = re.sub(r"\s+", " ", text).strip()
    return text


def normalize_common_slang(text):
    slang_dict = {
        "bgt": "banget",
        "bgtt": "banget",
        "bgttt": "banget",
        "bangett": "banget",

        "gk": "ga",
        "gak": "ga",
        "nggak": "ga",
        "enggak": "ga",
        "tdk": "tidak",

        "yg": "yang",
        "dgn": "dengan",
        "dr": "dari",
        "krn": "karena",
        "karna": "karena",
        "tp": "tapi",
        "tpi": "tapi",

        "gw": "gue",
        "gua": "gue",
        "gue": "gue",
        "lu": "kamu",
        "lo": "kamu",

        "liat": "lihat",
        "nonton": "menonton",
        "ni": "ini",
        "nih": "ini",
        "sii": "sih",
        "dah": "sudah",

        "anjay": "bagus",
        "gokil": "bagus",
        "mantul": "bagus",
        "epic": "bagus",

        "worthit": "worth it",
        "recommended": "rekomendasi",
        "rekomen": "rekomendasi",

        "boring": "membosankan",
        "bad": "buruk",
        "worst": "buruk",
        "good": "bagus",
        "best": "bagus",
        "favorite": "favorit",
        "movie": "film"
    }

    words = text.split()
    words = [slang_dict.get(word, word) for word in words]

    return " ".join(words)


def normalize_sentiment_phrases(text):
    phrase_dict = {
        # Frasa positif yang mengandung kata negatif
        "ga sia sia": "worth it bagus",
        "tidak sia sia": "worth it bagus",
        "ga nyesel": "puas bagus",
        "tidak nyesel": "puas bagus",
        "ga mengecewakan": "bagus",
        "tidak mengecewakan": "bagus",
        "ga buruk": "bagus",
        "tidak buruk": "bagus",
        "ga jelek": "bagus",
        "tidak jelek": "bagus",

        # Frasa negatif
        "sia sia": "buruk mengecewakan",
        "buang buang waktu": "buruk membosankan",
        "buang waktu": "buruk membosankan",
        "ga worth it": "buruk mengecewakan",
        "tidak worth it": "buruk mengecewakan"
    }

    for phrase, replacement in phrase_dict.items():
        text = text.replace(phrase, replacement)

    return text


def apply_negation_handling(text):
    negation_words = {"ga", "tidak", "tak", "bukan"}
    stop_scope_words = {"tapi", "namun", "tetapi", "dan", "atau"}

    words = text.split()
    new_words = []

    i = 0

    while i < len(words):
        word = words[i]

        if word in negation_words:
            new_words.append(word)

            j = i + 1
            scope_count = 0

            while j < len(words) and scope_count < 2:
                if words[j] in stop_scope_words:
                    break

                new_words.append("NEG_" + words[j])
                j += 1
                scope_count += 1

            i = j
        else:
            new_words.append(word)
            i += 1

    return " ".join(new_words)


def clean_text(text):
    text = normalize_unicode(text)
    text = text.lower()

    text = normalize_emojis(text)
    text = normalize_repeated_chars(text)
    text = normalize_number_two(text)
    text = clean_noise(text)

    text = normalize_common_slang(text)

    # Frasa khusus harus sebelum negation handling
    text = normalize_sentiment_phrases(text)

    text = apply_negation_handling(text)

    text = re.sub(r"\s+", " ", text).strip()

    return text


# PREDIKSI SENTIMEN

def predict_sentiment(text):
    original_text = str(text)
    char_length = len(original_text)

    cleaned_text = clean_text(original_text)

    if cleaned_text.strip() == "":
        return {
            "original_text": original_text,
            "cleaned_text": cleaned_text,
            "review_type": "empty",
            "char_length": char_length,
            "sentiment": "netral",
            "confidence": 0.0,
            "word_count": 0,
            "is_reliable": False,
            "source": "empty_input_guardrail",
            "note": "Input kosong setelah preprocessing"
        }

    # Routing berdasarkan panjang karakter asli
    if char_length <= 50:
        selected_model = short_model
        review_type = "pendek"
        source_model = "short_review_sentiment_model"
    else:
        selected_model = long_model
        review_type = "panjang"
        source_model = "long_review_sentiment_model"

    input_text = tf.constant([cleaned_text], dtype=tf.string)

    pred = selected_model.predict(input_text, verbose=0)[0]

    class_id = int(np.argmax(pred))
    confidence = float(np.max(pred))
    sentiment = loaded_label_mapping[str(class_id)]

    words = cleaned_text.split()
    word_count = len(words)

    is_reliable = True
    note = "Prediksi cukup reliable"
    source = source_model

    if confidence < 0.60:
        is_reliable = False
        note = "Confidence rendah, prediksi kurang yakin"
        source = source_model + "_low_confidence_guardrail"

    return {
        "original_text": original_text,
        "cleaned_text": cleaned_text,
        "review_type": review_type,
        "char_length": char_length,
        "sentiment": sentiment,
        "confidence": round(confidence, 4),
        "word_count": word_count,
        "is_reliable": is_reliable,
        "source": source,
        "note": note
    }


def predict_sentiment_for_frontend(text):
    result = predict_sentiment(text)

    return {
        "review_text": result["original_text"],
        "sentiment": result["sentiment"],
        "review_type": result["review_type"]
    }


def predict_sentiment_for_backend(user_id, movie_id, review_text):
    result = predict_sentiment(review_text)

    return {
        "user_id": user_id,
        "movie_id": movie_id,
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