import * as Pixi from 'pixi.js'
import Assets from 'game/assets'
import SubSprite from 'game/utils/subsprite'

export default class CheckBox extends Pixi.Container {
  private _checkFiller = new Pixi.Graphics()
  private _checkSquare: SubSprite
  private _label: Pixi.Text
  private _checked: boolean

  public constructor(labelText: string, checked = false) {
    super()

    this._checked = checked

    this._checkFiller.beginFill(0xFFFFFF)
    this._checkFiller.drawRect(5, 5, 20, 20)
    this._checkFiller.endFill()
    this._checkFiller.visible = checked
    this.addChild(this._checkFiller)

    this._checkSquare = new SubSprite(Assets.ui.texture, new Pixi.Rectangle(0, 34, 15, 15))
    this._checkSquare.scale.x = 2
    this._checkSquare.scale.y = 2
    this.addChild(this._checkSquare)

    this._label = new Pixi.Text(labelText, {
      fontFamily: 'main',
      fontSize: 24,
      fill: checked ? 0xFFFFFF : 0x7C7C7C,
    })
    this._label.position.x = 42
    this._label.position.y = 0

    this.interactive = true
    this.buttonMode = true
    this.hitArea = new Pixi.Rectangle(0, 0, this._label.position.x + this._label.width, this._checkSquare.height)

    this.addChild(this._label)
  }

  public setChecked(checked: boolean): void {
    if (this._checked === checked) return

    this._checked = checked
    this._checkFiller.visible = checked
    this._label.style.fill = checked ? 0xFFFFFF : 0x7C7C7C
  }
}
