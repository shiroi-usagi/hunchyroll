function findIdInUrl(url: string): string | undefined {
    const segments = new URL(url).pathname.split('/');
    if (segments.length < 4 || segments[1] !== 'watch') {
        return undefined;
    }
    return segments[2];
}

export default defineBackground(() => {
    browser.runtime.onInstalled.addListener((details) => {
        console.log('Extension installed:', details);
    });
    browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        switch (msg.target) {
            case 'who-am-i':
                sendResponse(findIdInUrl(sender.tab?.url || ''))
                break
            default:
                console.error('background', 'unknown target', msg)
        }
    })

    browser.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [1408]
    })
    browser.declarativeNetRequest.updateDynamicRules({
        addRules: [
            {
                id: 1408,
                priority: 1,
                action: {
                    type: 'redirect',
                    redirect: {
                        url: 'https://yum.example.com:8787/crunchy/bundle.js'
                    }
                },
                condition: {
                    urlFilter: 'https://static.crunchyroll.com/vilos-v2/web/vilos/js/bundle.js',
                },
            }
        ]
    })
});
