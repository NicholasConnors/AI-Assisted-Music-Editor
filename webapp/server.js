var fs = require("fs")
var port = 1337;
var host = 'localhost'
var express = require("express")
var bodyParser = require("body-parser")

var app = express();
app.use(express.static(__dirname)) //use static files in ROOT/public folder
app.use(bodyParser.json())

app.get("/", function(request, response){ //root dir
    response.send("Hello!!")
});

app.post("/exportWav", function(req, res) {
	var fs = require('fs')
	var Midi = require('./jsmidgen')

	var file = new Midi.File()
	var track = new Midi.Track()
	file.addTrack(track)

	var order = req.body.songData.order
	var verses = req.body.songData.verses
	var cols = 16
	var rows = 37
	
	var previousTime = 0
	for(var i = 0; i < order.length; i++) {
		var verse = verses[order[i]]
		for(var t = 0; t < cols; t++) {
			for(var n = 0; n <= rows; n++) {
				if(verse.notes[n * cols + t]) {
					currentTime = 1000 * (60/req.body.songData.bpm/4) * (t + (i * cols))
					track.addNoteOn(
						0,
						n + req.body.songData.rootNote - 12 - 1,
						currentTime - previousTime,
						64
					)
					previousTime = currentTime
				}
			}
		}
	}
	
	res.send(file.toBytes())
})

app.listen(port, host);