interface State {
    ready: boolean,
    subtitles: { lang: string, url: string }[],
    error?: string
    loaded?: string,
}

export default defineContentScript({
    matches: ['https://static.crunchyroll.com/*'],
    allFrames: true,
    main(ctx) {
        console.log('content script is ready')
        let state: State = {
            ready: false,
            subtitles: [],
        };

        function loadSubtitle(lang: string) {
            console.log('loadSubtitle', state, lang)
            if (!state.ready || state.loaded == lang) {
                return
            }
            const subtitle = state.subtitles.find(v => v.lang == lang)
            if (!subtitle) {
                return
            }
            state.loaded = lang
            localStorage.setItem('hunchyroll:lang', lang)
            document.dispatchEvent(new CustomEvent('hunchyroll:site', {
                detail: {target: 'load-subtitle', url: subtitle.url}
            }));
        }

        function loadDefaultSubtitle() {
            const lang = localStorage.getItem('hunchyroll:lang');
            if (lang) {
                loadSubtitle(lang)
            }
        }

        browser.runtime.sendMessage({
            target: 'who-am-i',
        }).then(id => (fetch(`https://yum.example.com:8787/crunchy/${id}`, {signal: ctx.signal})))
            .catch(ctx => state.error = ctx.message)
            .then(resp => {
                resp.json().then((body: any) => {
                    if (!resp.ok) {
                        state.error = body.error
                        return
                    }
                    state.subtitles = body.items
                    loadDefaultSubtitle();
                })
            })

        browser.runtime.onMessage.addListener((msg) => {
            switch (msg.target) {
                case 'hunchyroll:load-subtitle':
                    console.log('hunchyroll:load-subtitle', msg)
                    loadSubtitle(msg.lang)
                    break
                default:
                    console.error('content', 'unknown target', msg)
            }
        });

        document.addEventListener('hunchyroll:content', (e) => {
            if (!(e instanceof CustomEvent)) {
                return
            }
            const msg = e.detail;
            switch (msg.target) {
                case 'ready':
                    state.ready = true
                    loadDefaultSubtitle()
                    break
                default:
                    console.error('hunchyroll:content', 'unknown target', msg)
            }
        })

        injectScript('/site.js', {keepInDom: false})
    },
});
