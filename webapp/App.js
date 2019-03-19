canvas = document.getElementById('musicCanvas')
context = canvas.getContext("2d")
VERSE_ROWS = 37
VERSE_COLS = 16
CELL_PADDING = 2
CELL_WIDTH = 32
CELL_HEIGHT = 10
SONG_LEN = 1
PROG_BAR_HEIGHT = 8
SONG_ORDER_CELL_HEIGHT = 32
SONG_ORDER_CELL_WIDTH = 32

var playing = false

scales = {
	"major" : [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1],
	"none" : [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
	"minor" : [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0]	
}

function freq(n) {
	return Math.pow(2, (n-69)/12) * 440;
}

function song() {
	return song = {
		data : {
			bpm : 120,
			rootNote: 64,
			verses : [],
			order : [],
			synth : 1,
		},
		
		addVerse(verse) {
			this.data.verses.push(verse)
			this.data.order.push(this.data.verses.indexOf(verse))
		},
		
		delVerse(verse) {
			if(this.data.verses.indexOf(verse) == 0)
				return false
			else {
				var ind = this.data.verses.indexOf(verse)
				if(ind == -1) return false
				for(var i = 0; i < this.data.order.length; i++) {
					if(this.data.order[i] > ind)
						this.data.order[i] -= 1
					else if(this.data.order[i] == ind) 
						this.data.order[i] = 0
				}
				this.data.verses.splice(ind, 1)
				return true
			}
		},
		
		chords() {
			chordArray = []

			for(var i = 0; i < this.data.order.length; i++) {
				verse = this.data.verses[this.data.order[i]]
				
				for(var t=0; t < VERSE_COLS; t++) {

					var notes = []
					for(var n=0; n <= VERSE_ROWS; n++) {
						if(verse.notes[n * VERSE_COLS + t]) {
							notes.push(freq(n + this.data.rootNote - 12 - 1))
						}
					}
					
					if(notes.length > 0) {
						chordArray.push([(t + i * VERSE_COLS)/2, notes])
					}
				}
			}
			return chordArray
		}
	}
}

function newVerse() {
	return verse = {
		notes : Array.from(Array(VERSE_ROWS * VERSE_COLS), () => false),
		clear() {
			this.notes = Array.from(Array(VERSE_ROWS * VERSE_COLS), () => false)
		}
	}
}
function cloneVerse(old_verse) {
	var clone_verse = newVerse()
	clone_verse.notes = old_verse.notes.slice(0)
	return clone_verse
}

function musicGrid() {
	return musicGrid = {	
		
		width : VERSE_COLS * CELL_WIDTH + CELL_PADDING,
		height : VERSE_ROWS * CELL_HEIGHT + CELL_PADDING,
		scale : scales["major"],
		
		draw() {
			// Black background
			context.fillStyle = '#000';
			context.fillRect(0, 0, this.width, this.height);
			
			// Draw notes
			for(var x = 0; x < VERSE_COLS; x++) {
				for(var y = 0; y < VERSE_ROWS; y++) {
					if(currentVerse && currentVerse.notes[y * VERSE_COLS + x]) {
						// Active note
						context.fillStyle = '#F79';
					}
					else if(this.scale[(y - 0) % 12] == 0) {
						//Nothing
						continue
					}
					else if(y % 12 == 0) {
						// Root note
						context.fillStyle = '#756'
					}
					else if(Math.round((x + 2) / 4) % 2 == 0) {
						// Inactive note
						context.fillStyle = '#CCC';
					}
					else {
						// Inactive note
						context.fillStyle = '#999';
					}
					context.fillRect(
						x * CELL_WIDTH + CELL_PADDING,
						(VERSE_ROWS - y - 1) * CELL_HEIGHT + CELL_PADDING,
						CELL_WIDTH - 2 * CELL_PADDING,
						CELL_HEIGHT - 2 * CELL_PADDING
					)
				}
			}
			
			// VERSE ORDER
			context.fillStyle = '#000';
			context.fillRect(0, musicGrid.height + PROG_BAR_HEIGHT, canvas.width, SONG_ORDER_CELL_HEIGHT);
			
			context.font = "12px Arial"
			for(var i = 0; i < song.data.order.length; i++) {
				context.fillStyle = '#999'
				context.fillRect(
					i * SONG_ORDER_CELL_WIDTH + CELL_PADDING,
					musicGrid.height + PROG_BAR_HEIGHT + CELL_PADDING,
					SONG_ORDER_CELL_WIDTH - 2 * CELL_PADDING,
					SONG_ORDER_CELL_HEIGHT - 2 * CELL_PADDING
				)
				context.fillStyle = '#FFF'
				context.fillText(
					"S" + song.data.order[i],
					i * SONG_ORDER_CELL_WIDTH + (SONG_ORDER_CELL_WIDTH - 20) / 2,
					musicGrid.height + PROG_BAR_HEIGHT + (SONG_ORDER_CELL_HEIGHT + 2) / 2
				)
			}
		},
		
		setVerse(verse) {
			this.currentVerse = verse
		}
	}
}

// CANVAS LISTENER
/////////////////////////////////////////////////////////////////////////////////////////////////////////
canvas.onmousedown = function(e){
	if(playing) return
	
	var mouseX = e.pageX - this.offsetLeft
	var mouseY = e.pageY - this.offsetTop
	
	if(mouseY < musicGrid.height) {
		var x = Math.floor((e.pageX - this.offsetLeft) / CELL_WIDTH)
		// Y is inverted
		var y = VERSE_ROWS - Math.floor((e.pageY - this.offsetTop) / CELL_HEIGHT) - 1
		
		// Check in bounds
		if(!(y >= VERSE_ROWS || y < 0 || x >= VERSE_COLS || x < 0) && currentVerse && musicGrid) {
			currentVerse.notes[y * VERSE_COLS + x] = !currentVerse.notes[y * VERSE_COLS + x]
			musicGrid.draw()
		}
	} else if(mouseY < canvas.height && mouseY > canvas.height - SONG_ORDER_CELL_HEIGHT) {
		var orderInd = Math.floor((mouseX) / SONG_ORDER_CELL_WIDTH)
		if(orderInd >= 0 && orderInd < song.data.order.length) {
			song.data.order[orderInd] = song.data.order[orderInd] + 1 >= song.data.verses.length ? 0 : song.data.order[orderInd] + 1
			musicGrid.draw()
		}
	}
}

// MUSIC
/////////////////////////////////////////////////////////////////////////////////////////////////////////
var chordPart = null
function musicHandler() {
	return musicHandler = {
		_instrument : null,
		
		instrument(choice) {
			if(this._instrument)
				this._instrument.dispose
			switch(choice) {
				case 1:
					this._instrument = new Tone.PolySynth(4, Tone.Synth, {
						"volume" : -8,
						oscillator  : {
							type  : "sine"
						}  ,
						envelope  : {
							attack  : 0.005 ,
							decay  : 0.1 ,
							sustain  : 0.3 ,
							release  : 1
						}
					}).toMaster()
					break
				case 2:
					this._instrument = new Tone.PolySynth(4, Tone.Synth, {
						"volume" : -8,
						oscillator  : {
							type  : "triangle"
						}  ,
						envelope  : {
							attack  : 0.005 ,
							decay  : 0.1 ,
							sustain  : 0.3 ,
							release  : 1
						}
					}).toMaster()
					break
					break
				case 3:
					this._instrument = new Tone.PolySynth(4, Tone.Synth, {
						"volume" : -8,
						oscillator  : {
							type  : "square"
						}  ,
						envelope  : {
							attack  : 0.005 ,
							decay  : 0.1 ,
							sustain  : 0.3 ,
							release  : 1
						}
					}).toMaster()
					break
				case 4:
				default:
					this._instrument = new Tone.PolySynth(4, Tone.FMSynth, {
						"volume" : -8,
						"modulationIndex" : 12.22,
						"envelope" : {
						"attack" : 0.01,
						"decay" : 0.2
						},
						"modulation" : {
						"type" : "square"
						},
						"modulationEnvelope" : {
						"attack" : 0.2,
						"decay" : 0.01
						}
					}).toMaster()
					break
			}
			return this._instrument
		},
		
		play(song) {		
			instrument = this.instrument(song.data.synth)
			
			Tone.Transport.bpm.value = 120
		
			chordPart = new Tone.Part(function(time, chord){
				instrument.triggerAttackRelease(chord, '4n', time);
			}, song.chords() );
			
			chordPart.loop = true;
			chordPart.loopEnd = '' + (4 * song.data.order.length) + 'm'
			chordPart.start(0)
			
			Tone.Transport.bpm.value = song.data.bpm
			Tone.Transport.start("+0.1")
		},
		
		stop() {
			Tone.Transport.stop(0)
			Tone.Transport.clear(chordPart)
			if(chordPart) {
				chordPart.dispose()
				chordPart = null	
			}
		}
	}
}

// BUTTONS
document.getElementById('stop').disabled = true
function play() {
	if(song && musicHandler) {
		if(playing)
			stop()
		
		playing = true;
		musicHandler.play(song)
		
		document.getElementById('play').disabled = true
		document.getElementById('stop').disabled = false
		document.getElementById('selectRoot').disabled = true
		document.getElementById('addVerse').disabled = true
		document.getElementById('clearVerse').disabled = true
		document.getElementById('delVerse').disabled = true	
		document.getElementById('delSequence').disabled = true	
		document.getElementById('addSequence').disabled = true	
		
		progressBar()
	}
}
function stop() {
	if(musicHandler) {
		playing = false
		musicHandler.stop()
		
		document.getElementById('play').disabled = false
		document.getElementById('stop').disabled = true
		document.getElementById('selectRoot').disabled = false
		document.getElementById('addVerse').disabled = false
		document.getElementById('clearVerse').disabled = false
		document.getElementById('delVerse').disabled = false	
		document.getElementById('delSequence').disabled = false	
		document.getElementById('addSequence').disabled = false	
		
		// Hide progress bar
		context.fillStyle = '#000';
		context.fillRect(0, musicGrid.height, canvas.width, PROG_BAR_HEIGHT);
		context.fillRect(0, canvas.height - PROG_BAR_HEIGHT, canvas.width, PROG_BAR_HEIGHT);
	}
}
function enable() {
	document.getElementById('bpm')
}

document.getElementById('bpm').addEventListener('input', e => {
  if(song)
	song.data.bpm = e.target.value
  Tone.Transport.bpm.value = e.target.value
  document.getElementById("bpmText").textContent=e.target.value;
})

function clearVerse() {
	if(currentVerse && musicGrid && !playing) {
		currentVerse.clear()
		musicGrid.draw()
	}
}
verseDropdown = document.getElementById("selectVerse");
function delVerse() {
	if(currentVerse && song && !playing) {
		ind = song.data.verses.indexOf(currentVerse)
		if(song.delVerse(currentVerse)) {			
			verseDropdown.remove(verseDropdown.options.length-1)
			setVerse(0)
		}
		musicGrid.draw()
	}
}
function addVerse() {
	if(song && !playing) {
		var new_verse = newVerse()
		//if(currentVerse)
		//	new_verse = cloneVerse(currentVerse)
		//else
		//	new_verse = newVerse()
		song.addVerse(new_verse)
		currentVerse = new_verse
		
		var opt = document.createElement("OPTION")
		opt.text = song.data.verses.indexOf(currentVerse)
		opt.value = song.data.verses.indexOf(currentVerse)
		verseDropdown.add(opt)
		
		verseDropdown.selectedIndex = song.data.verses.indexOf(currentVerse)
	
		musicGrid.draw()
	}
}
function selectVerse() {
	if(musicGrid) {
		verseChoice = verseDropdown.options[verseDropdown.selectedIndex].value;
		currentVerse = song.data.verses[verseChoice]
		musicGrid.draw()	
	}
}
function setVerse(i) {
	currentVerse = song.data.verses[i]
	verseDropdown.selectedIndex = i
	musicGrid.draw()
}
function changeRoot() {
	dropdown = document.getElementById("selectRoot");
	if(song)
		song.data.rootNote = parseInt(dropdown.options[dropdown.selectedIndex].value);
}
function changeScale() {
	dropdown = document.getElementById("selectScale");
	if(musicGrid) {
		musicGrid.scale = scales[dropdown.options[dropdown.selectedIndex].value];
		musicGrid.draw()
	}
}
function changeSynth() {
	dropdown = document.getElementById("selectSynth");
	if(song) {
		song.data.synth = parseInt(dropdown.options[dropdown.selectedIndex].value);
	}
}
function addSequence() {
	song.data.order.push(0)
	musicGrid.draw()
}
function delSequence() {
	if(song.data.order.length != 1)
		song.data.order.splice(song.data.order.length - 1, 1)
	musicGrid.draw()
}
function exportWav() {
	$.ajax({
		type: 'POST',
		url: 'http://localhost:1337/exportWav',
		data: JSON.stringify({
			cols : VERSE_COLS,
			rows : VERSE_ROWS,
			songData : song.data
		}),
		contentType: "application/json; charset=utf-8",
		success: function(data) {
			var a = document.createElement("a")
			
			array = new Uint8Array(data.length)
			for(var i = 0; i < data.length; i++) {
				array[i] = data.charCodeAt(i)
			}
			
			var file = new Blob([array], {type: "application/octet-stream"})
			a.href = URL.createObjectURL(file)
			a.download = 'song.mid'
			a.click()
		},
		error: function(error) {
			alert('There was an error! Error:' + error.name + ':' + error.status)
		}
	})
}
function save() {
	var jsonData = JSON.stringify(song.data)
	var a = document.createElement("a")
	var file = new Blob([jsonData], {type: 'text/plain'})
	a.href = URL.createObjectURL(file)
	a.download = 'song.json'
	a.click()
}
function readSingleFile(evt) {
	if(window.File && window.FileReader && window.FileList && window.Blob) {
		var file = evt.target.files[0]
		var reader = new FileReader()
		if(file && reader) {
			reader.readAsText(file)
			reader.onload = function() {
				song.data = JSON.parse(reader.result)				
				currentVerse = song.data.verses[0]
				
				verseDropdown.selectedIndex = 0
				while(song.data.verses.length > verseDropdown.options.length) {
					var opt = document.createElement("OPTION")
					opt.text = verseDropdown.options.length
					opt.value = verseDropdown.options.length
					verseDropdown.add(opt)
				}
				while(song.data.verses.length < verseDropdown.options.length) {
					verseDropdown.remove(verseDropdown.options.length-1)
				}	
				
				musicGrid.draw()
			}
		}
		else {
			alert('Could not load that file')
		}
	}
	else {
		alert('The File APIs are not fully supported in this broswer!')
	}
}
document.getElementById('file').addEventListener('change', readSingleFile, false)


// PROGRESS BAR
function progressBar() {
	if(chordPart && playing) {
		progress = chordPart.progress
		
		var playingVerseIndex = Math.floor(progress * song.data.order.length)
		if(currentVerse != song.data.verses[song.data.order[playingVerseIndex]])
			setVerse(song.data.order[playingVerseIndex])
		
		var playingVerseProgress = (progress * song.data.order.length) % 1
	
		context.fillStyle = '#000';
		context.fillRect(0, musicGrid.height, canvas.width, PROG_BAR_HEIGHT);
		context.fillRect(0, canvas.height - PROG_BAR_HEIGHT, canvas.width, PROG_BAR_HEIGHT);
		
		// Draw play line
		context.fillStyle = '#F49';
		context.fillRect(
			CELL_PADDING, 
			musicGrid.height + CELL_PADDING, 
			playingVerseProgress * (canvas.width - 2 * CELL_PADDING), 
			PROG_BAR_HEIGHT - 2 * CELL_PADDING
		)
		context.fillRect(
			CELL_PADDING, 
			canvas.height - PROG_BAR_HEIGHT + CELL_PADDING, 
			progress * (song.data.order.length * SONG_ORDER_CELL_WIDTH - 2 * CELL_PADDING), 
			PROG_BAR_HEIGHT - 2 * CELL_PADDING
		)
		
		setTimeout(progressBar, 100);
	}
}

// RUN
/////////////////////////////////////////////////////////////////////////////////////////////////////////
var musicGrid = musicGrid()
canvas.width = musicGrid.width
canvas.height = musicGrid.height + PROG_BAR_HEIGHT + SONG_ORDER_CELL_HEIGHT + PROG_BAR_HEIGHT

context.fillStyle = '#000';
context.fillRect(0, 0, canvas.width, canvas.height);

var song = song()
var currentVerse = null;
addVerse()

musicGrid.draw()

var musicHandler = musicHandler()
