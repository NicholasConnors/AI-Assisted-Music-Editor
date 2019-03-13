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

def random_seed():
	#Generate random "seed"
	pattern=np.random.rand(pattern_length)
	for i in range(0, len(pattern)):
		if(np.random.rand() < 0.5):
			pattern[i] = (128 - lowest) / n_notes
	
	print(pattern)

def seed():
	# Load a songs
	songs = os.listdir("data/preprocessed")
	filename = songs[np.random.randint(0, len(songs) - 1)]
	song = np.genfromtxt(("data/preprocessed/%s" % filename), dtype=int, delimiter=',')	
		
	# Split data up into "patterns"
	pattern_length = 100
	data_X = []
	for i in range(0, len(song) - pattern_length, 1):
		data_X.append(song[i:i+pattern_length])
	n_patterns = len(data_X)

	# Reshape X
	X = np.reshape(data_X, (n_patterns, pattern_length, 1))

	# Normalize
	X = (X - lowest) / n_notes
	
	return X[np.random.randint(0, len(data_X) - 1)]
	
	
def generate_song(model):
	pattern = seed()
	
	song = []
	#Generate
	for i in range(100):
		x = np.reshape(pattern, (1, len(pattern), 1))
		prediction = model.predict(x, verbose=0).flatten()
		index=np.argmax(prediction)
		pattern = np.append(pattern, (index/float(n_notes)))
		pattern = pattern[1:len(pattern)]
		song = np.append(song, (index))
	np.savetxt("song.csv", (song + lowest), fmt='%s', delimiter=",")
	print(pattern)
	print("Song saved to song.csv")
	
	
def load(filename):
	model = load_model(filename)
	model.compile(loss='categorical_crossentropy', optimizer='adam')
	return model
	
	
def main(filename):
	model = load(filename)
	generate_song(model)
	
	ans = ''
	while(ans != "n"):
		ans = input("Repeat? (Will overwrite song.csv) [Y/N]: ").lower()
		while(ans != "y" and ans != "n"):
			ans = input("Invalid input. Repeat? (Will overwrite song.csv) [Y/N]: ").lower()
		if(ans == "y"):
			generate_song(model)
	
	
if __name__ == "__main__":
	main(sys.argv[1])