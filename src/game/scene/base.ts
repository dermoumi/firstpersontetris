import GameApp from '../app'
import Input from '../input'
import SceneManager from './manager'
import * as Pixi from 'pixi.js'

export default class SceneBase {
  app: GameApp
  manager: SceneManager
  stage = new Pixi.Container()
  _isInputFrozen = false

  constructor(app: GameApp, _userdata: Object) {
    console.debug(`${this.constructor.name}: constructor`)
    this.app = app
    this.manager = app.sceneManager

    app.stage.addChild(this.stage)
  }

  onEnter() {
    console.debug(`${this.constructor.name}: onEnter()`)
    this._setStageVisible(true)
  }

  onLeave() {
    console.debug(`${this.constructor.name}: onLeave()`)
    this._setStageVisible(false)
  }

  onDestroy() {
    console.debug(`${this.constructor.name}: onDestroy()`)
    this.app.stage.removeChild(this.stage)
  }

  onResize(_width: number, _height: number) {
    console.debug(`${this.constructor.name}: onResize()`)
  }

  onUpdate(_frameTime: number): false | void {
    // Nothing to do
  }

  onProcessInput(_input: Input, _frameTime: number) {
    // Nothing to do
  }

  isInputEnabled(): boolean {
    return !this._isInputFrozen
  }

  _setStageVisible(visible: boolean) {
    this.stage.visible = visible
  }

  _resize() {
    const {width, height} = this.app.getSize()
    this.onResize(width, height)
  }
}
