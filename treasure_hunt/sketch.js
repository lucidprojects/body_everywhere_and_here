/// <reference path="/Users/dezbookpro/Documents/jakes_docs/p5/p5.global-mode.d.ts" />

let myVideo;
let threshSlider;
let threshVal;
let bgButton;
let bgPixels = [];

let mapImage;
let mapPixels = [];

let blackImage;

let prevTime = 0;
let tpPrevTime = 0;

let isMoving = false;

let routeButton;

let routeBlocks = [];

let routePointsX = [40, 80, 120, 155, 165, 165, 150, 135, 120, 90, 50, 10, 0, 5, 15, 45, 85, 120, 155, 190, 220, 245, 255, 255, 265, 285, 320, 355, 385, 405, 415, 415, 400, 380, 365, 365, 370, 385, 430, 470, 505, 535, 570, 605];
let routePointsY = [20, 30, 50, 75, 120, 160, 200, 240, 280, 315, 335, 325, 280, 240, 200, 170, 180, 195, 215, 240, 265, 300, 340, 380, 415, 445, 465, 460, 435, 405, 370, 335, 300, 270, 230, 190, 150, 115, 105, 115, 140, 175, 185, 185];
let routePointsA = [90, 105, 115, 125, 170, 185, 200, 200, 200, 220, 250, 290, 350, 5, 15, 55, 115, 115, 120, 125, 135, 145, 165, 185, 165, 145, 115, 80, 45, 35, 15, -5, -20, -40, -20, 0, 10, 25, 85, 105, 125, 135, 105, 85];

let j = 0;

let pastPixels = [];

let fadeToMap = false;

let topLog = true;

let finish;

let ship, anchor, flag, shipwheel, treasure, transImage;
let shipObj, anchorObj, flagObj, shipwheelObj, treasureObj;

var fade = 0;
var fadeAmount = 1;


function preload() {
  mapImage = loadImage("assets/map_bg2.jpg");
  transImage = loadImage("assets/trans.png");
  blackImage = loadImage("assets/black.jpg");
  ship = loadImage("assets/ship.png");
  anchor = loadImage("assets/anchor.png");
  flag = loadImage("assets/flag.png");
  shipwheel = loadImage("assets/shipswheel.png");
  treasure = loadImage("assets/treasure3.png");

}


function setup() {
  createCanvas(640, 480);
  background(0);

  myVideo = createCapture(VIDEO);
  myVideo.size(width, height);
  myVideo.hide();

  threshSlider = createSlider(0, 255, 100);
  bgButton = createButton('Go on a journey?');
  bgButton.mousePressed(setBG);

  routeButton = createButton('progress route');
  routeButton.mousePressed(addRoute);

  shipObj = new FadeImage(ship, 0, 0, 100, 100, fade, fadeAmount);
  flagObj = new FadeImage(flag, 30, 200, 100, 100, fade, fadeAmount);
  anchorObj = new FadeImage(anchor, 300, 360, 60, 100, fade, fadeAmount);
  shipwheelObj = new FadeImage(shipwheel, 400, 140, 100, 100, fade, fadeAmount);
  treasureObj = new FadeImage(treasure, 490, 210, 150, 150, fade, fadeAmount);

  threshVal = threshSlider.value();
}

function setBG() {
  console.log("im working");
  myVideo.loadPixels();
  const currentPixels = myVideo.pixels;

  for (let i = 0; i < currentPixels.length; i++) {
    bgPixels[i] = currentPixels[i];

  }

  // this starts the bg / comparison image as a blank black img instead of from the video
  blackImage.loadPixels();
  const blackPixels = blackImage.pixels;
  // for (let i = 0; i < blackPixels.length; i++) {
  //   bgPixels[i] = blackPixels[i];
  // }

  mapImage.loadPixels();
  mapPixels = mapImage.pixels;
}

//builds out the treasure map route
function addRoute() {
  let myColor = 'red';

  if (j < routePointsX.length) {
    routeBlocks.push(new RouteBlock(routePointsX[j], routePointsY[j], 10, 30, routePointsA[j]));
    j++;
  }

}

function draw() {

  myVideo.loadPixels();

  const currentPixels = myVideo.pixels;

  // let threshVal = threshSlider.value();

  // checks top left section for movement and completes route if motion is found
  for (let y = 0; y < 150; y++) {
    for (let x = 0; x < 150; x++) {

      const cordI = (y * width + x) * 4;
      const rtpDiff = abs(currentPixels[cordI + 0] - bgPixels[cordI + 0]);
      const gtpDiff = abs(currentPixels[cordI + 1] - bgPixels[cordI + 1]);
      const btpDiff = abs(currentPixels[cordI + 2] - bgPixels[cordI + 2]);

      avgtpDiff = (rtpDiff + gtpDiff + btpDiff / 3); // value 0 to 255;

      // if (avgtpDiff > threshVal) {
      if (avgtpDiff > 200) {
        if (topLog == true) console.log("avgtpDiff = " + avgtpDiff);
        if (millis() >= 800 + prevTime) {
          prevTime = millis();
          addRoute();
        }

      }

    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {

      const i = (y * width + x) * 4;

      const rDiff = abs(currentPixels[i + 0] - bgPixels[i + 0]);
      const gDiff = abs(currentPixels[i + 1] - bgPixels[i + 1]);
      const bDiff = abs(currentPixels[i + 2] - bgPixels[i + 2]);

      avgDiff = (rDiff + gDiff + bDiff / 3); // value 0 to 255;

      /////////// find the map and route ////////////
      if (avgDiff < threshVal) {
        // turn the pixel black
        currentPixels[i + 0] = 0;
        currentPixels[i + 1] = 0;
        currentPixels[i + 2] = 0;
        currentPixels[i + 3] = 10;
        // addRoute();

      } else {
        // otherwise, show me the map!
        currentPixels[i + 0] = mapPixels[i + 0];
        currentPixels[i + 1] = mapPixels[i + 1];
        currentPixels[i + 2] = mapPixels[i + 2];
      }
      ///////// End map  ////////////

    }
  }

  myVideo.updatePixels();

  image(myVideo, 0, 0, width, height);

  if (routeBlocks.length > 0) {
    for (let b = 0; b < routeBlocks.length; b++) {
      routeBlocks[b].display();
    }
  }

  if (routeBlocks.length > 10) {
    shipObj.display();
  }

  if (routeBlocks.length > 19) {
    flagObj.display();
  }

  if (routeBlocks.length > 27) {
    anchorObj.display();
  }

  if (routeBlocks.length > 37) {
    shipwheelObj.display();
  }

  if (routeBlocks.length >= 44) {
    treasureObj.display();
    topLog = false;
    fadeToMap = true;
    
  }

  //fadeout to only show the map 
  if (frameCount % 2 == 0 && threshVal > 0 && fadeToMap == true){
  // if (threshVal > 0 && fadeToMap == true){ // fades out quicker
    threshVal --;
    console.log(threshVal);
    finish = true;

  }

  //invert back to original map colors
    if (threshVal == 0) {
      filter(INVERT);
    }


  if (threshVal == 0 && finish == true) {
    flag.filter(INVERT);
    shipwheel.filter(INVERT);
    treasure.filter(INVERT);
    finish = false;
  }
}