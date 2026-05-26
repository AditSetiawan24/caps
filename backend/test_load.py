import tensorflow as tf
import keras

original_layer_init = keras.layers.Layer.__init__

def patched_layer_init(self, *args, **kwargs):
    kwargs.pop('quantization_config', None)
    original_layer_init(self, *args, **kwargs)

keras.layers.Layer.__init__ = patched_layer_init

try:
    model = tf.keras.models.load_model('models/short_sentiment_model_movie_sentiment_short_long_v1.keras')
    print("SUCCESS")
except Exception as e:
    import traceback
    traceback.print_exc()
