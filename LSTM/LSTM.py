import numpy as np
import os

from keras.models import Sequential
from keras.layers import Dense
from keras.layers import Dropout
from keras.layers import LSTM
from keras.callbacks import ModelCheckpoint
from keras.callbacks import CSVLogger
from keras.utils import np_utils
from keras import optimizers

# Load all songs
songs = []
for f in os.listdir("data/preprocessed"):
    songs.append(np.genfromtxt(("data/preprocessed/%s" % f), dtype=int, delimiter=','))	
	
# Split data up into "patterns"
pattern_length = 100
data_X = []
data_y = []
for f in songs:
    for i in range(0, len(f) - pattern_length, 1):
        data_X.append(f[i:i+pattern_length])
        data_y.append(f[i+pattern_length])
n_patterns = len(data_X)
print("Total Patterns: ", n_patterns)

# Remember highest and lowest used notes
lowest = 30
n_notes = 99

# Reshape X
X = np.reshape(data_X, (n_patterns, pattern_length, 1))

# Normalize
X = (X - lowest) / n_notes

# One hot encode
y = np_utils.to_categorical(np.array(data_y) - lowest)

# LSTM
model = Sequential()
model.add(LSTM(256, input_shape=((pattern_length, 1)), return_sequences=False))
model.add(Dropout(0.3))
#model.add(LSTM(128, return_sequences=False))
#model.add(Dropout(0.3))
model.add(Dense(n_notes, activation='softmax'))
model.compile(loss='categorical_crossentropy', optimizer=optimizers.Adam(lr=0.005), metrics=['accuracy'])

# Checkpoints
ans = input("Load model? [Y/N]: ").lower()
while(ans != "y" and ans != "n"):
    ans = input("Invalid input. Load model? [Y/N]: ").lower()
    
filename = "checkpoint"
if(ans == 'y'):
    filename = input("File name: ")
    model.load_weights(filename)
    filename = filename.split('.')[0]
else:
	filename = input("Enter name for this model: ")

csv_logger = CSVLogger(('%s-training.log' % filename))
checkpoint = ModelCheckpoint(("%s-{epoch:02d}.hdf5" % filename), monitor='loss', verbose=2, save_best_only=True, mode='min', period=1)

model.fit(X, y, epochs=10, batch_size=64, callbacks=[checkpoint, csv_logger])