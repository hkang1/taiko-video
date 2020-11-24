# Taiko Video Plugin

A plugin to record mp4 video of a [taiko](https://github.com/getgauge/taiko) script run.


## Install ffmpeg Dependency

This plugin uses [ffmpeg](https://github.com/FFmpeg/FFmpeg) to compress the images into an `mp4` video using the `h264` compression algorithm, so it'll require `ffmpeg` to be available from the command line. So of the common ways to install it are listed below:

### Mac OS X

```sh
brew install ffmpeg
```

### Ubuntu 

```sh
sudo apt install ffmpeg
```

### CentOS

```sh
sudo yum install ffmpeg
```

### Windows 10

Download the installer at the [Official Site](https://ffmpeg.org/download.html)


## Install Taiko Video Plugin

```
npm install --save-dev taiko-video
```


## Example

Add this script in a file `script.js`.

```js
const { openBrowser, closeBrowser, click, goto, video } = require('taiko');

(async () => {
  try {
    await openBrowser();
    await video.startRecording('output/video.mp4');
    await goto('https://www.linkedin.com/in/caleb-kang-8493651/');
    await click('Plugins');
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
  }
})();

```

Run script with:
```
taiko script.js --plugin video
```

## API

These are the 4 available API functions.

```js
video.startRecording('path/to/movie.mp4');
video.pauseRecording();
video.resumeRecording();
video.stopRecording();
```

`video.startRecording` must have an output movie file specified with a `.mp4` extension.

## License

MIT
