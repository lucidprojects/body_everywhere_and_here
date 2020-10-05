// WebRTC Simple Peer Example — Posenet Skeleton
// https://github.com/lisajamhoury/WebRTC-Simple-Peer-Examples
// Created for The Body Everywhere and Here
// https://github.com/lisajamhoury/The-Body-Everywhere-And-Here/

// This example allows for two users to interact on the same p5 canvas
// using posenet via ml5. By default it runs over localhost.
// Use with ngrok pointing to localhost:80 to run over the public internet.
// See readme.md for additional instructions

// p5 code goes here

// include this to use p5 autofill in vscode
// see https://stackoverflow.com/questions/30136319/what-is-reference-path-in-vscode
/// <reference path="../shared/p5.d/p5.d.ts" />
/// <reference path="../shared/p5.d/p5.global-mode.d.ts" />


let poses = [];
let memeBtn;
let memeImage, partnerMemeImage;
let memeImageDebug = false;
let myRanNum, partnerRanNum;
let myMemes = [];
let partnerMemes = [];


let url = "https://api.imgflip.com/get_memes";

// array for memes 
let imgs = [];




function gotData(data) {
  // get data 
  let memes = data.data.memes;

  // load each image 
  // https://p5js.org/reference/#/p5/loadImage
  for (let j = 0; j < memes.length; j++) {
    imgs[j] = loadImage(memes[j].url);
    // console.log(imgs[2]);
  }

}

function preload() {
  
  //loadJSON(url, gotData);
  
  // trying local images instead of pulling from array
  imgs[0] = loadImage('memes/1g8my4.jpg');
  imgs[1] = loadImage('memes/1ur9b0.jpg');
  imgs[2] = loadImage('memes/1w7ygt.jpg');
  imgs[3] = loadImage('memes/1wz1x.jpg');
  imgs[4] = loadImage('memes/24y43o.jpg');
  imgs[5] = loadImage('memes/261o3j.jpg');
  imgs[6] = loadImage('memes/265k.jpg');
  imgs[7] = loadImage('memes/271ps6.jpg');
  imgs[8] = loadImage('memes/28s2gu.jpg');
  imgs[9] = loadImage('memes/2kbn1e.jpg');
  imgs[10] = loadImage('memes/2ybua0.png');
  imgs[11] = loadImage('memes/2za3u1.jpg');
  imgs[12] = loadImage('memes/30b1gx.jpg');
  imgs[13] = loadImage('memes/2ybua0.png');
  imgs[14] = loadImage('memes/2za3u1.jpg');
  imgs[15] = loadImage('memes/30b1gx.jpg');


}

// Peer variables
let startPeer;

// Posenet variables
let video;
let poseNet;

// Variables to hold poses
let myPose = {};
let partnerPose = {};

// Variables to hold noses
let myNose;
let partnerNose;

// Confidence threshold for posenet keypoints
const scoreThreshold = 0.5;

// Use for developing without partner
// This will mirror one user's pose
// and will ingnore the pose over peer connection
const mirror = false;

// Globals for growing animation
const origSize = 20;
let size = origSize;

// Color palette
const colors = {
  x: 'rgba(255, 0, 00, 0.5)',
  y: 'rgba(0, 0, 255, 0.5)',
  z: 'rgba(82, 100, 118, 0.5)',
  wRClr: 'rgba(255,44,180,0.8)',
  wLClr: 'rgba(50,205,50,0.8)',
};

// Setup() is a p5 function
// See this example if this is new to you
// https://p5js.org/examples/structure-setup-and-draw.html
function setup() {
  // Create p5 canvas
  createCanvas(640, 480);
  imageMode(CENTER);
  // Create webcam capture for posenet
  video = createCapture(VIDEO);
  video.size(width, height);

  // Options for posenet
  // See https://ml5js.org/reference/api-PoseNet/
  // Use these options for slower computers, esp architecture
  const options = {
    architecture: 'MobileNetV1',
    imageScaleFactor: 0.3,
    outputStride: 16,
    flipHorizontal: true,
    minConfidence: 0.5,
    scoreThreshold: 0.5,
    nmsRadius: 20,
    detectionType: 'single',
    inputResolution: 513,
    multiplier: 0.75,
    quantBytes: 2,
  };

  // Computers with more robust gpu can handle architecture 'ResNet50'
  // It is more accurate at the cost of speed
  // const options = {
  //   architecture: 'ResNet50',
  //   outputStride: 32,
  //   detectionType: 'single',
  //  flipHorizontal: true,
  //   quantBytes: 2,
  // };

  // Create poseNet to run on webcam and call 'modelReady' when ready
  poseNet = ml5.poseNet(video, options, modelReady);

  // Everytime we get a pose from posenet, call "getPose"
  // and pass in the results
  poseNet.on('pose', (results) => getPose(results));

  // Hide the webcam element, and just show the canvas
  video.hide();

  // Start socket client automatically on load
  // By default it connects to http://localhost:80
  WebRTCPeerClient.initSocketClient();

  // To connect to server remotely pass the ngrok address
  // See https://github.com/lisajamhoury/WebRTC-Simple-Peer-Examples#to-run-signal-server-online-with-ngrok
  WebRTCPeerClient.initSocketClient('https://2fcf727f20fd.ngrok.io');

  // WebRTCPeerClient.initSocketClient('https://xxxxxxxxxxxxx.ngrok.io');


  // Start the peer client
  WebRTCPeerClient.initPeerClient();

  memeBtn = createButton('new meme');
  memeBtn.mousePressed(newMeme);

  memeImage = imgs[1];
  partnerMemeImage = imgs[12];
  // console.log(memeImage);

}

// Draw() is a p5 function
// See this example if this is new to you
// https://p5js.org/examples/structure-setup-and-draw.html
function draw() {
  // Draw white background
  background(255);

  // image(memeImage, 300, 150, 150, 150);

  // Only proceed if the peer is started
  // And if there is a pose from posenet
  if (
    !WebRTCPeerClient.isPeerStarted() ||
    typeof myPose.pose === 'undefined'
  ) {
    console.log('returning!');
    return;
  }

  // If not mirroring
  // Get the partner pose from the peer connection
  if (!mirror) {
    // Get the incoming data from the peer connection
    const newData = WebRTCPeerClient.getData();

    // Check if there's anything in the data
    if (newData === null) {
      return;
      // If there is data
    } else {
      // Get the pose data from newData.data
      // newData.data is the data sent by user
      // newData.userId is the peer ID of the user
      partnerPose = newData.data;
    }

    // If mirror is true, mirror my pose.
    // Use this for testing/developing
  } else {
    mirrorPoseAndSkeleton();
  }

  // If we don't yet have a partner pose
  if (partnerPose === null) {
    // Return and try again for partner pose
    console.log('waiting for partner');
    return;
  }

  // Get my nose from my pose
  myNose = getNose(myPose, false);
  myWrist = getRWrist(myPose, false);

  // image(memeImage, width - 150, height - 150, 150, 150);
  image(memeImage, myNose.x, myNose.y, 150, 150);

  // Get my partner's nose from their pose
  partnerNose = getNose(partnerPose, true);
  partnerWrist = getLWrist(partnerPose, true);
  image(partnerMemeImage, partnerNose.x, partnerNose.y, 150, 150);

  if (partnerMemes) {
    drawKeypointsMemes(myPose, myMemes); // draw keypoints memes
    drawKeypointsMemes(partnerPose, partnerMemes);
  }

  // Draw my keypoints and skeleton
  drawKeypoints(myPose, colors.x, colors.wLClr, 0); // draw keypoints
  drawSkeleton(myPose, colors.x, 0); // draw skeleton

  // Draw partner keypoints and skeleton
  drawKeypoints(partnerPose, colors.y, colors.wRClr, 0);
  drawSkeleton(partnerPose, colors.y, 0);

  // If our noses are touching
  // if (touching(myNose, partnerNose)) {
  //   console.log('touching');
  //   // Increase the keypoint size
  //   size *= 1.01;
  //   newMeme();
  // } else {
  //   // Otherwise, draw keypoints at original size
  //   size = origSize;
  // }

  // If our wrists are touching
  if (touching(myWrist, partnerWrist)) {
    console.log('touching');
    // newMeme();
    memeImageDebug = true;

  } else {
    if (memeImageDebug == true) {
      newMeme();
      console.log("imgs[" + myRanNum + "]");
      console.log("imgs[" + partnerRanNum + "]");
      if (myMemes.length < 11) {
        myMemes.push(myRanNum);
        partnerMemes.push(partnerRanNum);
      }
      
      memeImageDebug = false;
    }
    memeImageDebug = false;
  }

  // Use for debugging
  // drawFramerate();
  // drawMyVideo();
}

