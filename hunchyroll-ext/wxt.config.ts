import {defineConfig, defineWebExtConfig} from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
    srcDir: 'src',
    modules: ['@wxt-dev/module-svelte', '@wxt-dev/webextension-polyfill'],
    manifestVersion: 3,
    manifest: ({browser}) => {
        return {
            name: 'Hunchyroll',
            default_locale: 'hu',
            web_accessible_resources: [
                {
                    resources: ['site.js'],
                    matches: ['https://static.crunchyroll.com/*'],
                },
            ],
            permissions: [
                "declarativeNetRequest",
                "storage"
            ],
            host_permissions: [
                "https://static.crunchyroll.com/*",
                "https://www.crunchyroll.com/watch/*",
            ],
            ...(browser === 'firefox' && {
                browser_specific_settings: {
                    gecko: {
                        id: 'contact@nergal.xyz',
                        strict_min_version: '127.0',
                    },
                }
            })
        }
    },
});
