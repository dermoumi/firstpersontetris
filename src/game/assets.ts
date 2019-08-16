import * as Pixi from 'pixi.js'
import GameApp from './app'
import { isWebpSupported } from './utils'

import stage from 'assets/images/stage.png'
import room from 'assets/images/room.jpg'
import roomWebp from 'assets/images/room.webp'
import screen from 'assets/images/screen.png'
import screenWebp from 'assets/images/screen.webp'
import osControls from 'assets/images/onscreencontrols.png'
import osControlsWebp from 'assets/images/onscreencontrols.webp'
import ui from 'assets/images/ui.png'
import sfxSprites from 'assets/sounds/sfx.mp3'

export type ResourceDict = Record<string, Pixi.LoaderResource>

const Assets: ResourceDict = {}
export default Assets

export async function preload(app: GameApp): Promise<void> {
  const webpSupported = await isWebpSupported()

    // Setup loading as BLOB for some file types
    ;['mp3'].forEach((type): void => {
    Pixi.LoaderResource.setExtensionLoadType(type, Pixi.LoaderResource.LOAD_TYPE.XHR)
    Pixi.LoaderResource.setExtensionXhrType(type, Pixi.LoaderResource.XHR_RESPONSE_TYPE.BLOB)
  })

  // Load resources
  const loader = Pixi.Loader.shared

  loader.add('stage', stage)
    .add('ui', ui)
    .add('sfx', sfxSprites)
    .add('room', webpSupported ? roomWebp : room)
    .add('screen', webpSupported ? screenWebp : screen)
    .add('onScreenControls', webpSupported ? osControlsWebp: osControls)

  // Callback for when resources are loaded
  const resources: ResourceDict = await new Promise((resolve): void => {
    loader.load((_loader: Pixi.Loader, resources: ResourceDict): void => {
      resolve(resources)
    })
  })

  Object.entries(resources).forEach(([ key, resource ]): void => {
    Assets[key] = resource
  })

  // Set a couple of textures up with NEAREST filtering
  ;['stage', 'ui'].forEach((res): void => {
    Assets[res].texture.baseTexture.scaleMode = Pixi.SCALE_MODES.NEAREST
  })

  // Load sounds
  app.sound.setSoundBlobs({
    sfxSprites: {
      src: [URL.createObjectURL(Assets.sfx.data)],
      format: ['mp3'],
      sprite: {
        beep: [0, 1023],
        level: [1123, 1938],
        line: [3161, 1728],
        over: [4989, 2042],
        pause: [7131, 1311],
        rotate: [8542, 1232],
        tetris: [9875, 1598],
        united: [11572, 1102],
      },
    },
  })
}
