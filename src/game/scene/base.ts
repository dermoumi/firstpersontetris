import GameApp from 'game/app'
import Input from 'game/input'
import SceneManager from './manager'
import * as Pixi from 'pixi.js'

export default class SceneBase {
  protected app: GameApp
  protected manager: SceneManager
  protected stage = new Pixi.Container()

  protected constructor(app: GameApp) {
    console.debug(`${this.constructor.name}: constructor`)
    this.app = app
    this.manager = app.sceneManager

    app.stage.addChild(this.stage)
  }

  public onEnter(): void {
    console.debug(`${this.constructor.name}: onEnter()`)
    this._setStageVisible(true)
  }

  public onLeave(): void {
    console.debug(`${this.constructor.name}: onLeave()`)
    this._setStageVisible(false)
  }

  public onDestroy(): void {
    console.debug(`${this.constructor.name}: onDestroy()`)
    this.app.stage.removeChild(this.stage)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onResize(_width: number, _height: number): void {
    console.debug(`${this.constructor.name}: onResize()`)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onUpdate(_frameTime: number): true | void {
    // Nothing to do
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onProcessInput(_input: Input, _frameTime: number): void {
    // Nothing to do
  }

  public isInputEnabled(): boolean {
    return true
  }

  private _setStageVisible(visible: boolean): void {
    this.stage.visible = visible
  }

  public _resize(): void {
    const { width, height } = this.app.getSize()
    this.onResize(width, height)
  }
}
