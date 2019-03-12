canvas = document.getElementById('musicCanvas');
context = canvas.getContext("2d");
var p = -0.5;
var rw = 40;
var rh = 12;

var cols = 16; //beats
var rows = 37; //notes
var lineWidth=4;

var last_time = 0;

var song_menu_height = 0;
canvas.width = cols * rw;
canvas.height = (rows + song_menu_height) * rh;

var major_scale = [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1]
var no_scale = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
var minor_scale = [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0]

var hidden_notes = Array.from(Array(rows), (x, index) => major_scale[(index - 1) % 12]);

function new_verse() {
	var verse = new Object();
	verse.note_grid = Array.from(Array(rows * cols), () => false); 
	return verse;
}
var current_verse = new_verse();
var verses = [current_verse];

var prediction = [];

//Drawing grid
function drawBoard(){
	// Draw measures
	context.fillStyle = '#BBB';
	for(var x = 0; x < cols; x+= 8) {
		context.fillRect(x * rw, 0, 4 * rw, canvas.height);
	}
	context.fillStyle = '#000';
	
	// Cover up non-key notes
	context.fillStyle = '#000';
	for(var y = 0; y <= rows; y++) {
		if(hidden_notes[y] == 0) {
			context.fillRect(0, (rows - y) * rh, canvas.width, rh);
		}
	}
	
	// Draw root notes
	context.fillStyle = '#643';
	for(var y = 0; y <= rows; y+=12) {
		context.fillRect(0, (rows - y - 1) * rh, canvas.width, rh);
	}
	
	// Draw AI predictions
	context.fillStyle = '#0E9';
	for(var i=0; i<prediction.length;i++) {
		t = prediction[i][0];
		n = prediction[i][1];
		context.fillRect(t*rw, (rows - n)*rh, rw, rh);
	}
	
	// Draw notes
	context.fillStyle='#F38';
	for(var i=0; i < current_verse.note_grid.length; i++) {
		if(current_verse.note_grid[i]) {
			x = (i % cols) * rw;
			y = (rows - Math.floor(i / cols)) * rh;
			context.fillRect(x, y, rw, rh);
		}
	}
	
	// Draw grid
    for (var x = 0; x <= cols * rw; x += rw) {
        context.moveTo(0.5 + x + p, p);
        context.lineTo(0.5 + x + p, ((rows + song_menu_height) * rh) + p);
    }

    for (var x = 0; x <= (rows + song_menu_height) * rh; x += rh) {
        context.moveTo(p, 0.5 + x + p);
        context.lineTo((cols * rw) + p, 0.5 + x + p);
    }
	context.lineWidth=lineWidth;
    context.strokeStyle = "black";
    context.stroke();
	
	//context.fillStyle= '#FFF';
	//context.fillRect(lineWidth/2, rows*rh + lineWidth/2, canvas.width - lineWidth, rh*song_menu_height - lineWidth);
}

//Handle mouse
function click(x, y) {
	x = Math.floor(x/rw);
	y = Math.floor(y/rh);
	if(y >= rows || y < 0 || x >= cols || x < 0) return;
	
	y = rows - y; //invert
	if(x >= last_time) last_time = x + 1;
	
	current_verse.note_grid[y * cols + x] = !current_verse.note_grid[y * cols + x];
}

function redraw() {
	context.clearRect(0, 0, canvas.width, canvas.height);
	drawBoard();
	
}

function refresh() {
	console.log('clear');
	for(var i=0; i < current_verse.note_grid.length; i++) {
		if(current_verse.note_grid[i])
			current_verse.note_grid[i] = false;
	}
	last_time = 0;
	prediction=[];
	redraw();
}

canvas.onmousedown = function(e){
  var mouseX = e.pageX - this.offsetLeft;
  var mouseY = e.pageY - this.offsetTop;

  click(mouseX, mouseY);
  redraw();
};

suggest();
redraw();

//AI
function suggest() {
	// PLACEHOLDER
	t = last_time;
	num = Math.floor(Math.random() * rows)
	new_prediction = [num, num + 2, num + 5];
	
	prediction = [];
	for(var i=0; i < new_prediction.length; i++) {
		prediction.push([t, new_prediction[i]]);
	}
	redraw();
}

function use_suggestion() {
	for(var i=0; i<prediction.length;i++) {
		t = prediction[i][0];
		n = prediction[i][1];
		
		current_verse.note_grid[n * cols + t] = true;
	}
	last_time++;
	suggest();
}

//MUSIC
function freq(n) {
	return Math.pow(2, (n-69)/12) * 440;
}

var root_note = 60;
root_note_selection = document.getElementById("keySelect");
function root_note_change() {
	root_note = parseInt(root_note_selection.options[root_note_selection.selectedIndex].value);
	console.log(root_note);
}

scale_selection = document.getElementById("scaleSelect");
function scale_change() {
	scale_choice = scale_selection.options[scale_selection.selectedIndex].value;
	console.log(scale_choice);
	selection = no_scale;
	if(scale_choice == "major") selection = major_scale;
	if(scale_choice == "minor") selection = minor_scale;
	
	hidden_notes = Array.from(Array(rows), (x, index) => selection[(index - 1) % 12]);
	redraw();
}

//Time value then chord array
function makeChordArray() {
	var chordArray = [];
	for(var t=0; t < cols; t++) {
		
		var notes = [];
		for(var i=0; i < verses.length; i++) {
			for(var n=0; n <= rows; n++) {
				if(verses[i].note_grid[n * cols + t]) {
					notes.push(freq(n + root_note - 12 - 1))
				}
			}
		}
		
		if(notes.length > 0) {
			chordArray.push([t/4, notes]);
		}
	}
	console.log(chordArray);
	return chordArray;
}

var piano;
function play() {
	stop();
	piano = new Tone.PolySynth(4, Tone.Synth, {
		"volume" : -8,
		"oscillator" : {
			"partials" : [1, 2, 5],
		},
		"portamento" : 0.005
	}).toMaster()
	
    var myChords = makeChordArray();

	var chordPart = new Tone.Part(function(time, chord){
		piano.triggerAttackRelease(chord, '4n', time);
	}, myChords ).start(0);
	
	Tone.Transport.timeSignature = 4;
	Tone.Transport.bpm.value = 120;   
	Tone.Transport.start("+0.1");
}

function stop() {
	Tone.Transport.stop();
	Tone.Transport.cancel(0);
	if(piano) {
	   piano.dispose();
	   piano = null;
	}
}
