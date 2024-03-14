const startButton = document.getElementById("start");
const stopButton = document.getElementById("stop");
const resetButton = document.getElementById("reset");
const video = document.getElementById('webcam');
const liveView = document.getElementById('liveView');
const demosSection = document.getElementById('demos');
const enableWebcamButton = document.getElementById('webcamButton');
let cocoModel = undefined;
let posenetModel = undefined;
let children = [];

function getUserMediaSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

if (getUserMediaSupported()) {
  enableWebcamButton.addEventListener('click', enableCam);
} else {
  console.warn('getUserMedia() is not supported by your browser');
}

async function enableCam(event) {
  if (!cocoModel || !posenetModel) {
    return;
  }

  event.target.classList.add('removed');

  const constraints = {
    video: true
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    video.addEventListener('loadeddata', predictWebcam);
  } catch (error) {
    console.error('Error accessing webcam:', error);
  }
}

// Load models
Promise.all([cocoSsd.load(), posenet.load()]).then(function ([coco, posenet]) {
  cocoModel = coco;
  posenetModel = posenet;
  demosSection.classList.remove('invisible');
});

function predictWebcam() {
  Promise.all([cocoModel.detect(video), posenetModel.estimateMultiplePoses(video)]).then(function ([cocoPredictions, poses]) {
    // Remove any highlighting from previous frames.
    children.forEach(child => liveView.removeChild(child));
    children = [];

    // Phone detection 
    cocoPredictions.forEach(prediction => {
      if (prediction.class === 'cell phone' && prediction.score > 0.5) {
        const p = document.createElement('p');
        p.innerText = `${prediction.class} - with ${Math.round(parseFloat(prediction.score) * 100)}% confidence.`;
        p.style = `margin-left: ${prediction.bbox[0]}px; margin-top: ${prediction.bbox[1] - 10}px; width: ${prediction.bbox[2] - 10}px; top: 0; left: 0;`;

        const highlighter = document.createElement('div');
        highlighter.setAttribute('class', 'highlighter');
        highlighter.style = `left: ${prediction.bbox[0]}px; top: ${prediction.bbox[1]}px; width: ${prediction.bbox[2]}px; height: ${prediction.bbox[3]}px;`;

        liveView.appendChild(highlighter);
        liveView.appendChild(p);
        children.push(highlighter);
        children.push(p);
      }
    });

    // Posture detection
    poses.forEach(pose => {
      pose.keypoints.forEach(keypoint => {
        if (keypoint.score > 0.5) {
          if(keypoint.part == 'nose' || keypoint.part == 'leftEye' || keypoint.part == 'rightEye' || keypoint.part == 'leftShoulder' || keypoint.part == 'rightShoulder' || keypoint.part == 'leftEar' || keypoint.part == 'rightEar') {
            const { y, x } = keypoint.position;
            const circle = document.createElement('div');
            circle.classList.add('keypoint');
            circle.style.left = `${x}px`;
            circle.style.top = `${y}px`;
            liveView.appendChild(circle);
            children.push(circle);
          }
        }
      });
    });

    window.requestAnimationFrame(predictWebcam);
  });
}


function startTimer() {
  console.log("start");
}

function stopTimer() {
  console.log("stop");
}

function resetTimer() {
  console.log("reset");
}

startButton.addEventListener("click", startTimer);
stopButton.addEventListener("click", stopTimer);
resetButton.addEventListener("click", resetTimer);
