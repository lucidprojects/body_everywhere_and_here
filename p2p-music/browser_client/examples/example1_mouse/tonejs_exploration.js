// =========================================
// Tone.js exploration by Jake Sherwood.
// Original concept / idea Doug G.
//
// ##### SOURCES ######
// Modified code from these sources:
// various synth setups: https://editor.p5js.org/ivymeadows/sketches/B1FidNdqQ by ivymeadows
// player setups connected to ui elements: https://editor.p5js.org/ivymeadows/sketches/rJkDaOmTQ by ivymeadows
// visuals from p5sound example modified to work with Tonejs: https://therewasaguy.github.io/p5-music-viz/demos/01b_amplitude_time/ by therewasaguy
// #####################
//
// =========================================

// set up bpm for Transport
Tone.Transport.bpm.value = 127;
var time;

// use this for visuals - setting array of lines appending every frame
var prevLevels = new Array(60);

// Set up Tonejs Player samples - attached to UI buttons
// var DB = new Tone.Player("samples/aj-tracey-uk-garage-drums-full.wav").toMaster();
var DB = new Tone.Player("samples/hyster1a-techno-beat.wav").toMaster();
var DBEvent = new Tone.Event(playDB);
DBEvent.loop = false;

var rGuitar = new Tone.Player("samples/reversed-guitar.wav").toMaster();
var rGuitarEvent = new Tone.Event(playrGuitar);
rGuitarEvent.loop = false;

var throwAway = new Tone.Player("samples/throway.wav").toMaster();
var throwAwayEvent = new Tone.Event(playThrowAway);
throwAwayEvent.loop = false;

var rain = new Tone.Player("samples/Rain-and-birds-sounds.mp3").toMaster();
var rainEvent = new Tone.Event(playRain);
rainEvent.loop = false;

var Bass = new Tone.Player("samples/moog-bass.wav").toMaster();
var BassEvent = new Tone.Event(playBass);
BassEvent.loop = false;


// Audio Effects for use with synths
var crusher = new Tone.BitCrusher(6).toMaster();
var delay = new Tone.FeedbackDelay(0.5).connect(Tone.Master);
var osc;
var oscEvent = false;
var oscMode = true;

osc = new Tone.Oscillator(200, "sine").connect(delay).toMaster();

// Set up synths - these need to be adjusted to sound better with samples
var synthAEvent = false;
var synthA = new Tone.Synth({
    oscillator: {
        type: 'triangle7',
        modulationType: 'sine',
        modulationIndex: 3,
        harmonicity: 3.4
    },
    envelope: {
        attack: 0.001,
        decay: 0.1,
        sustain: 0.1,
        release: 0.1
    }

}).connect(delay).toMaster();


var synthApattern = new Tone.Pattern(function (time, note) {
    synthA.triggerAttackRelease(note, time);
    // }, ["C2", "D2", "E3", "G3", "A4"], "alternateDown");
    // }, ["B3", "Dd4", "E4", "Gb4", "A5"], "alternateDown");
}, ["B3", "D4", "E4", "G4", "A5"], "alternateDown");



var synthC = new Tone.PolySynth(4, Tone.Synth).connect(crusher).toMaster();
synthC.set({
    "filter": {
        "type": "lowpass"
    },
    "envelope": {
        "attack": 0.25
    }
});

//Em C G D
var e_chord = ["E3", "G3", "C2"];
var C_chord = ["C3", "E3", "G3"];
var G_chord = ["G3", "E3", "D3"];
var D_chord = ["D3", "G3", "E3"];


//c# minor key chords
// var e_chord = ["E4", "Gb4", "B4"];
// var f_chord = ["Fb4", "A4", "Cb5"];
// var a_chord = ["A4", "Cb5", "E5"];
// var b_chord = ["B4", "Db5", "Fb5"];

//middle C - C3
var e_chord = ["E3", "Gb3", "B3"];
var f_chord = ["Fb3", "A3", "Cb4"];
var a_chord = ["A3", "Cb4", "E4"];
var b_chord = ["B3", "Db4", "Fb4"];


var pianoPartEvent = false;
var pianoPart = new Tone.Part(function (time, chord) {
    synthC.triggerAttackRelease(chord, "8n", time);
}, [
    // ["0:0", e_chord],
    // ["0:05", C_chord],
    // ["0:1", G_chord],
    // ["0:2", D_chord]

    //c# minor chords
    ["0:0", e_chord],
    ["0:05", f_chord],
    ["0:1", a_chord],
    ["0:2", b_chord]
])


const synthB = new Tone.Synth().toMaster();
var partEvent = false;
//pass in an array of events
var part = new Tone.Part(function (time, event) {
    //the events will be given to the callback with the time they  occur
    synthB.triggerAttackRelease(event.note, event.dur, time)
}, [{
        time: 0,
        note: 'C4',
        dur: '4n'
    },
    {
        time: '4n + 8n',
        note: 'E4',
        dur: '8n'
    },
    {
        time: '2n',
        note: 'G4',
        dur: '16n'
    },
    {
        time: '2n + 8t',
        note: 'B4',
        dur: '4n'
    }
])

// connect audio sources to Tone.Meter for visuals
const toneMeter = new Tone.Meter({
    channels: 2,
});
DB.connect(toneMeter);
rGuitar.connect(toneMeter);
throwAway.connect(toneMeter);
rain.connect(toneMeter);
Bass.connect(toneMeter);
osc.connect(toneMeter);
synthB.connect(toneMeter);
synthA.connect(toneMeter);
synthC.connect(toneMeter);

//currently not using
var waveform;


