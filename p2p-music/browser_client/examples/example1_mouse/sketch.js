// =========================================
// Tone.js exploration by Jake Sherwood.
// Original concept / idea Doug G.
//
// ##### SOURCES ######
// Modified code from these sources:
// various synth setups: https://editor.p5js.org/ivymeadows/sketches/B1FidNdqQ by ivymeadows
// player setups connected to ui elements: https://editor.p5js.org/ivymeadows/sketches/rJkDaOmTQ by ivymeadows
// visuals from p5sound example modified to work with Tonejs: https://therewasaguy.github.io/p5-music-viz/demos/01b_amplitude_time/ by therewasaguy
// The Body Everywhere and Here Class 2: Example 1 — Mouse over webRTC by Lis Jamhoury https://github.com/lisajamhoury/The-Body-Everywhere-And-Here/
// #####################
//
// ##### CONTROLS ######
// key presses toggle functions call on mouse touch
// 1: the Beat
// 2: the ass
// 3: Oscillator
// 4: backwards rGuitar
// 5: rain
// 6: throwaway sound
// 7: synthA
// 8: synthB
// 9: synthC
// s: turns off touch function calls
// o: changes oscillator mode
// #####################
//
// ##### BUGS ######
// 1: only toggling on off once per touch
// 2: disallowing partner to turn on and off sounds
// 3: have to start oscillator for sounds to start
// 4: playing synths reliably
// 5: controlling partners state - commented out atm
// 6: Lisa's new webrtc_peer_client.js makes it so nothing works
// #####################
// =========================================





// p5 code goes here
// Include this for to use p5 autofill in vscode
// See https://stackoverflow.com/questions/30136319/what-is-reference-path-in-vscode
/// <reference path="../shared/p5.d/p5.d.ts" />
/// <reference path="../shared/p5.d/p5.global-mode.d.ts" />

// Peer variables
let startPeer;
let partnerMousePosition;
let myMousePosition = {};
let partnerChange = true;
let myData = {};
let isTouching = false;
let startTouch = false;
let touchCount = 0;

let globald;


// What interaction are we running?
// We start with interaction 1
let state = 1;
let myState;

// Use for developing without partner
// This will mirror one user's mouse
// and will ingnore the mouse over peer connection
let mirror = false;

// Globals for lerping in heartbeat animation
let step = 0.1;
let amount = 0;

// Globals for growing animation
const origSize = 50;
let size = origSize;

// Colors used for drawing mouse ellipses
const colors = {
  x: 'rgba(255, 63, 84, 0.5)',
  y: 'rgba(4, 10, 255, 0.5)',
  z: 'rgba(82, 100, 118, 0.5)',
  b: 'rgba(255, 213, 0, 0.5)',
};

// Setup() is a p5 function
// See this example if this is new to you
// https://p5js.org/examples/structure-setup-and-draw.html
function setup() {
  // Make a p5 canvas 500 pixels wide and 500 pixels high
  createCanvas(500, 500);

  // Fix the framerate to throttle data sending and receiving
  frameRate(30);

  // Set to true to turn on logging for the webrtc client
  WebRTCPeerClient.setDebug(false);

  // Start socket client automatically on load
  // By default it connects to http://localhost:80
  // commint out this line if using ngrok, which connects your peer on localhost port 80
  // WebRTCPeerClient.initSocketClient();

  // To connect to server over public internet pass the ngrok address
  // See https://github.com/lisajamhoury/WebRTC-Simple-Peer-Examples#to-run-signal-server-online-with-ngrok
  // WebRTCPeerClient.initSocketClient('http://xxxxxxxxx.ngrok.io');
  WebRTCPeerClient.initSocketClient('https://e4b1bf878f4a.ngrok.io');

  // Start the peer client
  WebRTCPeerClient.initPeerClient();

  // Tonejs code
  // createCanvas(windowWidth, windowHeight - 30);
  // start Tone Transport - Transport is the master time keeper
  // per https://medium.com/@lukepura/basics-of-making-music-with-tone-js-5b294a92b240

  Tone.Transport.start();

  // setup Oscillator
  var ampEnv = new Tone.AmplitudeEnvelope({
    "attack": 0.1,
    "decay": 0.2,
    "sustain": 1.0,
    "release": 0.8
  }).toMaster();
  //create an oscillator and connect it
  var osc = new Tone.Oscillator().connect(ampEnv).start();
  //trigger the envelopes attack and release "8t" apart
  ampEnv.triggerAttackRelease("8t");

  rectMode(CENTER);
  colorMode(HSB);



}

function draw() {
  // Only proceed if the peer connection is started
  if (!WebRTCPeerClient.isPeerStarted()) {
    return;
  }

   //update myState to be equal to state
   myState = state; 

   // modified to pass state from both mouse pos and state
  myData = {
    x: mouseX,
    y: mouseY,
    myState: state
  };

  //send data to parter
  WebRTCPeerClient.sendData(myData);

  // If mirror is true, use my mouse as my partners mouse
  if (mirror) {
    // If my partner's mouse positin isn't defined,
    // Create it at 0,0
    if (typeof partnerMousePosition === 'undefined') {
      partnerMousePosition = {
        x: 0,
        y: 0
      };
    }

    // Mirror the x of my mouse to create my partner's mouse
    // partnerMousePosition.x = width - myMousePosition.x;
    // partnerMousePosition.y = myMousePosition.y;
    partnerMousePosition.x = width - myData.x;
    partnerMousePosition.y = myData.y;

    // This runs if not mirroring mouse
  } else {
    // Get the incoming data from the peer connection
    const newData = WebRTCPeerClient.getData();

    // Check if there's anything in the data;
    if (newData === null) {
      return;
      // If there is data
    } else {
      // Get the mouse data from newData.data
      // Note: newData.data is the data sent by user
      // Note: newData.userId is the peer ID of the user

      partnerMousePosition = newData.data;

      // attempting to set partners state the same as mine - couldn't get it to work. decided I don't actually want this.

      // if (state != partnerMousePosition.myState) {
      //   console.log("states are different");
      //   console.log("state = " + state + " newData.data.myState = " + newData.data.myState);
      //   console.log("state = " + state + " partnerMousePosition.myState = " + partnerMousePosition.myState);
      //   //console.log(myData.myState);
      //   state = partnerMousePosition.myState;
      //   // state = newData.data.myState;
      //   //WebRTCPeerClient.sendData(myData);
      //   console.log("states are the same");
      // } else {
      //    //state = partnerMousePosition.myState;
      // }
    }
  }

  // Updates sounds to control based on choosen sound state (1-9, 0 turns it off so partner can't control/ no functions are call on touch)
  chooseSound();

  // Draw a white background with alpha of 50
  background(0, 50);

  // Don't draw the stroke
  noStroke();

  // Use color x for my mouse position
  if (isTouching == true) fill(colors.b);
  else fill(colors.x);

  // Draw an ellipse at my mouse position
  // ellipse(myMousePosition.x, myMousePosition.y, size);
  ellipse(myData.x, myData.y, size);

  // Make sure there is a partner mouse position before drawing
  if (partnerMousePosition !== null) {
    // Use color y for my parter's mouse position
    // fill(colors.y);
    if (isTouching == true) fill(colors.b);
    else fill(colors.y);

    // Draw an ellipse at my partner's mouse position
    ellipse(partnerMousePosition.x, partnerMousePosition.y, size);
  }

  //Tonejs exploration draw() code

  //adjust osc values based on mouse position - this could be done when mouse from 2 servers meet
  
  if (oscMode == true){
      osc.frequency.value = map(mouseX, 0, width, 40, 200);
      osc.volume.value = map(mouseY, 0, height, 1, -10);
  } else {
      osc.frequency.value = -globald;
      osc.volume.value = map(mouseY, 0, height, 1, -10);
  }
  var level = abs(toneMeter.getLevel() / 50);

  // Visuals based on level amplitude
  // rectangle variables
  var spacing = 10;
  var w = width / (prevLevels.length * spacing);

  var minHeight = 2;

  // add new level to end of array
  prevLevels.push(level);

  // remove first item in array
  prevLevels.splice(0, 1);

  // loop through all the previous levels
  for (var i = 0; i < prevLevels.length; i++) {
    var x = map(i, prevLevels.length, 0, width / 2, width);
    var h = map(prevLevels[i], 0, 0.5, minHeight, height);
    var alphaValue = logMap(i, 0, prevLevels.length, 1, 250);
    var hueValue = map(h, minHeight, height, 200, 255);
    var randomHue = random(0, 360);

    fill(hueValue, randomHue, 255, alphaValue);

    rect(x, height / 2, w, h);
    rect(width - x, height / 2, w, h);
  }
  // End Visuals based on level amplitude

  // trying to get state of Tone object but not working
  // console.log("Tone.State = " +Tone.State);

  // if (frameCount % 120 == 0) console.log(myData, partnerMousePosition);

}

