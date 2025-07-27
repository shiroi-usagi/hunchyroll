export default defineUnlistedScript(() => {
    let worker: Worker | undefined = undefined

    function initWorker(w: Worker = worker!) {
        worker = w
        window.postMessage({
            target: 'hunchyroll:content',
            action: 'site:init',
        });
    }

    window.addEventListener('message', (e) => {
        if (typeof e.data !== 'object' || e.data.target !== 'hunchyroll:site') {
            return
        }
        if (!worker) {
            console.error('Hunchyroll', 'hunchyroll:site', 'worker not ready')
            return
        }
        const msg = e.data;
        switch (msg.action) {
            case 'load-subtitle':
                worker.postMessage({
                    target: 'set-track-by-url',
                    url: msg.url,
                })
                break
            default:
                console.error('Hunchyroll', 'hunchyroll:site', 'unknown action')
        }
    })

    if (window.hunchyrollWorker) {
        initWorker(window.hunchyrollWorker)
    } else {
        const interval = setInterval(() => {
            if (!window.hunchyrollWorker) {
                return;
            }
            initWorker(window.hunchyrollWorker)
            clearInterval(interval)
        }, 10);
    }
});
