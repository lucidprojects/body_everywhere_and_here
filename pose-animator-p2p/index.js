/**
 * @license
 * Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import * as posenet_module from "@tensorflow-models/posenet";
import * as facemesh_module from "@tensorflow-models/facemesh";
import * as tf from "@tensorflow/tfjs";
import * as paper from "paper";
import Stats from "stats.js";
import "babel-polyfill";

import {
    drawPoint,
    isMobile,
    toggleLoadingUI,
    setStatusText,
    drawSkeletonPose,
    drawKeypointsPose,
} from "./utils/demoUtils";
import {
    SVGUtils
} from "./utils/svgUtils";
import {
    PoseIllustration
} from "./illustrationGen/illustration";
import {
    Skeleton,
    facePartName2Index
} from "./illustrationGen/skeleton";
import {
    FileUtils
    //FileUtilsPeers
} from "./utils/fileUtils";
import {
    initSocketClient,
    initPeerClient,
    sendData,
    sendVideo,
    getData,
} from "./utils/webrtc_peer_client.js";
//} from "./utils/webrtc_peer_client_no_turn.js"; //switch 

import * as girlSVG from "./resources/illustration/girl.svg";
import * as boySVG from "./resources/illustration/boy.svg";
import * as abstractSVG from "./resources/illustration/abstract.svg";
import * as blathersSVG from "./resources/illustration/blathers.svg";
import * as tomNookSVG from "./resources/illustration/tom-nook.svg";
import * as pirate1SVG from "./resources/illustration/patch_pirate.svg";
import * as pirate2SVG from "./resources/illustration/pudgy_pirate.svg";
import * as lionSVG from "./resources/illustration/lion2.svg";
import * as zebraSVG from "./resources/illustration/zebra.svg";

// Peer vars
let faceDetectionPeer = null;
let illustrationPeer = null;
let facemeshPeer;
let posenetPeer;
let peerConnect = false;
let peerNoseX;
let priorPeerNoseX = 0;
let peerSameCounter = 0;


// Camera stream video element
let video;
let videoWidth = 300;
let videoHeight = 300;
let myStream;

// Canvas
let faceDetection = null;
let illustration = null;
let canvasScope;
let canvasWidth = 800;
let canvasHeight = 800;

// ML models
let facemesh;
let posenet;
let minPoseConfidence = 0.15;
let minPartConfidence = 0.1;
let nmsRadius = 30.0;

// Misc
let mobile = false;
const stats = new Stats();

let customSvgCount = 1;

const avatarSvgs = {
    girl: girlSVG.default,
    boy: boySVG.default,
    abstract: abstractSVG.default,
    blathers: blathersSVG.default,
    "tom-nook": tomNookSVG.default,
    pirate1: pirate1SVG.default,
    pirate2: pirate2SVG.default,
    lion: lionSVG.default,
    zebra: zebraSVG.default,
};

let poses = [];
let posesPeer = [];
let logPose = true;


/**
 * Loads a the camera to be used in the demo
 *
 */
async function setupCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
            "Browser API navigator.mediaDevices.getUserMedia not available"
        );
    }

    const video = document.getElementById("video");
    video.width = videoWidth;
    video.height = videoHeight;

    const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
            facingMode: "user",
            width: videoWidth,
            height: videoHeight,
        },
    });
    video.srcObject = stream;

    myStream = stream;

    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            resolve(video);
        };
    });
}

async function loadVideo() {
    const video = await setupCamera();
    video.play();

    return video;
}

const defaultPoseNetArchitecture = "MobileNetV1";
const defaultQuantBytes = 2;
const defaultMultiplier = 1.0;
const defaultStride = 16;
const defaultInputResolution = 200;

const keypointCanvas = document.getElementById("keypoints");
const keypointCanvasPeer = document.getElementById("keypointsPeer");

function initWebRTCPeer() {
    console.log("starting peer");
    // comment out local socket init if you're connecting to remote peer
    initSocketClient();
    // set ngrok address here to connect with remote peer
    // initSocketClient('https://7f2e7c4f7a06.ngrok.io');
    initPeerClient();
}

/**
 * Feeds an image to posenet to estimate poses - this is where the magic
 * happens. This function loops with a requestAnimationFrame method.
 */
function detectPoseInRealTime(video, peer) {
    const canvas = document.getElementById("output");
    // const keypointCanvas = document.getElementById("keypoints");
    const videoCtx = canvas.getContext("2d");
    const keypointCtx = keypointCanvas.getContext("2d");


    const canvasPeer = document.getElementById("outputPeer");
    // const keypointCanvasPeer = document.getElementById("keypointsPeer");
    const videoCtxPeer = canvasPeer.getContext("2d");
    const keypointCtxPeer = keypointCanvasPeer.getContext("2d");

    canvas.width = videoWidth;
    canvas.height = videoHeight;
    keypointCanvas.width = videoWidth;
    keypointCanvas.height = videoHeight;
    let posesWristL, posesWristR;
    let poseWristLX, poseWristLY, poseWristRX, poseWristRY;

    canvasPeer.width = videoWidth;
    canvasPeer.height = videoHeight;
    keypointCanvasPeer.width = videoWidth;
    keypointCanvasPeer.height = videoHeight;
    let peerWristL, peerWristR;
    let peerWristLX, peerWristLY, peerWristRX, peerWristRY;


    let poseBtn = document.getElementById('showPoses');
    let poseWindow = document.getElementById('main');
    let eyeShow = document.getElementById('eyeShow');
    let eyeHide = document.getElementById('eyeHide');
    let eyeLable = document.getElementById('eyeLable');
    // let initialWindowDisplay = poseWindow.style.display;
    // console.log(initialWindowDisplay);

    poseBtn.addEventListener('click', function () {
        console.log('toggle pose windows');
        let poseWindowDisplay = poseWindow.style.display;
        if (poseWindowDisplay == 'block') {
            poseWindow.style.display = 'none';
            eyeShow.classList.remove('icon-eye');
            eyeShow.classList.add('eye-hide');
            eyeHide.classList.remove('icon-eye');
            eyeHide.classList.add('eye-hide');
            eyeLable.classList.add('eye-hide');
        } else {
            poseWindow.style.display = 'block';
            eyeShow.classList.remove('eye-hide');
            eyeShow.classList.add('icon-eye');
            eyeHide.classList.remove('eye-hide');
            eyeHide.classList.add('icon-eye');
            eyeLable.classList.remove('eye-hide');
        }
    });


    async function poseDetectionFrame() {
        // Begin monitoring code for frames per second
        stats.begin();

        poses = [];


        videoCtx.clearRect(0, 0, videoWidth, videoHeight);
        // Draw video
        videoCtx.save();
        videoCtx.scale(-1, 1);
        videoCtx.translate(-videoWidth, 0);
        videoCtx.drawImage(video, 0, 0, videoWidth, videoHeight);
        videoCtx.restore();

        // Creates a tensor from an image
        const input = tf.browser.fromPixels(canvas);
        faceDetection = await facemesh.estimateFaces(input, false, false);
        let all_poses = await posenet.estimatePoses(video, {
            flipHorizontal: true,
            decodingMethod: "multi-person",
            maxDetections: 1,
            scoreThreshold: minPartConfidence,
            nmsRadius: nmsRadius,
        });

        poses = poses.concat(all_poses);
        if (logPose) {
            // console.log("poses");
            // console.log(poses);
            logPose = false;
        }

        // posesWristR = poses[0].keypoints[9].position;
        // posesWristL = poses[0].keypoints[10].position;

        function getWristR() {
            return poses[0].keypoints[9].position;
        }

        function getWristL() {
            return poses[0].keypoints[10].position;
        }

        posesWristR = getWristR();
        posesWristR = getWristL();

        // are local wrists touching
        // if (touched(posesWristR, posesWristR)) {
        //     console.log('local wrist touching from touched func');
        //     // swapSvgs();

        // } else {}

        sendData({
            skeleton: poses,
            face: faceDetection
        });
        sendVideo(myStream);

        // get other data
        let newData = getData();
        // console.log(newData);

        // let peerData = newData;
        if (newData !== null) {

            let peerPoses = newData.data.skeleton;
            let peerFace = newData.data.face;

            // do something here with data
            if (!peerConnect) {
                // console.log("got data");
                peerSameCounter = 0;
                peerConnect = true;
            }

            // get nose posX
            peerNoseX = newData.data.skeleton[0].keypoints[0].position.x;

            posesPeer = peerPoses;

            function getPeerWristR() {
                return newData.data.skeleton[0].keypoints[9].position;
            }

            function getPeerWristL() {
                return newData.data.skeleton[0].keypoints[10].position;
            }

            // console.log(getWristR());
            // console.log(getWristL());

            peerWristR = getPeerWristR();
            peerWristL = getPeerWristL();

            // experiments with differnt pose interactions
            // are peer wrists touching?  - works more reliably for some reason
            if (touched(peerWristR, peerWristL)) {
                console.log('peer wrist touching from touched if stmt');
                swapSvgs();

            } else {}

            // are local and remote wrists touching? - interaction hard to control
            // if (touched(posesWristR, peerWristR)) {
            //     console.log('pose wristr & peer wristr touching from touched if stmt');
            //     swapSvgs();

            // } else {}

            faceDetectionPeer = peerFace;
            
            drawPoseSkeletons(keypointCtxPeer, posesPeer, faceDetectionPeer, "pink", "orange");

        }

        //console.log(faceDetectionPeer);

        if (peerConnect) {
            // console.log("I have a peer");
            if (peerNoseX == priorPeerNoseX) {
                // console.log("peerNose X is the same " + peerNoseX);
                peerSameCounter++;

                if (peerSameCounter > 25) {
                    peerConnect = false;
                    firstConnect = 0;
                    newData = {};
                }

            } else {
                // console.log("peerNose X is not the same " + peerNoseX + " pior Nose = " + priorPeerNoseX);
                peerSameCounter = 0;
                // drawPoseSkeletons(keypointCtxPeer, posesPeer, faceDetectionPeer, "pink", "orange");
            }
            priorPeerNoseX = peerNoseX;

        }


        input.dispose();

        function drawPoseSkeletons(canvas, pose, facePose, myColor, faceColor) {
            canvas.clearRect(0, 0, videoWidth, videoHeight);

            pose.forEach(({
                score,
                keypoints,

            }) => {
                if (score >= minPoseConfidence) {
                    // draw local and peer keypoint skeleton data
                    drawKeypointsPose(keypoints, minPartConfidence, canvas, myColor, pose);
                    drawSkeletonPose(keypoints, minPartConfidence, canvas, myColor, pose);
                }
            });


            if (facePose == null) facePose = faceDetection;
            // faceDetection.forEach((face) => {
            facePose.forEach((face) => {
                Object.values(facePartName2Index).forEach((index) => {
                    let p = face.scaledMesh[index];
                    drawPoint(canvas, p[1], p[0], 2, faceColor);
                });
            });
            // canvas.clearRect(0, 0, videoWidth, videoHeight);
        }

        drawPoseSkeletons(keypointCtx, poses, faceDetection, "aqua", "red");

        canvasScope.project.clear();

        // if there is peer data draw it to the canvas
        if (posesPeer.length >= 1 && illustrationPeer) {
            Skeleton.flipPose(posesPeer[0]);

            if (faceDetectionPeer && faceDetectionPeer.length > 0) {
                let face = Skeleton.toFaceFrame(faceDetectionPeer[0]);


                illustrationPeer.updateSkeleton(posesPeer[0], face);
            } else {
                illustrationPeer.updateSkeleton(posesPeer[0], null);
            }
            illustrationPeer.draw(canvasScope, videoWidth, videoHeight);   
        }

        // if there is local data draw it to the canvas
        if (poses.length >= 1 && illustration) {
            Skeleton.flipPose(poses[0]);

            if (faceDetection && faceDetection.length > 0) {
                let face = Skeleton.toFaceFrame(faceDetection[0]);
                illustration.updateSkeleton(poses[0], face);
            } else {
                illustration.updateSkeleton(poses[0], null);
            }
            illustration.draw(canvasScope, videoWidth, videoHeight);
        }


        canvasScope.project.activeLayer.scale(
            canvasWidth / videoWidth,
            canvasHeight / videoHeight,
            new canvasScope.Point(0, 0)
        );

        // End monitoring code for frames per second
        stats.end();
        
        // keep updating pose data
        requestAnimationFrame(poseDetectionFrame);

    }
    poseDetectionFrame();
}

