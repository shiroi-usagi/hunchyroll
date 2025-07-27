interface Subtitle {
    lang: string,
    url: string,
}

interface ContentState {
    id: string | null,
    siteScriptReady: boolean,
    subtitles: Subtitle[],
    lang: string | null,
    error?: string,
}

class State implements ContentState {
    id: string | null = null
    siteScriptReady: boolean = false
    subtitles: Subtitle[] = []
    error?: string

    public set lang(lang: string | null) {
        if (!lang) {
            localStorage.removeItem('hunchyroll:lang')
            // browser.storage.local.remove('hunchyroll:lang')
        } else {
            localStorage.setItem('hunchyroll:lang', lang)
            // browser.storage.local.set({['hunchyroll:lang']: lang})
        }
    }
    public get lang() {
        // return browser.storage.local.get('hunchyroll:lang')
        return localStorage.getItem('hunchyroll:lang')
    }
}

export default defineContentScript({
    matches: ['https://static.crunchyroll.com/*'],
    allFrames: true,
    async main(ctx) {
        let state = new State()

        function loadSubtitle(lang: string) {
            if (!state.siteScriptReady) {
                return
            }
            const subtitle = state.subtitles.find(v => v.lang == lang)
            if (!subtitle) {
                return
            }
            state.lang = lang
            window.postMessage({
                target: 'hunchyroll:site',
                action: 'load-subtitle',
                url: subtitle.url,
            })
        }

        function disableSubtitle() {
            state.lang = null
            browser.runtime.sendMessage({
                action: 'reload'
            })
        }

        function loadDefaultSubtitle() {
            const lang = localStorage.getItem('hunchyroll:lang')
            if (lang) {
                loadSubtitle(lang)
            }
        }

        const ports: Browser.runtime.Port[] = []
        browser.runtime.onConnect.addListener(port => {
            ports.push(port)
            port.onDisconnect.addListener(() => {
                let i = ports.findIndex(p => p === port)
                ports.splice(i, 1)
            })
            port.postMessage({
                action: 'content:state',
                state: {
                    id: state.id,
                    subtitles: state.subtitles,
                    lang: state.lang,
                },
            })
        })

        browser.runtime.sendMessage({
            action: 'who-am-i',
        }).then(async id => {
            const resp = await fetch(`${import.meta.env.WXT_APP_ADDR}/crunchy/${id}`, {signal: ctx.signal})
            const body = await resp.json()
            if (!resp.ok) {
                state.error = body.error
                return
            }
            state.id = id
            state.subtitles = body.items
        }).catch((e) => {
            console.error('Hunchyroll:content', 'who-am-i error', e)
            state.error = String(e)
        }).then(() => {
            loadDefaultSubtitle()
        })

        browser.runtime.onMessage.addListener((msg) => {
            console.debug('Hunchyroll:content', 'onMessage', msg)
            switch (msg.action) {
                case 'hunchyroll:load-subtitle':
                    loadSubtitle(msg.lang)
                    break
                case 'hunchyroll:disable-subtitle':
                    disableSubtitle()
                    break
                default:
                    console.error('Hunchyroll:content', 'unknown action', msg)
            }
        })

        window.addEventListener('message', (e) => {
            if (typeof e.data !== 'object' || e.data.target !== 'hunchyroll:content') {
                return
            }
            const msg = e.data
            switch (msg.action) {
                case 'site:init':
                    state.siteScriptReady = true
                    loadDefaultSubtitle()
                    break
                default:
                    console.error('Hunchyroll:content', 'unknown action', msg)
            }
        })

        injectScript('/site.js', {keepInDom: false}).then().catch(console.error)
    },
})
