import * as Pixi from 'pixi.js'
import SceneManager from 'game/scene/manager'
import SettingsScene from 'game/settings/scene'
import Input from 'game/input'
import Sound from 'game/sound'

export interface SizeObject {
  width: number;
  height: number;
}

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
