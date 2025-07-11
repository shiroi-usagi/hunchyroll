export default defineUnlistedScript(() => {
    console.log('site script is ready')

    let worker: Worker | undefined = undefined

    function initWorker(w: Worker = worker!) {
        worker = w
        document.dispatchEvent(new CustomEvent('hunchyroll:content', {
            detail: {target: 'ready'}
        }));
    }

    document.addEventListener('hunchyroll:site', (e) => {
        if (!(e instanceof CustomEvent)) {
            return
        }
        if (!worker) {
            console.error('hunchyroll:site', 'worker not ready')
            return
        }
        switch (e.detail.target) {
            case 'load-subtitle':
                worker.postMessage({
                    target: 'set-track-by-url',
                    url: e.detail.url,
                })
                break
            default:
                console.error('hunchyroll:site', 'unknown target', e.detail)
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
