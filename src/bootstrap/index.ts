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

// Lazily load the game app
import(/* webpackChunkName: "game" */ 'game/app').then(async (module): Promise<void> => {
  // Make sure the container element exists
  const container = document.getElementById('game')
  if (!container) {
    // TODO: Show this as an alert
    console.error('Could not find container element')
    return
  }

  // Initialize an instance of the game app
  const GameApp = module.default
  const app = new GameApp(container)

  // Make sure the required fonts are available (through FontFace api if available)
  if ('FontFace' in window) {
    // If FontFace API is available, make sure the fonts are loaded properly
    const fonts = [{
      family: 'pixel-emulator',
      source: "url('assets/fonts/pixel-emulator.woff2') format('woff2'), " +
              "url('assets/fonts/pixel-emulator.woff') format('woff')",
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
})

if ('serviceWorker' in navigator) {
  if (__DEV__) {
    // DEV mode, clear all service workers and reload
    navigator.serviceWorker.getRegistrations().then((registrations): void => {
      for (const registration of registrations) {
        registration.unregister()
      }
      if (registrations.length > 0) {
        window.location.reload()
      }
    })
  } else {
    // Register the service worker
    window.addEventListener('load', (): void => {
      navigator.serviceWorker.register('/service-worker.js').then((registration): void => {
        console.info('SW registered: ', registration)
      }).catch((registrationError): void => {
        console.error('SW registration failed: ', registrationError)
      })
    })
  }
}
