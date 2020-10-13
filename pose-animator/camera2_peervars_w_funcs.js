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
import dat from "dat.gui";
import Stats from "stats.js";
import "babel-polyfill";

import {
    drawKeypoints,
    drawPoint,
    drawSkeleton,
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
} from "./utils/fileUtils";
import {
    initSocketClient,
    initPeerClient,
    sendData,
    sendVideo,
    getData,
    getVideo,
    terminateSession,
    handleClose,
    addStream,
} from "./utils/webrtc_peer_client.js";

import * as girlSVG from "./resources/illustration/girl.svg";
import * as boySVG from "./resources/illustration/boy.svg";
import * as abstractSVG from "./resources/illustration/abstract.svg";
import * as blathersSVG from "./resources/illustration/blathers.svg";
import * as tomNookSVG from "./resources/illustration/tom-nook.svg";

// Peer vars
let videoPeer;
let faceDetectionPeer = null;
let illustrationPeer = null;
let facemeshPeer;
let posenetPeer;
let peerConnect = false;
let peerNoseX;
let priorPeerNoseX = 0;
let peerSameCounter = 0;
let firstConnect = 1;


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
const avatarSvgs = {
    girl: girlSVG.default,
    boy: boySVG.default,
    abstract: abstractSVG.default,
    blathers: blathersSVG.default,
    "tom-nook": tomNookSVG.default,
};

let poses;
let posesPeer = [];
let peerStream = false;
let newVideo
// let peerFace;

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

    // if ('srcObject' in video) {
    //     // console.log("srcObject setupCam = " + JSON.stringify(video.srcObject, null, 2));
    // }

    myStream = stream;

    // console.log(myStream);

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

const guiState = {
    avatarSVG: Object.keys(avatarSvgs)[0],
    debug: {
        showDetectionDebug: true,
        showIllustrationDebug: false,
    },
};

function initWebRTCPeer() {
    console.log("starting peer");
    // initSocketClient();
    initSocketClient('https://7f2e7c4f7a06.ngrok.io');
    initPeerClient();
}

/**
 * Feeds an image to posenet to estimate poses - this is where the magic
 * happens. This function loops with a requestAnimationFrame method.
 */
