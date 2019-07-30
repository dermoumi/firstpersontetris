import * as Pixi from 'pixi.js'
import SceneManager from 'game/scene/manager'
import SettingsScene from 'game/settings/scene'
import Input from 'game/input'
import Sound from 'game/sound'

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

      loader.add('block1', 'assets/images/block1.gif')
        .add('block2', 'assets/images/block2.gif')
        .add('stage', 'assets/images/stage.png')
        .add('stats', 'assets/images/stats.png')
        .add('arrows', 'assets/images/arrows.png')
        .add('enter', 'assets/images/enter.png')
        .add('escape', 'assets/images/escape.png')
        .add('space', 'assets/images/space.png')
        .add('room', 'assets/images/room.jpg')
        .add('screen', 'assets/images/screen.png')
        .add('checkbox', 'assets/images/checkbox.gif')
        .add('sfx_level', 'assets/sounds/level.mp3')
        .add('sfx_line', 'assets/sounds/line.mp3')
        .add('sfx_over', 'assets/sounds/over.mp3')
        .add('sfx_rotate', 'assets/sounds/rotate.mp3')
        .add('sfx_tetris', 'assets/sounds/tetris.mp3')
        .add('sfx_united', 'assets/sounds/united.mp3')
        .add('sfx_beep', 'assets/sounds/beep.mp3')
        .add('sfx_pause', 'assets/sounds/pause.mp3')

      loader.load((_loader: Pixi.Loader, resources: ResourceDict): void => {
        GameApp.resources = resources
        resolve()

        resources.block1.texture.baseTexture.scaleMode = Pixi.SCALE_MODES.NEAREST
        resources.block2.texture.baseTexture.scaleMode = Pixi.SCALE_MODES.NEAREST
        resources.stage.texture.baseTexture.scaleMode = Pixi.SCALE_MODES.NEAREST
        resources.stats.texture.baseTexture.scaleMode = Pixi.SCALE_MODES.NEAREST
        resources.arrows.texture.baseTexture.scaleMode = Pixi.SCALE_MODES.NEAREST
        resources.enter.texture.baseTexture.scaleMode = Pixi.SCALE_MODES.NEAREST
        resources.escape.texture.baseTexture.scaleMode = Pixi.SCALE_MODES.NEAREST
        resources.space.texture.baseTexture.scaleMode = Pixi.SCALE_MODES.NEAREST
        resources.checkbox.texture.baseTexture.scaleMode = Pixi.SCALE_MODES.NEAREST
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
