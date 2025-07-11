# Hunchyroll

## How does this work?

Let's take `https://www.crunchyroll.com/watch/G9DUE19E9/operation-strix` as an example.

The video, subtitle, and other details are loaded from `https://www.crunchyroll.com/playback/v3/G9DUE19E9/web/chrome/play`. This endpoint requires authentication, therefore a bit tricky to access, and modifying the response is not possible from a browser extension.

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

[Web Worker]: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API
[postMessage]: https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage
[declarativeNetRequest.updateDynamicRules]: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/declarativeNetRequest/updateDynamicRules
[CustomEvent]: https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent
