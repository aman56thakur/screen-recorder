const { writeFile } = require('fs')
const { desktopCapturer, remote } = require('electron')

const { dialog, Menu } = remote
let mediaRecorder
const recordedChunks = []

// Elements
const videoElement = document.querySelector('video')
const startBtn = document.getElementById('startBtn')
const videoSelectBtn = document.getElementById('videoSelectBtn')
const stopBtn = document.getElementById('stopBtn')

startBtn.onclick = (e) => {
  mediaRecorder.start()
  startBtn.classList.add('is-danger')
  startBtn.innerText = 'Recording'
  videoSelectBtn.disabled = true
}

stopBtn.onclick = (e) => {
  mediaRecorder.stop()
  startBtn.classList.remove('is-danger')
  startBtn.innerText = 'Start'
  videoSelectBtn.disabled = false
}

videoSelectBtn.onclick = getVideoSources

// Change video source
async function getVideoSources() {
  const inputSources = await desktopCapturer.getSources({
    types: ['window', 'screen'],
  })
  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map((source) => {
      return {
        label: source.name,
        click: () => selectSource(source),
      }
    })
  )
  videoOptionsMenu.popup({
    window: remote.getCurrentWindow(),
    x: 250,
    y: 190,
  })
}

async function selectSource(source) {
  videoSelectBtn.innerText = source.name
  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: source.id,
      },
    },
  }

  // Create a stream
  const stream = await navigator.mediaDevices.getUserMedia(constraints)

  // Preview the source
  videoElement.srcObject = stream
  videoElement.play()

  // Create Media recorder
  const options = { mimeType: 'video/webm; codecs=vp9' }
  mediaRecorder = new MediaRecorder(stream, options)

  // Event Handlers
  mediaRecorder.ondataavailable = handleDataAvailable
  mediaRecorder.onstop = handleStop
}

// Capture all recorded chunks
function handleDataAvailable(e) {
  console.log('video data availble')
  recordedChunks.push(e.data)
}

// Save video on stop
async function handleStop(e) {
  const blob = new Blob(recordedChunks, { type: 'video/webm; codecs=vp9' })
  const buffer = Buffer.from(await blob.arrayBuffer())
  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: 'Save Video',
    defaultPath: `Recording-${Date.now()}.webm`,
  })
  if (filePath)
    writeFile(filePath, buffer, () => console.log('Video saved successfully!'))
}