function touched(pose1, pose2) {
    // Get the distance between the two poses
    let x = pose1.x - pose2.x;
    let y = pose1.y - pose2.y;

    let d = Math.hypot(x, y);

    // If the distance is less than 20 pixels we are touching!
    if (d < 20) {
        console.log("touched func = " + d);
        d = 100;
        return true;
    }

    // Otherwise we are not touching!
    return false;

}

function setupCanvas() {
    mobile = isMobile();
    if (mobile) {
        canvasWidth = Math.min(window.innerWidth, window.innerHeight);
        canvasHeight = canvasWidth;
        videoWidth *= 0.7;
        videoHeight *= 0.7;
    }

    canvasScope = paper.default;
    let canvas = document.querySelector(".illustration-canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    canvasScope.setup(canvas);
}

/**
 * Kicks off the demo by loading the posenet model, finding and loading
 * available camera devices, and setting off the detectPoseInRealTime function.
 */
export async function bindPage() {
    setupCanvas();

    toggleLoadingUI(true);
    setStatusText("Loading PoseNet model...");
    posenet = await posenet_module.load({
        architecture: defaultPoseNetArchitecture,
        outputStride: defaultStride,
        inputResolution: defaultInputResolution,
        multiplier: defaultMultiplier,
        quantBytes: defaultQuantBytes,
    });
    setStatusText("Loading FaceMesh model...");
    facemesh = await facemesh_module.load();

    setStatusText("Loading Avatar file...");
    let t0 = new Date();
    await parseSVG(Object.values(avatarSvgs)[1]); // sets default SVG
    await parsePeerSVG(Object.values(avatarSvgs)[0]); // sets peer SVG  adding this seemed to make it


    setStatusText("Setting up camera...");
    try {
        video = await loadVideo();
    } catch (e) {
        let info = document.getElementById("info");
        info.textContent =
            "this device type is not supported yet, " +
            "or this browser does not support video capture: " +
            e.toString();
        info.style.display = "block";
        throw e;
    }

    initWebRTCPeer();

    toggleLoadingUI(false);
    // detectPoseInRealTime(video, posenet);
    detectPoseInRealTime(video, false);
}

// drag and drop SVG

let uploadedSvg, uploadedPeerSvg;


navigator.getUserMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia;

// set drag and drop for individual local and peer pose windows    
FileUtils.setDragDropHandlerLocal((result) => {
    parseSVG(result);
    uploadedSvg = result;
});
FileUtils.setDragDropHandlerPeers((result) => {
    parsePeerSVG(result);
    uploadedPeerSvg = result;
});

async function parseSVG(target) {
    let svgScope = await SVGUtils.importSVG(target /* SVG string or file path */ );
    let skeleton = new Skeleton(svgScope);
    illustration = new PoseIllustration(canvasScope);
    illustration.bindSkeleton(skeleton, svgScope);
}

async function parsePeerSVG(target) {
    let svgScope = await SVGUtils.importSVG(target /* SVG string or file path */ );
    let skeleton = new Skeleton(svgScope);
    illustrationPeer = new PoseIllustration(canvasScope);
    illustrationPeer.bindSkeleton(skeleton, svgScope);
}

keypointCanvas.addEventListener('click', function () {
    console.log('clicked local keypoints');
    parseSVG(uploadedPeerSvg);
});
keypointCanvasPeer.addEventListener('click', function () {
    console.log('clicked peer keypoints');
    parsePeerSVG(uploadedSvg);
});

function swapSvgs() {

    // select random SVG index
    let ran1 = Math.floor(Math.random() * Object.keys(avatarSvgs).length);
    let ran2 = Math.floor(Math.random() * Object.keys(avatarSvgs).length);

    // if there is not a custom SVG uploaded cycle through SVG array
    if (!uploadedSvg) {
        let ranPeer = Object.values(avatarSvgs)[ran1];
        parsePeerSVG(ranPeer);
    } else {
        let tempLocal = uploadedPeerSvg;
        parsePeerSVG(uploadedSvg);
        uploadedPeerSvg = tempLocal;
    }

    if (!uploadedPeerSvg) {
        let ranLocal = Object.values(avatarSvgs)[ran2];
        parseSVG(ranLocal);
    } else {
        let tempPeer = uploadedSvg
        parseSVG(uploadedPeerSvg);
        uploadedSvg = tempPeer;
    }

   console.log("swap svgs");

}



bindPage();