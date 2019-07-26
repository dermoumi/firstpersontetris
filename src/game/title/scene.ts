import * as Pixi from 'pixi.js'
import GameApp from 'game/app'
import Input from 'game/input'
import SceneBase from 'game/scene/base'
import SceneStage from 'game/stage/scene'

export default class TitleScene extends SceneBase {
  private text: Pixi.Text

  public constructor(app: GameApp) {
    super(app)

    this.text = new Pixi.Text('PRESS START', {
      fontFamily: 'main',
      fontSize: 24,
      fill: 0xFFCC00,
    })

    this.stage.addChild(this.text)
  }

  public onResize(width: number, height: number): void {
    this.text.position.x = Math.floor((width - this.text.width) / 2)
    this.text.position.y = Math.floor((height - this.text.height) / 2)
    super.onResize(width, height)
  }

  public onProcessInput(input: Input): void {
    if (input.isPressed('drop')) {
      this.manager.switchTo(new SceneStage(this.app))
    }
  }
}
