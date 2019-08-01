# First-Person Tetris

HTML5 Clone of firstpersontetris.com

## Building

    $ yarn install
    $ yarn dev

Deployable static files can be built using

    $ yarn build

They'll be available in the `dist/` directory

### Notes

- Watch out for what you put in `dist/`, anything that matches the following patterns
(as configured in `webpack.config.js`) gets cleaned up on each build:

```js
    '**/*',
    '!assets',
    '!assets/**/*',
    '!index.html',
    '!manifest.json',
    '!browserconfig.xml',
    '!favicon.ico',
```