// When posenet model is ready, let us know!
function modelReady() {
  console.log('Model Loaded');
}

// Function to get and send pose from posenet
function getPose(poses) {
  // We're using single detection so we'll only have one pose
  // which will be at [0] in the array
  myPose = poses[0];

  // Send my pose over peer if the peer is started
  if (WebRTCPeerClient.isPeerStarted()) {
    WebRTCPeerClient.sendData(myPose);
  }
}

// A function to draw ellipses over the detected keypoints
// Include an offset if testing by yourself
// And you want to offset one of the skeletons
function drawKeypoints(pose, clr, wClr, offset) {
  // Loop through all keypoints
  for (let j = 0; j < pose.pose.keypoints.length; j++) {
    // A keypoint is an object describing a body part (like rightArm or leftShoulder)
    const keypoint = pose.pose.keypoints[j];
    // Only draw an ellipse is the pose probability is bigger than 0.2
    if (keypoint.score > scoreThreshold) {
      fill(clr);
      noStroke();
      ellipse(
        keypoint.position.x + offset, // Offset useful if testing on your own
        keypoint.position.y,
        size,
        size,
      );
    }
  }
  const rightWrist = pose.pose.rightWrist;
  const leftWrist = pose.pose.leftWrist;

  push();
  noStroke();
  fill(wClr);
  rect(rightWrist.x, rightWrist.y, 40);
  rect(leftWrist.x, leftWrist.y, 40);
  pop();


}

function drawKeypointsMemes(pose, myMemeArray) {

  // Loop through all keypoints and add memes
  for (let j = 0; j < myMemeArray.length; j++) {
    for (let k = 4; k < pose.pose.keypoints.length; k++) {
      const keypoint = pose.pose.keypoints[j + 5];
      myImg = myMemeArray[j]
      image(imgs[myImg], keypoint.position.x, keypoint.position.y, 50, 50);
    }
  }

}




// A function to draw the skeletons
function drawSkeleton(pose, clr, offset) {
  // Loop through all the skeletons detected
  const skeleton = pose.skeleton;

  // For every skeleton, loop through all body connections
  for (let j = 0; j < skeleton.length; j++) {
    // Get the ends "joints" for each bone
    const partA = skeleton[j][0];
    const partB = skeleton[j][1];

    // If the score is high enough
    if (
      partA.score > scoreThreshold &&
      partB.score > scoreThreshold
    ) {
      // Draw a line to represent the bone
      stroke(clr);
      line(
        partA.position.x + offset,
        partA.position.y,
        partB.position.x + offset,
        partB.position.y,
      );
    }
  }
}

// Function to get nose out of the pose
function getNose(pose, mirror) {
  // If mirror is true, mirror the nose by subtracting it from the width
  if (mirror) pose.pose.nose.x = width - pose.pose.nose.x;

  // Return the nose
  return pose.pose.nose;
}

