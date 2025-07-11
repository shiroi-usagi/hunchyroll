<script lang="ts">
    import {onMount} from "svelte";
    import {browser} from "@wxt-dev/webextension-polyfill/browser";

    let error = $state('')
    let id: string | undefined = $state(undefined)
    let errTimeout: NodeJS.Timeout | number | undefined = $state(undefined)

    function reportError(err: any) {
        clearTimeout(errTimeout)
        error = `${err}`
        errTimeout = setTimeout(() => error = '', 5000)
    }

    function findIdInUrl(url: string): string | undefined {
        const segments = new URL(url).pathname.split('/');
        if (segments.length < 4 || segments[1] !== 'watch') {
            return undefined;
        }
        return segments[2];
    }

    function loadSubtitle(tabs: browser.Tabs.Tab[]) {
        tabs.forEach(tab => {
            if (tab.url) {
                id = findIdInUrl(tab.url)
            }
            if (tab.id) {
                browser.tabs.sendMessage(<number>tab.id, {
                    target: 'hunchyroll:load-subtitle',
                    lang: 'hu-HU',
                });
            }
        })
    }

    function loadId(tabs: browser.Tabs.Tab[]) {
        tabs.forEach(tab => {
            if (tab.url) {
                id = findIdInUrl(tab.url)
            }
        })
    }

    function onLoadClick() {
        browser.tabs
            .query({active: true, currentWindow: true})
            .then(loadSubtitle)
            .catch(reportError);
    }

    onMount(() => {
        browser.tabs
            .query({active: true, currentWindow: true})
            .then(loadId)
            .catch(reportError);
    })
</script>

<div>
    <h1>Hunchyroll</h1>
    {#if id}
        <p>
            {id}
            <button onclick="{onLoadClick}">Load</button>
        </p>
    {/if}
    {#if error}
        <p>
            {error}
        </p>
    {/if}
    <p>
        <a href="https://www.patreon.com/" target="_blank" rel="noopener noreferrer">Donate</a>
    </p>
</div>

<style>

</style>
