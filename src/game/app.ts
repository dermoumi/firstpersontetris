import * as Pixi from 'pixi.js'
import SceneManager from 'game/scene/manager'
import TitleScene from 'game/title/scene'
import Input from 'game/input'

export interface SizeObject {
  width: number;
  height: number;
}

export default class Game {
  private container: HTMLElement
  private pixi: Pixi.Application
  private lastTimestamp = 0
  public stage = new Pixi.Container()
  public sceneManager = new SceneManager(this)
  public input = new Input()

  public constructor(container: HTMLElement) {
    this.container = container

    this.pixi = new Pixi.Application({
      autoStart: false,
    })
    this.pixi.ticker.autoStart = false
    this.pixi.ticker.stop()
    this.container.appendChild(this.pixi.view)

    // Set up default bindings
    // TODO: Set up bindings for non-level 3 keyboard events
    this.input.setBindings({
      ArrowUp: 'up',
      ArrowLeft: 'left',
      ArrowDown: 'down',
      ArrowRight: 'right',
      Space: 'rotate',
      Enter: 'drop',
      Escape: 'pause',
    })

    // Start with the title scene
    this.sceneManager.switchTo(new TitleScene(this))
  }

  public run(): void {
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