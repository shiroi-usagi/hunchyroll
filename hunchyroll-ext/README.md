# Hunchyroll Extension

A web extension that allows loading additional subtitle in Chrunchyroll's video player.

## Commands

### dev

The build command generates an unpacked web extension, it is configured with the development profile, watches the source code for changes, and opens a Chrome browser with the extension loaded.

The development mode has to be enabled as an extra to enable live reload.

```
npm run dev
```

**!!IMPORTANT!!** As of now, starting the development using a Firefox browser is not supported because the extension uses MV3.

```
npm run dev:firefox
```

### build

The build command generates an unpacked web extension, and it is configured with the production profile.

```
npm run build
```

The build:dev command is configured with the development profile.

```
npm run build:dev
```

The default command creates firefox and chrome builds. To only create a chrome build, use the following:

```
npm run build:chrome
```

The default command creates firefox and chrome builds. To only create a firefox build, use the following:

```
npm run build:firefox
```

Sometimes the dev version includes extra permission or access, but we need to test the final version. For this we can watch file changes using the following:

```
npm run build:watch
```

### zip

The zip command is configured with the production profile. This command does not remove the unarchived version of the generated code, which can be useful to test with the production API.

```
npm run zip
```

The default command creates firefox and chrome builds. To only create a chrome build, use the following:

```
npm run zip:chrome
```

The default command creates firefox and chrome builds. To only create a firefox build, use the following:

```
npm run zip:firefox
```

## Environment modes

### production mode

By adding a `.env.production.local` file you can override any production environment variable and exclude these changes from version control.

The development mode `WXT_API_ADDR` environment variable has the value of `https://hunchyroll.com`.

### development mode

By adding a `.env.local` file you can override any development environment variable and exclude these changes from version control.

The development mode `WXT_API_ADDR` environment variable has the value of `https://yum.example.com:8787`.

See the README of `hunchyroll-worker` for more details.
