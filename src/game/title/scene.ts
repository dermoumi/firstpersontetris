import * as Pixi from 'pixi.js'
import GameApp from '../app'
import Input from '../input'
import SceneBase from '../scene/base'
import SceneStage from '../stage/scene'

export default class TitleScene extends SceneBase {
  text: Pixi.Text

  constructor(app: GameApp, userdata: Object) {
    super(app, userdata)

    this.text = new Pixi.Text('PRESS START', {
      fontFamily: 'main',
      fontSize: 24,
      fill: 0xFFCC00,
    })

    this.stage.addChild(this.text)
  }

  onResize(width: number, height: number) {
    this.text.position.x = Math.floor((width - this.text.width) / 2)
    this.text.position.y = Math.floor((height - this.text.height) / 2)
    super.onResize(width, height)
  }

  onProcessInput(input: Input) {
    if (input.isPressed('drop')) {
      this.manager.switchTo(SceneStage)
    }
  }
}
