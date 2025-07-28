function findIdInUrl(url: string): string | undefined {
    if (!url) {
        return undefined;
    }
    const segments = new URL(url).pathname.split('/');
    if (segments.length < 4 || segments[1] !== 'watch') {
        return undefined;
    }
    return segments[2];
}

export default defineBackground(() => {
    browser.runtime.onInstalled.addListener((details) => {
        browser.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [1408],
            addRules: [
                {
                    id: 1408,
                    priority: 1,
                    action: {
                        type: 'redirect',
                        redirect: {
                            url: `${import.meta.env.WXT_API_ADDR}/crunchy/bundle.js`
                        }
                    },
                    condition: {
                        urlFilter: '||static.crunchyroll.com/vilos-v2/web/vilos/js/bundle.js',
                    },
                }
            ],
        })
    });

    browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        switch (msg.action) {
            case 'who-am-i':
                if (sender.tab?.url) sendResponse(findIdInUrl(sender.tab.url))
                break
            case 'reload':
                if (sender.tab?.id) browser.tabs.reload(sender.tab.id)
                break
            default:
                console.error('background', 'unknown action', msg)
        }
    })
});
