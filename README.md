# MAIS202-Final-Project
Creating a simple webpage-based melody editor with helpful AI suggestions.

### Resources used:

The Midicsv and Csvmidi exe files are from http://www.fourmilab.ch/webtools/midicsv/. Copyright info (public domain) found at the bottom of the page.

MIDI dataset was downloaded from http://www.piano-midi.de/. Copyright info found [here](http://www.piano-midi.de/copy.htm).

JS sounds generated using Tone.js which can be found at https://tonejs.github.io/ avaiable under the [MIT Lisence](https://github.com/Tonejs/Tone.js/blob/dev/LICENSE.md).

### Python scripts:

preprocess.py : This script will take all files in data/midi and try to create csv files in data/preprocessed which contain a preprocessed array of their notes.

notes_to_csv.py : This script will take a single csv file of notes and create a midi file from it. Takes in two arguments: path/to/notefile.csv and path/to/outputmidi.mid.

generate_song.py : This script will generate a snippet of a new song (saved as song.csv). Takes in one argument: path/to/model/checkpoint.hdf5

LSTM.py : This script is for training the AI. A checkpoint can be loaded before starting training.
