<script lang="ts">
    import {onMount} from "svelte";
    import {browser} from "@wxt-dev/webextension-polyfill/browser";

    let error = $state('')
    const lang = 'hu-HU'

    let errTimeout: NodeJS.Timeout | undefined = $state(undefined)
    function reportError(err: any) {
        clearTimeout(errTimeout)
        error = `${err}`
        errTimeout = setTimeout(() => error = '', 5000)
    }

    function disableSubtitle(tabs: browser.Tabs.Tab[]) {
        browser.storage.local.remove(['enabled'])
    }

    function loadSubtitle(tabs: browser.Tabs.Tab[], lang: string) {
        browser.storage.local.set({lang: lang, enabled: true})
    }

    let enabled: boolean = $state(false)
    let ports = $state([] as Browser.runtime.Port[])
    let subtitles = $state([] as { lang: string, url: string }[])

    function connect(tabs: browser.Tabs.Tab[]) {
        tabs.forEach(tab => {
            if (tab.id === undefined
                || !(tab?.url || '').startsWith('https://www.crunchyroll.com/watch/')
                || ports.find(p => p.sender?.tab?.id === tab.id) // remove if we already have
            ) {
                return
            }
            const port: Browser.runtime.Port = browser.tabs.connect(tab.id, {
                name: 'hunchyroll:popup',
            })
            ports.push(port)
            port.onDisconnect.addListener(() => {
                const i = ports.findIndex(p => p === port)
                ports.splice(i, 1)
            })
            port.onMessage.addListener(msg => {
                switch (msg.action) {
                    case 'content:state':
                        subtitles = msg.state.subtitles
                        enabled = !!msg.state.lang
                }
            })
        })
        return false
    }

    function onToggleClick(e: Event & { currentTarget: HTMLInputElement }) {
        if (e.currentTarget.checked) {
            browser.tabs
                .query({active: true, currentWindow: true})
                .then((tabs: browser.Tabs.Tab[]) => loadSubtitle(tabs, lang))
                .catch(reportError);
            return
        }
        browser.tabs
            .query({active: true, currentWindow: true})
            .then(disableSubtitle)
            .catch(reportError);
    }

    let debounceTimeout: NodeJS.Timeout | undefined = $state(undefined)

    function onUpdated(tabId: number, changeInfo: browser.tabs.TabChangeInfo, tab: browser.tabs.Tab) {
        clearTimeout(debounceTimeout)
        debounceTimeout = setTimeout(() => (connect([tab])), 300)
    }

    onMount(() => {
        browser.tabs
            .query({active: true, currentWindow: true})
            .then(connect)
            .catch(reportError);

        // Only Firefox supports filters as of writing this code.
        // See https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/onUpdated#browser_compatibility
        if (import.meta.env.BROWSER === 'firefox') {
            browser.tabs.onUpdated.addListener(onUpdated, {
                urls: ['https://www.crunchyroll.com/watch/*'],
            })
        } else {
            browser.tabs.onUpdated.addListener(onUpdated)
        }

        return () => {
            browser.tabs.onUpdated.removeEventListener(onUpdated)
        }
    })
</script>

<div>
    <h1>Hunchyroll</h1>
    {#if !ports.length}
        <p>
            {browser.i18n.getMessage('no_ports')}
        </p>
    {:else if !subtitles.length}
        <p>
            {browser.i18n.getMessage('no_subtitles')}
        </p>
    {:else if error}
        <p>
            {error}
        </p>
    {:else}
        <p>
            <input class="switch" type="checkbox" bind:checked={enabled} onchange={onToggleClick}>
        </p>
    {/if}
    <p>
        <a href="https://www.patreon.com/" target="_blank" rel="noopener noreferrer">Donate</a>
    </p>
</div>

<style>
    .switch {
        position: relative;
        height: 1.5rem;
        width: 3rem;
        cursor: pointer;
        appearance: none;
        -webkit-appearance: none;
        border-radius: 1.5rem;
        background-color: rgba(100, 116, 139, 0.377);
        transition: all .3s ease;
    }

    .switch:checked {
        background-color: rgba(236, 72, 153, 1);
    }

    .switch::before {
        position: absolute;
        content: "";
        left: -0.1rem;
        top: -0.1rem;
        display: block;
        height: 1.6rem;
        width: 1.6rem;
        cursor: pointer;
        border: 1px solid rgba(100, 116, 139, 0.527);
        border-radius: 1.6rem;
        background-color: rgba(255, 255, 255, 1);
        box-shadow: 0 3px 10px rgba(100, 116, 139, 0.327);
        transition: all .3s ease;
    }

    .switch:hover::before {
        box-shadow: 0 0 0 8px rgba(0, 0, 0, .15)
    }

    .switch:checked:hover::before {
        box-shadow: 0 0 0 8px rgba(236, 72, 153, .15)
    }

    .switch:checked:before {
        transform: translateX(100%);
        border-color: rgba(236, 72, 153, 1);
    }
</style>
