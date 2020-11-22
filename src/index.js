const fs = require('fs');
const path = require('path');
const sprintf = require('sprintf-js').sprintf;

const CAPTURE_OPTIONS = {
  format: 'jpeg',   // jpeg or png
  quality: 80,      // compression quality 0 ~ 100
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

const clientHandler = async (taiko, eventHandler) => {
  plugin.eventHandler = eventHandler;
  plugin.eventHandler.on('createdSession', () => {
    plugin.client = taiko.client();
  });
};

const start = async (filePath) => {
  if (path.extname(filePath) !== 'mp4') throw new Error('Output file should have a .mp4 extension.');

  mkdir(path.dirname(filePath));

  plugin.filePath = filePath;

  plugin.client.on('Path.screencastFrame', frame => {
    plugin.client.send('Page.screencastFrameAck', { sessionId: frame.sessionId });
    plugin.deviceWidth = frame.metadata.deviceWidth;
    plugin.deviceHeight = frame.metadata.deviceHeight;
    plugin.frames.push(frame.data);
  });

  plugin.eventHandler.once('createSession', client => {
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

  const baseName = path.basename(plugin.filePath);
  const directory = path.dirname(plugin.filePath);

  for (const [ index, base64Data ] of plugin.frames.entries()) {
    const imagePath = sprintf('%s/%s%03d.%s',
      directory, baseName, index + 1, CAPTURE_OPTIONS.format,
    );
    fs.writeFile(imagePath, base64Data, 'base64', error => {
      console.log(error);
    });
  }
};

module.exports = {
  ID: 'video',
  init: clientHandler,
  startRecording: start,
  pauseRecording: pause,
  resumeRecording: resume,
  stopRecording: stop,
};
