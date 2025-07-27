interface Subtitle {
    lang: string,
    url: string,
}

interface ContentState {
    enabled: boolean,
    id: string | null,
    siteScriptReady: boolean,
    subtitles: Subtitle[],
    lang: string | null,
    error?: string,
}

class State implements ContentState {
    enabled: boolean = false
    id: string | null = null
    siteScriptReady: boolean = false
    subtitles: Subtitle[] = []
    lang: string | null = null
    error?: string
}

export default defineContentScript({
    matches: ['https://static.crunchyroll.com/*'],
    allFrames: true,
    async main(ctx) {
        let state = new State()

        function loadSubtitle(lang: string | null) {
            if (!lang || !state.siteScriptReady) {
                return
            }
            const subtitle = state.subtitles.find(v => v.lang == lang)
            if (!subtitle) {
                return
            }
            window.postMessage({
                target: 'hunchyroll:site',
                action: 'load-subtitle',
                url: subtitle.url,
            })
        }

        function disableSubtitle() {
            browser.runtime.sendMessage({
                action: 'reload'
            })
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
            if (state.lang) loadSubtitle(state.lang)
        })

        window.addEventListener('message', (e) => {
            if (typeof e.data !== 'object' || e.data.target !== 'hunchyroll:content') {
                return
            }
            const msg = e.data
            switch (msg.action) {
                case 'site:init':
                    state.siteScriptReady = true
                    if (state.lang) loadSubtitle(state.lang)
                    break
                default:
                    console.error('Hunchyroll:content', 'unknown action', msg)
            }
        })

        injectScript('/site.js', {keepInDom: false}).then().catch(console.error)

        browser.storage.local.onChanged.addListener((changes) => {
            if (changes.lang) {
                state.lang = changes.lang.newValue || null
            }
            if (changes.enabled) {
                state.enabled = changes.enabled.newValue || false
            }

            if (state.enabled && state.lang) {
                loadSubtitle(state.lang)
            } else if (changes.enabled && !state.enabled) {
                disableSubtitle()
            }
        })

        console.log('Hunchyroll:content', 'before local.get')
        browser.storage.local.get({enabled: false, lang: null}).then(v => {
            state.enabled = v.enabled
            state.lang = v.lang

            if (state.enabled && state.lang) {
                loadSubtitle(state.lang)
            }
        })
    },
})
