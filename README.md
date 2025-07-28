# Hunchyroll

This project contains

- `hunchyroll-worker`, an API serving additional subtitle data for Crunchyroll's video player and an altered bundle.js; 
- `hunchyroll-ext`, a web extension that allows loading additional subtitle in Chrunchyroll's video player;

Effectively, these additional subtitles can use the exact same ASS renderer.

## For the kind people who are validating the web-extension

`hunchyroll-ext` is the extension. To build the source code, you will need `npm` or similar (`pnpm`, `yarn`, ...).

Ypu can simply create a bundle using `npm run build`, `npm run build:chrome`, or `npm run build:firefox`. The results will be included in the `.ouput/chrome-mv3` and `.ouput/firefox-mv3` directories respectively. These bundles will use the production server.

There is one tricky thing that explains the inclusion of the backend code `hunchyroll-worker`. The code redirects `https://static.crunchyroll.com/vilos-v2/web/vilos/js/bundle.js` to `https://hunchyroll.com/crunchy/bundle.js`. This could mean that the code can be potentially harmful. I included the code to demonstrate what it does exactly and added an explanation in [Accessing the worker](#Accessing-the-worker). However, regardless of my good intentions, I can understand if the extension is rejected.

## Legal

This project is licensed under the MIT License. Its source code is distributed under the [Firefox Add-on Distribution Agreement](https://extensionworkshop.com/documentation/publish/firefox-add-on-distribution-agreement/) and the [Google Chrome Web Store Developer Agreement](https://developer.chrome.com/docs/webstore/program-policies/terms).

## How does this work?

Let's take `https://www.crunchyroll.com/watch/GY0973WVY/the-talisman-woman` as an example.

The video, subtitle, and other details are loaded from `https://www.crunchyroll.com/playback/v3/GY0973WVY/web/chrome/play`. This endpoint requires http-only cookie authentication, therefore not possible to proxy, and modifying the response is not possible from a browser extension. At least, I was not able to find a way.

The video player runs in a `iframe` with the following source `https://static.crunchyroll.com/vilos-v2/web/vilos/player.html`. The content of this iframe is not available from the parent page.

The iframe loads `https://static.crunchyroll.com/vilos-v2/web/vilos/js/bundle.js` which is a webpack bundle. While the bundle initializes, it creates a [Web Worker] and this worker controls the player.

To load a subtitle, [postMessage] of the worker has to be called with a `target` property set to `set-track-by-url` and a `url` property set to the `ass` file URL.

### Accessing the worker

The runtime of the bundled script is not accessible from outside, but we can use the redirect functionality from a browser extension where we alter the script.

For the "redirect" we can use [declarativeNetRequest.updateDynamicRules]. We need to declare a `urlFilter` which is the endpoint we want to alter and a redirect `action` that tells where to redirect.

```js
const rule = {
    id: 1408,
    priority: 1,
    action: {
        type: "redirect",
        redirect: {
            url: "https://yum.example.com:8787/crunchy/bundle.js"
        }
    },
    condition: {
        urlFilter: "https://static.crunchyroll.com/vilos-v2/web/vilos/js/bundle.js",
    },
}
```

To alter the script, I used a regex-based replacement of `new Worker\(([^)]*)\)` with `(() => {const w = new Worker($1); window.hunchyrollWorker = w; return w})()`. Note: A more sophisticated alteration could be added to make sure we never break the script e.g., md5 hashing, js validation, inplace replace.

```js
let text = await resp.text()
    .then(v => (v.replaceAll(/new Worker\(([^)]*)\)/g, `(() => {const w = new Worker($1); window.hunchyrollWorker = w; return w})()`)))
```

### Calling the worker

After making the worker available, it's still not accessible directly from a content script. For this we need to inject additional JS, and we need a way to communicate with it.

To signal loading a subtitle, we need a way to signal the site script from the browser. For this, we can inject a script that listens to [CustomEvent]s and triggers them, and we can do the same from the content script.

Then it is as simple as:

```js
worker.postMessage({
    target: 'set-track-by-url',
    url: e.detail.url,
})
```

### Accessing the video ID

Accessing the video ID is not an easy job either. Finding an ID in `https://www.crunchyroll.com/watch/GY0973WVY/the-talisman-woman` URL can be done with a simple split command, but the iframe `https://static.crunchyroll.com/vilos-v2/web/vilos/player.html` in the URL. We have no access to the parent page from the iframe even from injected code.

The trick here is to send a message to a backend script which can identify the tab where the message originates from, and from the sender, we can get the tab's url. Once we have that, we can respond with the ID (`GY0973WVY`) and call the API from the content script.

[Web Worker]: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API
[postMessage]: https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage
[declarativeNetRequest.updateDynamicRules]: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/declarativeNetRequest/updateDynamicRules
[CustomEvent]: https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent
