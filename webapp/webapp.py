import numpy as np
import flask
import tensorflow as tf
import webbrowser

from midiutil import MIDIFile
from keras.models import load_model
from io import BytesIO

app = flask.Flask(__name__)
model = None
graph = None

# These values are specific to the model being used.
pattern_length = 64
lowest = 32
n_notes = 97

def load_LSTM():
	global model
	model = load_model("tf_model/model.hdf5")
	model.compile(loss='categorical_crossentropy', optimizer='adam')

	global graph
	graph = tf.get_default_graph()
	
@app.route("/", methods = ['GET', 'POST'])
def show():
	return flask.render_template('index.html')

@app.route("/exportMIDI", methods=['POST'])
def exportMIDI():
	print("Received a midi export request")
	data = {"success": False, "binary": []}
	if flask.request.method == "POST":
		json_dict = flask.request.get_json(force=True)
		print(json_dict['notes'])
		
		notes = [int(i) for i in json_dict['notes']]
		bpm = int(json_dict['bpm'])
		
		track = 0
		channel = 0
		time = 0
		duration = 1
		volume = 64
		
		MyMIDI = MIDIFile(1)
		MyMIDI.addTempo(track, time, bpm)
		
		i = 0
		for note in notes:
			if(note != 128):
				MyMIDI.addNote(track, channel, note, time + i, duration, volume)
			else:
				i+=1
		
		#Dummy note to prevent cutoff
		MyMIDI.addNote(track, channel, 64, time + i + 2, duration, 0)
		
		output = BytesIO()
		MyMIDI.writeFile(output)		
		data["binary"] = [i for i in output.getvalue()]		
		output.close()
				
		return flask.jsonify(data)
	
@app.route("/predict", methods=['POST'])
def predict():
	print("Received a request")
	data = {"success": False, "prediction": []}
	if flask.request.method == "POST":
		global graph
		with graph.as_default():
			json_dict = flask.request.get_json(force=True)
			
			# Normalize
			X = (np.asarray(json_dict['data']) - lowest) / n_notes
			
			# Get last elements
			pattern = X[-pattern_length:]
			
			# Pad
			if(len(pattern) < pattern_length):
				pattern = np.pad(pattern, (pattern_length - len(pattern), 0), mode='constant', constant_values=128)
			
			i = 0
			timeout = 0
			song = []
			
			# Get first note
			index = np.argmax(pattern)
			# Random chance to use top 3
			if(np.random.randint(0, high=8) >= 7):
				top_3 = np.argsort(pattern)[-3:]
				index = top_3[np.random.randint(1, high=3)]
			
			while(i < 16 and timeout < 240):
				if(index + lowest == 128):
					i+=1
				timeout+=1
				
				pattern = np.append(pattern, (index/float(n_notes)))[-len(pattern):]
				song = np.append(song, (index + lowest))
		
				x = np.reshape(pattern, (1, len(pattern), 1))
				prediction = model.predict(x, verbose=0).flatten()
				
				index = np.argmax(prediction)
				# Random chance to use top 3
				if(np.random.randint(0, high=8) >= 7):
					top_3 = np.argsort(prediction)[-3:]
					index = top_3[np.random.randint(1, high=3)]
			
			data["prediction"] = song.tolist()
			data["success"] = True
	print(data["success"])
	return flask.jsonify(data)
	
if __name__ == "__main__":
	print("* Loading Keras model and starting Flask server...")
	load_LSTM()
	app.run(host='localhost', port='3000')
	webbrowser.open_new("localhost:3000")