function getRWrist(pose, mirror) {
  // If mirror is true, mirror the nose by subtracting it from the width
  if (mirror) pose.pose.rightWrist.x = width - pose.pose.rightWrist.x;

  // Return the nose
  return pose.pose.rightWrist;
}

function getLWrist(pose, mirror) {
  // If mirror is true, mirror the nose by subtracting it from the width
  if (mirror) pose.pose.leftWrist.x = width - pose.pose.leftWrist.x;

  // Return the nose
  return pose.pose.leftWrist;
}



// Function to see if two points are "touching"
function touching(pose1, pose2) {
  // Get the distance between the two noses
  const d = dist(pose1.x, pose1.y, pose2.x, pose2.y);

  // If the distance is less than 50 pixels we are touching!
  if (d < 50) {
    return true;
  }

  // Otherwise we are not touching!
  return false;
}
// function touching(nose1, nose2) {
//   // Get the distance between the two noses
//   const d = dist(nose1.x, nose1.y, nose2.x, nose2.y);

//   // If the distance is less than 50 pixels we are touching!
//   if (d < 50) {
//     return true;
//   }

//   // Otherwise we are not touching!
//   return false;
// }

function mirrorPoseAndSkeleton() {
  // Use lodash to deep clone my pose and nose
  // See https://lodash.com/docs#cloneDeep
  partnerPose.pose = _.cloneDeep(myPose.pose);
  partnerPose.skeleton = _.cloneDeep(myPose.skeleton);

  // Mirror all of the bones and joints in the pose
  mirrorPose(partnerPose.pose);
  mirrorSkeleton(partnerPose.skeleton);
}

// A function to mirror the pose for testing with one person
function mirrorPose(pose) {
  // Loop through all keypoints
  for (let j = 0; j < pose.keypoints.length; j++) {
    // A keypoint is an object describing a body part (like rightArm or leftShoulder)
    const keypoint = pose.keypoints[j];
    // Reverse keypoint by subtracting the x from the width
    keypoint.position.x = width - keypoint.position.x;
  }
}

// A function to mirror the pose for testing with one person
function mirrorSkeleton(skeleton) {
  // We need to keep track of which parts are mirrored because
  // posenet duplicates parts within the pose object
  let mirroredParts = [];

  // Check that there are parts to connect
  if (skeleton.length < 1) return;

  // Loop through all body connections
  for (let i = 0; i < skeleton.length; i++) {
    // Get the joints
    const jointA = skeleton[i][0];
    const jointB = skeleton[i][1];

    // Check if the part is mirrored already
    const jointAMirrored = mirroredParts.includes(jointA.part);

    // If the part is not mirrored, mirror jointA
    if (!jointAMirrored) {
      jointA.position.x = width - jointA.position.x;
    }

    // Check if the part is mirrored already
    const jointBMirrored = mirroredParts.includes(jointB.part);

    // If the part is not mirrored, mirror jointB
    if (!jointBMirrored) {
      jointB.position.x = width - jointB.position.x;
    }

    // Add mirrored joints to array
    mirroredParts.push(jointA.part);
    mirroredParts.push(jointB.part);
  }
}

function drawFramerate() {
  fill(0);
  stroke(0);
  text(getFrameRate(), 10, 10);
}

function drawMyVideo() {
  // Draw my video for debug
  push();
  translate(0.25 * width, 0);
  scale(-0.25, 0.25);
  image(video, 0, 0, width, height);
  pop();
}

// Press any key to stop the sketch
function keyPressed() {
  noLoop();
}


let newMeme = () => {
  // memeImage = imgs[random(0,100)];
  myRanNum = floor(random(1, 100));
  partnerRanNum = floor(random(1, 100));
  memeImage = imgs[(myRanNum)];
  partnerMemeImage = imgs[partnerRanNum];
  // console.log("memeImage = " + memeImage);
}