# Taiko Video Plugin

A plugin to record mp4 video of a [taiko](https://github.com/getgauge/taiko) script run.

## Install

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
