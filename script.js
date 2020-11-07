const volume = document.getElementById('volume');
const bass = document.getElementById('bass');
const mid = document.getElementById('mid');
const treble = document.getElementById('treble');
const visualizer = document.getElementById('visualizer');

const context = new AudioContext()
const analyserNode = new AnalyserNode(context, {fftSize: 256}) //big number consolodates frequencies into larger bands
//halving numbers double the width
//doubling the numbers shrinks the width by half 
const gainNode  = new GainNode(context, {gain: volume.value})
const bassEQ  = new BiquadFilterNode(context, {
    type: 'lowshelf',
    frequency: 500,
    gain: bass.value
})
const midEQ  = new BiquadFilterNode(context, {
    type: 'peaking',
    Q: Math.SQRT1_2,
    frequency: 1500,
    gain: mid.value
})
const trebleEQ  = new BiquadFilterNode(context, {
    type: 'lowshelf',
    frequency: 3000,
    gain: treble.value
})
setupEventListeners()
setupContext();
resize();
drawVisualizer();

function setupEventListeners(){
    window.addEventListener('resize', resize);

    volume.addEventListener('input', e => {
        const value = parseFloat(e.target.value);
        gainNode.gain.setTargetAtTime(value, context.currentTime, 0.01);
    });

    bass.addEventListener('input', e => {
        const value = parseInt(e.target.value);
        bassEQ.gain.setTargetAtTime(value, context.currentTime, 0.01);
    });

    mid.addEventListener('input', e => {
        const value = parseInt(e.target.value);
        midEQ.gain.setTargetAtTime(value, context.currentTime, 0.01);
    });

    treble.addEventListener('input', e => {
        const value = parseInt(e.target.value);
        trebleEQ.gain.setTargetAtTime(value, context.currentTime, 0.01);
    });
}

async function setupContext(){
    const guitar = await getGuitar();
    if(context.state === 'suspended'){
        await context.resume();
    }
    const source = context.createMediaStreamSource(guitar); //gets audio source for the output
    
    source
        .connect(trebleEQ)
        .connect(midEQ)
        .connect(bassEQ)
        .connect(gainNode)
        .connect(analyserNode)
        .connect(context.destination) //connects it to computer's microphone
}

function getGuitar(){
    return navigator.mediaDevices.getUserMedia({
        audio: {
            echoCancellation: false,
            autoGainControl: false,
            noiseSuppression: false,
            latency: false
        }
    })
}

function drawVisualizer(){
    requestAnimationFrame(drawVisualizer)//loops through at 60 fps 

    const bufferLength = analyserNode.frequencyBinCount //number of frequencies measured

    const dataArray = new Uint8Array(bufferLength);

    analyserNode.getByteFrequencyData(dataArray);

    const width = visualizer.width;
    const height = visualizer.height;

    const barWidth = width / bufferLength

    const canvasContext = visualizer.getContext('2d');
    canvasContext.clearRect(0,0,width, height);

    dataArray.forEach((item, index) => {
        const y = item/255 *height /2 //255 is max value so its between 0 and 1
        const x = barWidth * index;

        canvasContext.fillStyle = `hsl(${y/ height *2* 200},100%, 50%)`; 
        canvasContext.fillRect(x, height - y, barWidth, y);
    })
}

function resize(){
    visualizer.width = visualizer.clientWidth * window.devicePixelRatio;
    visualizer.height = visualizer.clientHeight * window.devicePixelRatio;
}