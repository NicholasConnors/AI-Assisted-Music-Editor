import numpy as np
import os
import sys

from keras.models import Sequential
from keras.layers import Dense
from keras.layers import Dropout
from keras.layers import LSTM
from keras.callbacks import ModelCheckpoint
from keras.utils import np_utils
from keras.models import load_model


pattern_length = 100
lowest = 30
n_notes = 99

	
def generate_song(model):
	pattern=np.random.rand(pattern_length)
	song = []
	#Generate
	for i in range(200):
		x = np.reshape(pattern, (1, len(pattern), 1))
		prediction = model.predict(x, verbose=0).flatten()
		index=np.argmax(prediction)
		pattern = np.append(pattern, (index/float(n_notes)))
		pattern = pattern[1:len(pattern)]
		song = np.append(song, (index))
	np.savetxt("song.csv", (song + lowest), fmt='%s', delimiter=",")
	print("Song saved to song.csv")
	
	
def load(filename):
	model = load_model(filename)
	model.compile(loss='categorical_crossentropy', optimizer='adam')
	return model
	
	
def main(filename):
	model = load(filename)
	generate_song(model)
	
	
if __name__ == "__main__":
	main(sys.argv[1])