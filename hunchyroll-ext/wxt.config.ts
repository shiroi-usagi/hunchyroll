import {defineConfig, defineWebExtConfig} from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-svelte', '@wxt-dev/webextension-polyfill'],
  manifestVersion: 3,
  manifest: {
    name: 'Hunchyroll',
    web_accessible_resources: [
      {
        resources: ['site.js'],
        matches: ['https://static.crunchyroll.com/*'],
      },
    ],
    permissions: [
      "declarativeNetRequest"
    ],
  },
});
