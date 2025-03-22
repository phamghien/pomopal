const startButton = document.getElementById("start");
const stopButton = document.getElementById("stop");
const resetButton = document.getElementById("reset");
const timer = document.getElementById("timer");

const video = document.getElementById('webcam');
const liveView = document.getElementById('liveView');
const demosSection = document.getElementById('demos');
const enableWebcamButton = document.getElementById('webcamButton');
let cocoModel = undefined;
let children = [];

document.getElementById("webcamButton").addEventListener("click", function () {
  document.querySelector(".camView").classList.toggle("active");
});

function getUserMediaSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

if (getUserMediaSupported()) {
  enableWebcamButton.addEventListener('click', enableCam);
} else {
  console.warn('getUserMedia() is not supported by your browser');
}

async function enableCam(event) {
  if (!cocoModel) {
    return;
  }

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

// Load model
Promise.all([cocoSsd.load()]).then(function ([coco]) {
  cocoModel = coco;
  demosSection.classList.remove('invisible');
});

function predictWebcam() {
  Promise.all([cocoModel.detect(video)]).then(function ([cocoPredictions]) {
    // Remove any highlighting from previous frames.
    children.forEach(child => liveView.removeChild(child));
    children = [];

    // Phone detection 
    cocoPredictions.forEach(prediction => {
      if (prediction.class === 'cell phone' && prediction.score > 0.5) {
        const p = document.createElement('p');
        p.innerText = `Phone detected`;
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

    window.requestAnimationFrame(predictWebcam);

  });
}


// Timer 
let timeLeft = 1500; 
let interval; 

const updateTimer = () => { 
  const minutes = Math.floor(timeLeft / 60); 
  const seconds = timeLeft % 60; 
  timer.innerHTML = `${minutes.toString().padStart(2,"0")}:${seconds.toString().padStart(2,"0")}`;

}

const startTimer = () => { 
  interval = setInterval(() => {
    timeLeft--; 
    updateTimer(); 

    if(timeLeft == 0) { 
      clearInterval(interval); 
      alert("Time's Up!"); 
      timeLeft = 1500; 
      updateTimer(); 
    }
  }, 1000);
}; 

const stopTimer = () => clearInterval(interval); 

const resetTimer = () => { 
  clearInterval(interval); 
  timeLeft = 1500; 
  updateTimer(); 
}

startButton.addEventListener("click", startTimer);
stopButton.addEventListener("click", stopTimer);
resetButton.addEventListener("click", resetTimer);

