let myCanvas = null;
let context = null;
let kinectron = null;
let frames = [];

function setup() {
  myCanvas = createCanvas(1000, 1000);
  context = myCanvas.drawingContext;

  //console.log(myCanvas.drawingContext);
  background("blue");

  // Define and create an instance of kinectron
  const kinectronServerIPAddress = '65dcf20e5d0c.ngrok.io'; // FILL IN YOUR KINECTRON IP ADDRESS HERE
  kinectron = new Kinectron(kinectronServerIPAddress);

  // Set kinect type to windows
  kinectron.setKinectType('windows');

  // Connect with application over peer
  kinectron.makeConnection();

  // Set individual frame callbacks
  kinectron.setColorCallback(colorCallback);
  kinectron.setDepthCallback(depthCallback);
  // kinectron.setBodiesCallback(bodyCallback);
  kinectron.setKeyCallback(keyCallBack);

  // Set frames wanted from Kinectron
  frames = ['color', 'depth', 'body','key'];
}

function keyPressed() {
  if (keyCode === ENTER) {
    kinectron.stopAll();
  } else if (keyCode === UP_ARROW) {
    kinectron.startRecord();
  } else if (keyCode === DOWN_ARROW) {
    kinectron.stopRecord();
  } else if (key === '8') {
    kinectron.startMultiFrame(['color', 'depth', 'body','key']);
  }
}

function colorCallback(img) {
  loadImage(img.src, function (loadedImage) {
    image(loadedImage, 0, 273.2, 660, 370);
  });
}

function depthCallback(img) {
  loadImage(img.src, function (loadedImage) {
    image(loadedImage, 330, 0, 330, 273.2);
  });
}

function keyCallBack(keyImg) {
  // loadImage(img.src, function (loadedImage) {
  //   image(loadedImage, 330, 0, 330, 273.2);
  // });
  loadImage(keyImg.src, img => {
    image(img, 0, 0);
   // camArray.push(img);
  });
}


function bodyCallback(body) {
  //find tracked bodies
  for (let i = 0; i < body.length; i++) {
    if (body[i].tracked === true) {
      bodyTracked(body[i]);
    }
  }
}

function bodyTracked(body) {
  context.fillStyle = '#000000';
  context.fillRect(0, 0, 330, 273.2);

  //draw joints in tracked bodies
  for (let jointType in body.joints) {
    const joint = body.joints[jointType];
    context.fillStyle = '#ff0000';
    context.fillRect(
      joint.depthX * 330,
      joint.depthY * 273.2,
      10,
      10,
    );
  }
}