//Tone.Event functions connected to UI buttons
function playDB() {
    if (DB.loaded) {
        DB.start();
        if (frameCount % 30 == 0) console.log('playDB on');

    }
}

function playrGuitar() {
    if (rGuitar.loaded) {
        rGuitar.start();
        if (frameCount % 30 == 0) console.log('rGuitar on');

    }
}

function playThrowAway() {
    if (throwAway.loaded) {
        throwAway.start();
        if (frameCount % 30 == 0) console.log('throwAway on');

    }
}

function playRain() {
    if (rain.loaded) {
        rain.start();
        if (frameCount % 30 == 0) console.log('rain on');

    }
}


function playBass() {
    if (frameCount % 30 == 0) console.log('Bass on');
    if (Bass.loaded) {
        Bass.start();
    }
}



//callback functions for audio source buttons - this could be done when mouse from 2 servers meet
function DBCallBack() {
    // if (touching(myData, partnerMousePosition) && startTouch == true) {
    if (touching(myData, partnerMousePosition)) {
        beat();
        DBEvent.start();
        if (startTouch == true) {
            DBEvent.loop = !DBEvent.loop;
            console.log(DBEvent);
        }
    
        } else {
    
         size = origSize;
       // isTouching = false;
        
    }
    
}

function rGuitarCallBack() {
    if (touching(myData, partnerMousePosition)) {
        beat();
        rGuitarEvent.start();
        if (startTouch == true) {
            rGuitarEvent.loop = !rGuitarEvent.loop;
            console.log(rGuitarEvent);
        }
        // rGuitarEvent.loop = !rGuitarEvent.loop;
      } else {
          // Draw them at their original size
          size = origSize;
          isTouching = false;
      }
}

function throwAwayCallBack() {
    if (touching(myData, partnerMousePosition)) {
        beat();
        throwAwayEvent.start();
        if (startTouch == true) {
            // touchCount = 1;
            // if (touchCount == 1){
            throwAwayEvent.loop = !throwAwayEvent.loop;
            console.log("throwAwayEvent.loop = " + throwAwayEvent.loop);
            // touchCount++;
            // }
        }
        // throwAwayEvent.loop = !throwAwayEvent.loop;
      } else {
          // Draw them at their original size
          size = origSize;
          isTouching = false;
        //   touchCount = 0;
      }
      console.log("touchCount = "+ touchCount);
}

function rainCallBack() {
    if (touching(myData, partnerMousePosition)) {
        beat();
        rainEvent.start();
        if (startTouch == true) {
            rainEvent.loop = !rainEvent.loop;
            console.log(rainEvent);
        }
        // rainEvent.loop = !rainEvent.loop;
      } else {
          // Draw them at their original size
          size = origSize;
          isTouching = false;
      }4
}

//Instruments callback:
function BassCallBack() {
    if (touching(myData, partnerMousePosition)) {
        beat();
        BassEvent.start();
        // BassEvent.loop = !BassEvent.loop;
         if (startTouch == true) {
             BassEvent.loop = !BassEvent.loop;
             console.log(BassEvent);
         }
        //if (BassEvent == false) BassEvent.stop();
      } else {
          // Draw them at their original size
          size = origSize;
          isTouching = false;
      }
    //else BassEvent.stop();
}


function OscCallBack() {
    // if (touching(myData, partnerMousePosition) && startTouch == true) {
    if (touching(myData, partnerMousePosition))  {
        beat();
        if (startTouch == true) {
        oscEvent = !oscEvent;
        console.log(oscEvent);
        }
        if (oscEvent == true) osc.start();
        else osc.stop();
      } else {
          // Draw them at their original size
          size = origSize;
          isTouching = false;
      }
}

function doPattern() {
    if (touching(myData, partnerMousePosition)) {
        beat();
        if (startTouch == true) {
            partEvent = !partEvent;
            console.log(partEvent);
        }
        // console.log("partEvent " + partEvent);
        if (partEvent == true) {
            console.log("doPattern");
            part.start();
            part.loop = !part.loop;
            part.loopEnd = '1m';

        } else part.stop();
      } else {
          // Draw them at their original size
          size = origSize;
          isTouching = false;
      }
}


function doSynthA() {
    if (touching(myData, partnerMousePosition)) {
        beat();
        if (startTouch == true) {
            synthAEvent = !synthAEvent;
            console.log(synthAEvent);
        }
        // console.log("synthAEvent " + synthAEvent);
        if (synthAEvent == true) {
            console.log("doPattern");
            synthApattern.start();
            synthApattern.loop = !part.loop;
            synthApattern.loopEnd = '1m';

        } else synthApattern.stop();
      } else {
          // Draw them at their original size
          size = origSize;
          isTouching = false;
      }
}

function doPianoPart() {
    if (touching(myData, partnerMousePosition)) {
        beat();
        if (startTouch == true) {
            pianoPartEvent = !pianoPartEvent;
            console.log(pianoPartEvent);
        }
        // console.log("pianoPartEvent " + pianoPartEvent);
        if (pianoPartEvent == true) {
            console.log("pianoPartEventd");
            pianoPart.start();
            pianoPart.loop = !part.loop;
            pianoPart.loopEnd = '1m';
            // console.log("level " + level);

        } else pianoPart.stop();
      } else {
          // Draw them at their original size
          size = origSize;
          isTouching = false;
      }
}

// attempting to stop all but not working - can't get Tone.State
function stopAll() {
    if (Tone.State == 'started') {
        Tone.Transport.stop();
        console.log("stop transport");
    } else {
        Tone.Transport.stop();
        console.log("start transport");
        Tone.Transport.start();
    }
}

