# MAIS202-Final-Project
Using machine learning to compose music

The Midicsv and Csvmidi exe files are from http://www.fourmilab.ch/webtools/midicsv/ (public domain)

MIDI dataset was downloaded from http://www.piano-midi.de/

Python scripts:
preprocess.py will take all files in data/midi and try to create csv files in data/preprocessed containing an array of their notes
notes_to_csv.py will take a single csv file of notes and create a midi file from it. Takes in two arguments: path/to/notefile.csv and path/to/outputmidi.mid.