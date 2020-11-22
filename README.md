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

```
const { openBrowser, closeBrowser, click, goto, video } = require('taiko');

(async () => {
    try {
        await openBrowser();
        await video.startRecord('output/video.mp4');
        await goto('gauge.org');
        await click('Plugins');
        // more actions
        // ...
    } finally {
        await video.stopRecord();
        await closeBrowser();
    }
})();

```

Run script with:
```
taiko script.js
taiko script.js --plugin video //Use --plugin to load a plugin in case of multiple plugins.
```


## License

MIT
