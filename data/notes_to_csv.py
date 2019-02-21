import pandas as pd
import numpy as np
import subprocess as sbp
import os
import sys

def notes_to_midi(filename, output_filename):
    # Make sure notes file exists
    if not os.path.isfile(filename):
        print(filename, " does not exist. Stopping.")
        return
    
    notes = np.genfromtxt(filename, delimiter=',', dtype=int)
    
    midi = np.array([[0, 0, 'Header', 1, 10, 480], [1, 0, 'Start_track', 0, 0, 0], [1, 0, 'Tempo', 1000000, 0, 0], [1, 0, 'End_track', 0, 0, 0], [2, 0, 'Start_track', 0, 0, 0]])
    
    cols=["Track", "Time", "Type", "Channel", "Note", "Velocity"]
    df = pd.DataFrame(midi, columns=cols)
    
    time = 0
    for n in notes:
        if(n==128):
            time+= 1
        else:
            df2 = pd.DataFrame([[2, time * 120, 'Note_on_c', 0, n, 60]], columns=cols)
            df = df.append(df2)
    
    df_end = pd.DataFrame([[2, (time + 1) * 120, 'End_track', 0, 0, 0]], columns=cols)
    df = df.append(df_end)   
    for i in range(3, 11):
        df_end = pd.DataFrame([[i, 0, 'Start_track', 0, 0, 0], [i, 0, 'End_track', 0, 0, 0]], columns=cols)
        df = df.append(df_end)   
    df_end = pd.DataFrame([[0, 0, 'End_of_file', 0, 0, 0]], columns=cols)
    df = df.append(df_end)
    
    df.to_csv("temp.csv", header=False, index=False)
    
    # Convert temp csv to midi
    try:
        sbp.check_call(['midi_csv_converter/csvmidi', "temp.csv", (output_filename)])
    except:
        print(("An error occured when converting %s to csv. Stopping." %filename))
        return    
    
    # Delete temp csv
    os.remove("temp.csv")
    
    print("Converted ", filename, " to midi.")

if len(sys.argv) != 3:
    print("Wrong number of arguments, expected 2.")
else:
    notes_to_midi(sys.argv[1], sys.argv[2])

