declare var __DEV__: boolean

declare class FontFace {
  public constructor(fontFamily: string, fontSource: string);
  public load(): Promise<void>;

  public family: string;
}

function hideSplash(): void {
  const splash = document.getElementById('splash')
  if (splash) document.body.removeChild(splash)
}

async function registerSW(): Promise<void> {
  if (__DEV__ || navigator.serviceWorker === undefined) return

  const onSwUpdated = (): void => {
    // TODO: Show as a notification with DOM
    console.info('Content updated!')
  }

  const onSwCached = (): void => {
    // TODO: Show as a notification with DOM
    console.info('Content cached for offline use!')
  }

  // Register the service worker
  try {
    const registration = await navigator.serviceWorker.register('../service-worker.js')
    registration.onupdatefound = (): void => {
      const installingWorker = registration.installing
      if (!installingWorker) return
      installingWorker.onstatechange = (): void => {
        if (installingWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            onSwUpdated()
          } else {
            onSwCached()
          }
        }
      }
    }
  } catch (e) {
    // Nothing to do
  }
}

function loadGame(): void {
  // Lazily load the game app
  import(/* webpackChunkName: "game" */ 'game/app').then(async (module): Promise<void> => {
    // Make sure the container element exists
    const container = document.getElementById('game')
    if (!container) {
      alert('Could not find container element!')
      return
    }

    // Initialize an instance of the game app
    const GameApp = module.default
    const app = new GameApp(container)

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pixelEmulatorWoff = require('assets/fonts/pixel-emulator.woff')
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pixelEmulatorWoff2 = require('assets/fonts/pixel-emulator.woff2')

    // Make sure the required fonts are available (through FontFace api if available)
    if ('FontFace' in window) {
      // If FontFace API is available, make sure the fonts are loaded properly
      const fonts = [{
        family: 'pixel-emulator',
        source: `url(${pixelEmulatorWoff2}) format('woff2'), url(${pixelEmulatorWoff}) format('woff')`,
      }]

      try {
        await Promise.all(fonts.map((font): Promise<void> => {
          const fontFace = new FontFace(font.family, font.source)
          return fontFace.load()
        }))
      } catch (error) {
        console.error(`Font did not load: ${error}`)
      }
    }

    await app.preload()
    app.run()
    hideSplash()
    registerSW()
  })
}

if (document.readyState === 'complete') {
  loadGame()
} else {
  document.onreadystatechange = (): void => {
    if (document.readyState === 'complete') {
      loadGame()
    }
  }
}
