const fs = require('fs');
const path = require('path');
const spawn = require('child_process').spawn;
const sprintf = require('sprintf-js').sprintf;

const CAPTURE_OPTIONS = {
  format: 'jpeg',   // jpeg or png
  quality: 80,      // compression quality 0 ~ 100
  maxWidth: 1280,
  maxHeight: 720,
};

const plugin = {
  client: null,
  deviceHeight: 0,
  deviceWidth: 0,
  eventHandler: null,
  filePath: null,
  frames: [],
};

const mkdir = (path) => {
  if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive: true });
};

const start = async (filePath) => {
  if (path.extname(filePath) !== '.mp4') throw new Error('Output file should have a .mp4 extension.');

  mkdir(path.dirname(filePath));

  plugin.filePath = filePath;

  plugin.client.on('Page.screencastFrame', frame => {
    plugin.client.send('Page.screencastFrameAck', { sessionId: frame.sessionId });
    plugin.deviceWidth = frame.metadata.deviceWidth;
    plugin.deviceHeight = frame.metadata.deviceHeight;
    plugin.frames.push(frame.data);
  });

  plugin.eventHandler.once('createdSession', client => {
    plugin.client = client;
    start(filePath);
  });

  await resume();
};

const pause = async () => {
  await plugin.client.send('Page.stopScreencast');
};

const resume = async () => {
  await plugin.client.send('Page.startScreencast', CAPTURE_OPTIONS);
};

const stop = async () => {
  // This is required so the screencast doesn't stop prematurely.
  await new Promise(resolve => setTimeout(resolve, 500));
  await pause();

  // Save frame as images first.
  const filename = path.basename(plugin.filePath);
  const basename = filename.substring(0, filename.length - 4);
  const directory = path.dirname(plugin.filePath);
  for (const [ index, base64Data ] of plugin.frames.entries()) {
    const imagePath = sprintf('%s/%s%03d.%s', directory, basename, index + 1, CAPTURE_OPTIONS.format);
    fs.writeFile(imagePath, base64Data, 'base64', error => {
      if (error) console.error(error);
    });
  }

  // Create a mp4 movie out of the image frames.
  const cmd = '/usr/local/bin/ffmpeg';
  const args = [
    '-y',
    '-i', sprintf('%s/%s%%03d.%s', directory, basename, CAPTURE_OPTIONS.format),
    '-s', sprintf('%dx%d', CAPTURE_OPTIONS.maxWidth, CAPTURE_OPTIONS.maxHeight),
    '-codec:a', 'aac',
    '-b:a', '44.1k',
    '-r', '15',
    '-b:v', '1000k',
    '-c:v', 'h264',
    '-f', 'mp4',
    plugin.filePath,
  ];
  const proc = spawn(cmd, args);

  if (process.env.DEBUG) {
    proc.stdout.on('data', data => console.log(data));
    proc.stderr.setEncoding('utf8');
    proc.stderr.on('data', data => console.log(data));
  }

  // Delete the images upon building a movie successfully.
  proc.on('close', () => {
    const regEx = new RegExp(sprintf('%s\\d{3}\\.%s', basename, CAPTURE_OPTIONS.format), 'i');
    fs.readdirSync(directory)
      .filter(file => regEx.test(file))
      .map(file => fs.unlinkSync(sprintf('%s/%s', directory, file)));
  });
};

const clientHandler = async (taiko, eventHandler) => {
  plugin.eventHandler = eventHandler;
  plugin.eventHandler.on('createdSession', () => {
    plugin.client = taiko.client();
  });
};

module.exports = {
  ID: 'video',
  init: clientHandler,
  startRecording: start,
  pauseRecording: pause,
  resumeRecording: resume,
  stopRecording: stop,
};
