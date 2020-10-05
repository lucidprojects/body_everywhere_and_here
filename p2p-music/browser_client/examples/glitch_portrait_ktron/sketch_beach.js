let kinectron;

function setup() {
  createCanvas(1280/2,720/2);
  kinectron = new Kinectron('aa1e3ef8c7be.ngrok.io');
  kinectron.setKinectType('azure');
  kinectron.makeConnection();
  kinectron.startKey(drawKey);
}

function draw() {
  // background(220);
}

function drawKey(keyImg) {
    // background(0);
    loadImage(keyImg.src, img => {
      image(img, 0, 0);
    });
}

