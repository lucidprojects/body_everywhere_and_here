# Pose Animator Peer to Peer
Adaptation of [Pose Animator](https://github.com/yemount/pose-animator) modified to allow for peer 2 peer connection via simplepeer.js.

## How To:
### For local client:
Run local Signal express-server from the command line from https://github.com/lisajamhoury/WebRTC-Simple-Peer-Examples

```npm run watch```

In separate terminal navigate run yarn run watch from pose-animator directory

```yarn run```

Navigate to 

```localhost:1234``` (unless port is already in use)


Expose local signal server with [ngrok](https://ngrok.com)

```./ngrok http 80```

### For remote client:
In index.js modify the initWebRTCPeer() func and update initSocketClient with the ngrok address.

Update import call to from webrtc_peer_client import to "./utils/webrtc_peer_client_no_turn.js";

Run Yarn build locally or remote to build out remote peer client files.   

```yarn build```

If ran locally, ftp files to remote server or glitch.  If on remote server run remote express server with 

```node app.js```

Navigate to your secure domain

```https://securedomain.com```


# From Pose Animator README
## Platform support

Demos are supported on Desktop Chrome and iOS Safari.

It should also run on Chrome on Android and potentially more Android mobile browsers though support has not been tested yet.

# Animate your own design

1. Download the [sample skeleton SVG here](https://github.com/yemount/pose-animator/blob/master/resources/samples/skeleton.svg).
1. Create a new file in your vector graphics editor of choice. Copy the group named ‘skeleton’ from the above file into your working file. Note: 
	* Do not add, remove or rename the joints (circles) in this group. Pose Animator relies on these named paths to read the skeleton’s initial position. Missing joints will cause errors.
	* However you can move the joints around to embed them into your illustration. See step 4.
1. Create a new group and name it ‘illustration’, next to the ‘skeleton’ group. This is the group where you can put all the paths for your illustration.
    * Flatten all subgroups so that ‘illustration’ only contains path elements.
    * Composite paths are not supported at the moment.
    * The working file structure should look like this:
	```
        [Layer 1]
        |---- skeleton
        |---- illustration
              |---- path 1
              |---- path 2
              |---- path 3
	```
1. Embed the sample skeleton in ‘skeleton’ group into your illustration by moving the joints around.
1. Export the file as an SVG file.
1. Open [Pose Animator p2p](https://github.com/lucidprojects/body_everywhere_and_here/tree/master/pose-animator-p2p/index.html). Once everything loads, drop your custom SVG into either the local or peer posenet windows. You should be able to see it come to life :D