function detectPoseInRealTime(video, peer) {
    const canvas = document.getElementById("output");
    const keypointCanvas = document.getElementById("keypoints");
    const videoCtx = canvas.getContext("2d");
    const keypointCtx = keypointCanvas.getContext("2d");


    const canvasPeer = document.getElementById("outputPeer");
    const keypointCanvasPeer = document.getElementById("keypointsPeer");
    const videoCtxPeer = canvasPeer.getContext("2d");
    const keypointCtxPeer = keypointCanvasPeer.getContext("2d");

    canvas.width = videoWidth;
    canvas.height = videoHeight;
    keypointCanvas.width = videoWidth;
    keypointCanvas.height = videoHeight;

    canvasPeer.width = videoWidth;
    canvasPeer.height = videoHeight;
    keypointCanvasPeer.width = videoWidth;
    keypointCanvasPeer.height = videoHeight;

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

        // console.log("poses");
        // console.log(poses);
        // console.log("poses length = " + poses.length);

        // attempted to send stream in JSON but kept comming through empty?
        // send my data
        // sendData(poses);
        // sendData({
        //     skeleton: poses,
        //     face: faceDetection,
        //     stream: myStream,
        // });

        sendData({
            skeleton: poses,
            face: faceDetection
        });
        sendVideo(myStream);

        // get other data
        let newData = getData();
        // console.log(newData);

        // trying to get Video data but seems like it is still the posenet data?
        let newVideoStream = getVideo();

        //console.log("newVideo = " + newVideoStream.id);
        //console.log("newVideo = " + JSON.stringify(newVideoStream, null, 2));
        // console.log(Object.entries(newVideoStream));

        newVideo = document.getElementById('remoteVideo');

        newVideo.srcObject = newVideoStream;

        // // newVideo.onloadedmetadata = () => {
        // //     newVideo.play();
        // // };

        // let peerData = newData;
        if (newData !== null) {

            let peerPoses = newData.data.skeleton;
            let peerFace = newData.data.face;




            // console.log("in newData peerPoses = " + JSON.stringify(peerPoses));
            
            //console.log("in newData peerFace = " + JSON.stringify(peerFace));
            // console.log(newData);

            // do something here with data
            if (!peerConnect) {
                // console.log("got data");
                peerSameCounter = 0;
                peerConnect = true;
            }
            // console.log(newData);
            //  debugger;

            // get nose posX
            peerNoseX = newData.data.skeleton[0].keypoints[0].position.x;

            posesPeer = peerPoses;

            //console.log("in newData posesPeer = " + JSON.stringify(posesPeer));
            // console.log("posesPeer length = " + posesPeer.length);

            faceDetectionPeer = peerFace;

            videoCtxPeer.clearRect(0, 0, videoWidth, videoHeight);
            // Draw video peerpoints
            videoCtxPeer.save();
            videoCtxPeer.scale(-1, 1);
            videoCtxPeer.translate(-videoWidth, 0);
            videoCtxPeer.drawImage(newVideo, 0, 0, videoWidth, videoHeight);
            videoCtxPeer.restore();

            // console.log("posesPeer");
            // console.log(posesPeer);
            // console.log(posesPeer.length);
            if (!peerStream) {
                // newVideo.srcObject = newVideoStream;
                // peerStream = true;
            }
            // newVideo.onloadedmetadata = () => {
                // this plays local video not peer video - not sending through properly
                // newVideo.play();
            // };
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
                    //  console.log(newData);
                    //  handleClose();
                    //terminateSession();
                    //peer.destroy();
                }

            } else {
                // console.log("peerNose X is not the same " + peerNoseX + " pior Nose = " + priorPeerNoseX);
                peerSameCounter = 0;
                drawPoseSkeletons(keypointCtxPeer, posesPeer, faceDetectionPeer, "pink", "orange");

                 //console.log("parsePeerSVG " + parsePeerSVG(avatarSvgs[3]));  // results in promise


                // parsePeerSVG(Object.values(avatarSvgs)[3]);
                // console.log("posesPeer length " + posesPeer.length);
                //console.log("illustrationPeer " + illustrationPeer);
                // console.log("illustration " + Object.entries(illustration));

                // let consoleDirIll = true;
                // if(consoleDirIll) console.dir(illustration);
                // consoleDirIll = false;

            }
            priorPeerNoseX = peerNoseX;

        }


        input.dispose();

        // keypointCtx.clearRect(0, 0, videoWidth, videoHeight);
        // if (guiState.debug.showDetectionDebug) {

        function drawPoseSkeletons(canvas, pose, facePose, myColor, faceColor) {
            canvas.clearRect(0, 0, videoWidth, videoHeight);

            pose.forEach(({
                score,
                keypoints,

            }) => {
                if (score >= minPoseConfidence) {
                    // let whichCanvas = keypointCtx;
                    //drawKeypoints(keypoints, minPartConfidence, keypointCtx);
                    // drawSkeleton(keypoints, minPartConfidence, keypointCtx);
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
        // //  if (peerConnect) {
            if (posesPeer.length >= 1 && illustrationPeer) {
                Skeleton.flipPose(posesPeer[0]);

                if (faceDetectionPeer && faceDetectionPeer.length > 0) {
                    let face = Skeleton.toFaceFrame(faceDetectionPeer[0]);
                    

                    illustrationPeer.updateSkeleton(posesPeer[0], face);
                } else {
                    illustrationPeer.updateSkeleton(posesPeer[0], null);
                }
                illustrationPeer.draw(canvasScope, videoWidth, videoHeight);

                if (guiState.debug.showIllustrationDebug) {
                    illustrationPeer.debugDraw(canvasScope);
                }
            }
        // // }

        if (poses.length >= 1 && illustration) {
            Skeleton.flipPose(poses[0]);

            if (faceDetection && faceDetection.length > 0) {
                let face = Skeleton.toFaceFrame(faceDetection[0]);
                illustration.updateSkeleton(poses[0], face);
            } else {
                illustration.updateSkeleton(poses[0], null);
            }
            illustration.draw(canvasScope, videoWidth, videoHeight);

            if (guiState.debug.showIllustrationDebug) {
                illustration.debugDraw(canvasScope);
            }
        }


        canvasScope.project.activeLayer.scale(
            canvasWidth / videoWidth,
            canvasHeight / videoHeight,
            new canvasScope.Point(0, 0)
        );

        // End monitoring code for frames per second
        stats.end();

        requestAnimationFrame(poseDetectionFrame);
    }

    poseDetectionFrame();
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
    await parseSVG(Object.values(avatarSvgs)[1]);  // sets default SVG
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

    // setupGui([], posenet);
    // setupFPS();
    initWebRTCPeer();

    toggleLoadingUI(false);
    // detectPoseInRealTime(video, posenet);
    detectPoseInRealTime(video, false);
}

// drag and drop SVG
navigator.getUserMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia;
FileUtils.setDragDropHandler((result) => {
    parseSVG(result);
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

bindPage();