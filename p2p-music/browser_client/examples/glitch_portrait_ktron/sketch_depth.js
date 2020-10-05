let kinectron;

function setup() {
  createCanvas(640,576);
  colorMode(HSB);

  kinectron = new Kinectron('aa1e3ef8c7be.ngrok.io');
  kinectron.setKinectType('azure');
  kinectron.makeConnection();
  kinectron.startDepth(drawDepth);
}

function draw() {
  // background(220);
}

//beach example - user keyed out
function drawDepth(depthImg) {
    background(0);
    loadImage(depthImg.src, (dImg) => {
      dImg.loadPixels();
      let depthPixels = dImg.pixels;

      for(let i = 0 ; i < depthPixels.length; i+=4){
        let depthVal = depthPixels[i]; // 0-255;
        let mapVal = map(depthVal,0,255,0,1);
        let newRGB = HSVtoRGB(mapVal,1,1);

        depthPixels[i] = newRGB.r;
        depthPixels[i+1] = newRGB.g;
        depthPixels[i+2] = newRGB.b;
        depthPixels[i+3] = 255;

      }
      dImg.updatePixels();

      image(dImg, 0, 0);
    });
}


/* accepts parameters
 * h  Object = {h:x, s:y, v:z}
 * OR 
 * h, s, v
 */
function HSVtoRGB(h, s, v) {
  var r, g, b, i, f, p, q, t;
  if (arguments.length === 1) {
    s = h.s, v = h.v, h = h.h;
  }
  i = Math.floor(h * 6);
  f = h * 6 - i;
  p = v * (1 - s);
  q = v * (1 - f * s);
  t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0:
      r = v, g = t, b = p;
      break;
    case 1:
      r = q, g = v, b = p;
      break;
    case 2:
      r = p, g = v, b = t;
      break;
    case 3:
      r = p, g = q, b = v;
      break;
    case 4:
      r = t, g = p, b = v;
      break;
    case 5:
      r = v, g = p, b = q;
      break;
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}
