let kinectron;
let camArray = [];
let r, g, b, a;
let showKey = false;
let doFilter = false;

function setup() {
  createCanvas(1280 / 2, 720 / 2);
  kinectron = new Kinectron('65dcf20e5d0c.ngrok.io');
  kinectron.setKinectType('windows');
  kinectron.makeConnection();
  kinectron.startKey(drawKey);
  // kinectron.startMultiFrame(["color", "depth", "body"]);
}

function draw() {

}

function drawKey(keyImg) {
  background(255);
  imgBg = loadImage(keyImg.src);

  camArray.push(new BgImg(imgBg, r, g, b, a));
  r = random(0, 255);
  g = random(0, 255);
  b = random(0, 255);
  a = random(0, 255);

  for (let i = 0; i < camArray.length; i++) {
    camArray[i].display();
    camArray[i].pixelLines();
  }

  loadImage(keyImg.src, img => {
    if (showKey) tint(255, 255);
    if (doFilter) filter(THRESHOLD);
    image(img, 0, 0);

  });

  if (camArray.length > 100) camArray.splice(1);
}

class BgImg {
  constructor(img, r, g, b, a, mouseX, mouseY) {
    this.img = img;
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
    this.mouseX = mouseX;
    this.mouseY = mouseY;
  }

  display() {
    image(this.img, 0, 0);
    tint(this.r, this.g, this.b, this.a);
  }

  pixelLines() {
      this.img.loadPixels();
      const currentPixels = this.img.pixels;

      // not sure why height of 560 makes lines span canvas height.  Setting to height they stop 2/3 down - ask Lisa
      for (let y = 0; y < 560; y++) {
        for (let x = 0; x < width; x += 5) {
          const i = (y * width + x) * 4;
          currentPixels[i + 0] = 0;
          currentPixels[i + 1] = 0;
          currentPixels[i + 2] = 0;
        }
      }
      this.img.updatePixels();
    }
  
}

function keyTyped() {

  // Pressing the "q" key to
  // save the image
  if (key === 's') {
    saveFrames('out', 'png', 1, 25);
    console.log('image saved');
  }
  if (key === 'k') {
    showKey = !showKey;
  }
  if (key === 'f') {
    doFilter = !doFilter;
  
  }
}
