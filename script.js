const { openBrowser, closeBrowser, click, goto, video } = require('taiko');
const { slowdownOutput } = require('./src');

(async () => {
  try {
    await openBrowser();
    await video.startRecording('output/video.mp4');
    await goto('https://www.google.com');
    await write('youtube')
    await click('google search');
    // more actions
    // ...
    await video.pauseRecording();
    // more actions that you don't want recorded
    // ...
    await video.resumeRecording();
    // more actions that you do want recorded
    // ...
  } finally {
    await video.stopRecording();
    await closeBrowser();
    await slowdownOutput('output/video.mp4','./');
  }
})();