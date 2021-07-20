const once = require('events').once;
const fs = require('fs');
const path = require('path');
const spawn = require('child_process').spawn;

const CAPTURE_OPTIONS = {
  format: 'jpeg',   // jpeg or png
  quality: 80,      // compression quality 0 ~ 100
  maxWidth: 1280,
  maxHeight: 720,
};
const IMAGE_DIGITS = 4;

const plugin = {
  client: null,
  deviceHeight: 0,
  deviceWidth: 0,
  eventHandler: null,
  filePath: null,
  frames: [],
  active: false,
};

const mkdir = (path) => {
  if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive: true });
};

const zeroPad = (number, digits = IMAGE_DIGITS) => {
  const nDigits = Math.ceil(Math.log10(number + 1));
  return '0'.repeat(digits - nDigits) + number;
};

const frameHandler = frame => {
  if (!plugin.active) return;
  plugin.client.send('Page.screencastFrameAck', { sessionId: frame.sessionId });
  plugin.deviceWidth = frame.metadata.deviceWidth;
  plugin.deviceHeight = frame.metadata.deviceHeight;
  plugin.frames.push(frame.data);
};

const start = async (filePath) => {
  if (path.extname(filePath) !== '.mp4') throw new Error('Output file should have a .mp4 extension.');

  mkdir(path.dirname(filePath));

  plugin.filePath = filePath;
  plugin.active = true;
  plugin.client.on('Page.screencastFrame', frameHandler);

  await resume();
};

const pause = async () => {
  await plugin.client.send('Page.stopScreencast');
};

const resume = async () => {
  await plugin.client.send('Page.startScreencast', CAPTURE_OPTIONS);
};

const stop = async () => {
  await pause();

  plugin.active = false;

  // Save frame as images first.
  const filename = path.basename(plugin.filePath);
  const basename = filename.substring(0, filename.length - 4);
  const directory = path.dirname(plugin.filePath);
  for (const [index, base64Data] of plugin.frames.entries()) {
    const imagePath = `${directory}/${basename}${zeroPad(index + 1)}.${CAPTURE_OPTIONS.format}`;
    try {
      fs.writeFileSync(imagePath, base64Data, 'base64');
    } catch (err) {
      console.error(err);
    }
  }

  // Clear out the frame buffer.
  plugin.frames = [];

  // Create a mp4 movie out of the image frames.
  const cmd = 'ffmpeg';
  const args = [
    '-y',
    '-i', `${directory}/${basename}%0${IMAGE_DIGITS}d.${CAPTURE_OPTIONS.format}`,
    '-s', `${CAPTURE_OPTIONS.maxWidth}x${CAPTURE_OPTIONS.maxHeight}`,
    '-codec:a', 'aac',
    '-b:a', '44.1k',
    '-b:v', '1000k',
    '-c:v', 'h264',
    '-f', 'mp4',
    plugin.filePath,
  ];
  const proc = spawn(cmd, args);

  if (process.env.DEBUG) {
    proc.stdout.on('data', data => console.log(data));
    proc.stderr.setEncoding('utf8');
    proc.stderr.on('data', data => console.error(data));
  }

  await once(proc, 'close');

  // Delete the images upon building a movie successfully.
  const regEx = new RegExp(`${basename}\\d{${IMAGE_DIGITS}}\\.${CAPTURE_OPTIONS.format}`, 'i');
  fs.readdirSync(directory)
    .filter(file => regEx.test(file))
    .map(file => fs.unlinkSync(`${directory}/${file}`));

};

const clientHandler = async (taiko, eventHandler) => {
  plugin.eventHandler = eventHandler;
  plugin.eventHandler.on('createdSession', async () => {
    if (plugin.client) return;
    plugin.client = await taiko.client();
  });
};

const slowdownVideo = async (videoPath, outputDir, fps) => {
  const args = [
    '-y',
    '-i', videoPath,
    '-vf', 'setpts=N/(' + fps + '*TB)',
    outputDir + videoPath.substring(videoPath.lastIndexOf('/'))
  ];

  const proc = spawn('ffmpeg', args);

  await once(proc, 'close');
}

module.exports = {
  ID: 'video',
  init: clientHandler,
  startRecording: start,
  pauseRecording: pause,
  resumeRecording: resume,
  stopRecording: stop,
  slowdownRecording: slowdownVideo,
};
