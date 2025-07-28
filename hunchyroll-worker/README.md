# Hunchyroll Worker

An API serving additional subtitle data for Crunchyroll's video player.

## Commands

### dev

Chrunchyroll runs on https as is expected. This requires the development server to also serve its data even during development from a https source. For this, I found [mkcert](https://github.com/FiloSottile/mkcert) the best tool. The GitHub README contains installation steps ([link](https://github.com/FiloSottile/mkcert#installation)) for Linux, macOS, and Windows. 

By their own words:

> mkcert is a simple tool for making locally-trusted development certificates. It requires no configuration.

```
mkcert -install
mkcert yum.example.com
```

To start a development server using the generated certificates, use the following command:

```
npm run dev -- --https-cert-path /path/to/yum.example.com.pem --https-key-path /path/to/yum.example.com-key.pem
```

### deploy

This command is used by the Cloudflare deployment script.

```
npm run deploy
```

## Endpoints

### `/crunchy/bundle.js`

Alters the original Crunchyroll bundle.js to expose the worker.

### `/crunchy/:id`

Lists subtitles for a given Crunchyroll video id.
