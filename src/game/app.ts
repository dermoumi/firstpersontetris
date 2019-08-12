import * as Pixi from 'pixi.js'
import SceneManager from 'game/scene/manager'
import SettingsScene from 'game/settings/scene'
import Input from 'game/input'
import Sound from 'game/sound'

import stage from 'assets/images/stage.png'
import room from 'assets/images/room.jpg'
import screen from 'assets/images/screen.png'
import onscreencontrols from 'assets/images/onscreencontrols.png'
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
  public pixi: Pixi.Application
  public stage = new Pixi.Container()
  public sceneManager = new SceneManager(this)
  public input = new Input()
  public sound = new Sound()

  public static resources: ResourceDict = {}

  public constructor(container: HTMLElement) {
    this.container = container

    Pixi.utils.skipHello()
    this.pixi = new Pixi.Application({
      autoStart: false,
    })
    this.pixi.ticker.autoStart = false
    this.pixi.ticker.stop()
    this.container.appendChild(this.pixi.view)
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
    return new Promise((resolve): void => {
      const loader = Pixi.Loader.shared

      loader.add('stage', stage)
        .add('room', room)
        .add('screen', screen)
        .add('onScreenControls', onscreencontrols)
        .add('ui', ui)
        .add('sfxSprites', sfxSprites)

      loader.load((_loader: Pixi.Loader, resources: ResourceDict): void => {
        GameApp.resources = resources
        resolve()

        resources.stage.texture.baseTexture.scaleMode = Pixi.SCALE_MODES.NEAREST
        resources.ui.texture.baseTexture.scaleMode = Pixi.SCALE_MODES.NEAREST

        resources.sfxSprites.sound.addSprites({
          beep:   { start: 0,      end: 1.123 },
          level:  { start: 1.123,  end: 3.161 },
          line:   { start: 3.161,  end: 4.989 },
          over:   { start: 4.989,  end: 7.131 },
          pause:  { start: 7.131,  end: 8.542 },
          rotate: { start: 8.542,  end: 9.874 },
          tetris: { start: 9.875,  end: 11.572 },
          united: { start: 11.572, end: 12.774 },
        })
      })
    })
  }

  private onResize(): void {
    const width = this.container.clientWidth
    const height = this.container.clientHeight
    this.pixi.renderer.resize(width, height)
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
      this.pixi.renderer.render(this.stage)
    }

    // Request the next frame
    requestAnimationFrame(this.update.bind(this))
  }

  public getSize(): SizeObject {
    return {
      width: this.pixi.renderer.width,
      height: this.pixi.renderer.height,
    }
  }
}
