import * as Pixi from 'pixi.js'
import SceneManager from 'game/scene/manager'
import SettingsScene from 'game/settings/scene'
import Input from 'game/input'
import Sound from 'game/sound'
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

export interface SizeObject {
  width: number;
  height: number;
}

export type ResourceDict = Record<string, Pixi.LoaderResource>

export default class GameApp {
  private container: HTMLElement
  private lastTimestamp = 0
  public view: HTMLCanvasElement
  public renderer: Pixi.Renderer
  public ticker: Pixi.Ticker
  public stage = new Pixi.Container()
  public sceneManager = new SceneManager(this)
  public input = new Input()
  public sound = new Sound()

  public static resources: ResourceDict = {}

  public constructor(container: HTMLElement) {
    this.container = container

    Pixi.utils.skipHello()

    this.view = document.createElement('canvas')
    this.view.width = this.container.clientWidth
    this.view.height = this.container.clientHeight
    this.container.appendChild(this.view)

    this.ticker = Pixi.Ticker.shared
    this.ticker.autoStart = false
    this.ticker.stop()

    const rendererOptions = {
      view: this.view,
    }
    this.renderer = Pixi.autoDetectRenderer(rendererOptions)
  }

  public run(): void {
    // Start with the title scene
    this.sceneManager.switchTo(new SettingsScene(this))

    // Handle window resizes
    this.onResize()
    window.addEventListener('resize', this.onResize.bind(this), false)

    // Start the game
    console.info('Starting the game...')

    // Start rendering
    this.lastTimestamp = window.performance.now()
    this.update(this.lastTimestamp)

    // Remove the splash screen
    const splashElement = document.getElementById('splash')
    if (splashElement) {
      document.body.removeChild(splashElement)
    }
  }

  public async preload(): Promise<void> {
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

    if (webpSupported) {
      loader.add('room', roomWebp)
        .add('screen', screenWebp)
        .add('onScreenControls', osControlsWebp)
    } else {
      loader.add('room', room)
        .add('screen', screen)
        .add('onScreenControls', osControls)
    }

    // Callback for when resources are loaded
    GameApp.resources = await new Promise((resolve): void => {
      loader.load((_loader: Pixi.Loader, resources: ResourceDict): void => {
        resolve(resources)
      })
    })

    // Set a couple of textures up with NEAREST filtering
    ;['stage', 'ui'].forEach((res): void => {
      GameApp.resources[res].texture.baseTexture.scaleMode = Pixi.SCALE_MODES.NEAREST
    })

    // console.log(GameApp.resources.sfx)

    // Load sounds
    this.sound.setSoundBlobs({
      sfxSprites: {
        src: [ URL.createObjectURL(GameApp.resources.sfx.data) ],
        format: [ 'mp3' ],
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

  private onResize(): void {
    const width = this.container.clientWidth
    const height = this.container.clientHeight
    this.view.width = width
    this.view.height = height
    this.renderer.resize(width, height)
    this.sceneManager.updateScreenSize(width, height)
  }

  private update(timestamp: number): void {
    // Calculate frametime
    const frameTime = (timestamp - this.lastTimestamp) / 1000
    this.lastTimestamp = timestamp

    // Update input
    this.input.update()

    // Update scene
    if (this.sceneManager.update(frameTime)) {
      // Render scene
      this.renderer.render(this.stage)
    }

    // Request the next frame
    requestAnimationFrame(this.update.bind(this))
  }

  public getSize(): SizeObject {
    return {
      width: this.renderer.width,
      height: this.renderer.height,
    }
  }
}
