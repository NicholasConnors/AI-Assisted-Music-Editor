
# coding: utf-8

# In[1]:


import pandas as pd
import numpy as np
import subprocess as sbp
import os


# In[5]:


def midi_to_notes(midi_filename):
    '''
    string filename: relative path to midi file.
    
    Saves a intermediate csv and csv of notes used as training data
    '''
    # Make sure midi file exists
    if not os.path.isfile(midi_filename):
        print(midi_filename, " does not exist. Stopping.")
        return
    
    # Get filename with no path or extension
    base_filename = os.path.splitext(os.path.basename(midi_filename))[0]
    csv_filename = ("csv/%s.csv" % base_filename)
    notes_filename = ("preprocessed/%s.csv" % base_filename)
    
    # Check if file has been preprocessed
    if os.path.isfile(notes_filename):
        print(base_filename, " already preprocessed. Stopping.")
        return
    
    # Make a folder for csv if it doesn't already exist
    if not os.path.exists('csv'):
        print("Making directory for intermediate csv files")
        os.makedirs('csv')
        
    # If midi not already converted to csv, convert
    try:
        sbp.check_call(['midi_csv_converter/midicsv', (midi_filename), (csv_filename)])
    except:
        print(("An error occured when converting %s to csv. Stopping." %base_filename))
        return    
    
    #Read csv file    
    df = pd.read_csv(csv_filename, error_bad_lines=False, sep='delimiter', header=None, engine='python')
    start = (df[0].str.contains("Note_on_c")).idxmax()
    stop = df[0].where(df[0].str.contains("Note_on_c")).last_valid_index() + 1

    #Remove stuff unrelated to notes
    df.drop(df.index[stop:], inplace=True)
    df.drop(df.index[:start], inplace=True)

    #Dataframe is current a series of strings, split them up by ','
    df = pd.DataFrame([l.split(',') for l in df[0].tolist()], columns=["Track", "Time", "Type", "Channel", "Note", "Velocity"])

    # Only keep notes being played
    df.drop(df[~df['Type'].str.contains('Note_on_c')].index , inplace=True)
    df.drop("Type", axis=1, inplace=True)

    # Only keep track 2
    df.drop(df[df['Track'].astype(int)!=2].index , inplace=True)
    df.drop("Track", axis=1, inplace=True)

    # Only keep channel 0
    df.drop(df[df['Channel'].astype(int)!=0].index , inplace=True)
    df.drop("Channel", axis=1, inplace=True)

    #Forget about velocity
    #df.drop("Time",axis=1, inplace=True)
    df.drop("Velocity",axis=1, inplace=True)

    #Time and note as int
    df['Note'] = df['Note'].astype(int)
    df['Time'] = df['Time'].astype(int)

    #Subtract starting time
    df['Time'] = (df['Time'] - df['Time'][0]) // 120

    # Get notes as int array
    notes = [int(x) for x in np.asarray(df['Note'])]
    # Add a "space" when the time step increments. Using 128 since midi range is 0 to 127
    separator = 128

    current_time = 0
    ind = 0
    for t in df['Time']:
        while t >= current_time:
            notes = np.insert(notes, ind, [separator])
            current_time += 1
            ind += 1
        ind += 1
        
    # Make a directory for preprocessed files if it doesn't already exist
    if not os.path.exists('preprocessed'):
        print("Making directory for preprocessed csv files")
        os.makedirs('preprocessed')
        
    # Dump notes into csv
    np.savetxt(notes_filename, notes, fmt='%s', delimiter=",")
    print(midi_filename, " preprocessed.")


# In[7]:


# Preprocess all files in midi dir
for f in os.listdir("midi"):
    midi_to_notes("midi/%s" % f)