// Animation state 0 // used for all interactions
function beat() {
  // If my mouse and my partner's mouse are touching
  if (touching(myData, partnerMousePosition)) {
    // If my lerp amount is above or below the threshold, change direction
    if (amount > 1 || amount < 0) {
      step *= -1;
    }

    // Change the lerp amount by the step amount
    amount += step;

    // Lerp the size by the lerp amount
    size = lerp(origSize * 3, origSize * 4, amount);

    isTouching = true;

    // If they are not touching
  } else {
    // Draw them at their original size
    size = origSize;
    isTouching = false;
  }
}

function touching(mouse1, mouse2) {
  // Get the distance between the two mice
  const d = dist(mouse1.x, mouse1.y, mouse2.x, mouse2.y);
  globald = d;
  // If the distance if larger than the original size of the mouse
  if (d > origSize) {
    // They are not touching, return true

    isTouching = false;
    startTouch = false;
    return false;

    // Otherwise
  } else {
   
    if (partnerChange == true) {
      
      isTouching = true;
      if (isTouching) {
        startTouch = true;
        console.log("we're touching");
      }
    }
    // They are touching, return true
    return true;

  }
}

function chooseSound() {
  // Switch statements are similar to a series of if statements
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/switch

  // This changes the animation based on the value of the variable "state"
  switch (state) {
    case 1:
      DBCallBack();
      break;
    case 2:
      BassCallBack();
      break;
    case 3:
      OscCallBack();;
      break;
    case 4:
      rGuitarCallBack();
      break;
    case 5:
      rainCallBack();

      break;
    case 6:
      throwAwayCallBack();
      break;
    case 7:
      doPattern();
      break;
    case 8:
      doSynthA();
      break;
    case 9:
      doPianoPart();
      break;
    case 0:
      beat();
      break;
  }
}

function keyTyped() {
  console.log('pressed ' + key);

  // Switch statements are similar to a series of if statements
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/switch

  // This changes the value of the variable "state" on key press
  switch (key) {
    case '1':
      state = 1;
      break;
    case '2':
      state = 2;
      break;
    case '3':
      state = 3;
      break;
    case '4':
      state = 4;
      break;
    case '5':
      state = 5;
      break;
    case '6':
      state = 6;
      break;
    case '7':
      state = 7;
      break;
    case '8':
      state = 8;
      break;
    case '9':
      state = 9;
      break;
    case '0':
      state = 0;
      break;
    case 's':
      partnerChange = !partnerChange;
      break;
    case 'o':
      oscMode = !oscMode;
      console.log("oscMode = " + oscMode);
      break;

  }

  WebRTCPeerClient.sendData(myData);

}