import * as Pixi from 'pixi.js'
import GameApp from 'game/app'
import Input from 'game/input'
import SceneBase from 'game/scene/base'
import SceneStage from 'game/stage/scene'
import CheckBox from './checkbox'

const CONTAINER_WIDTH = 640
const CONTAINER_HEIGHT = 480
const MUSIC_TRACKS: [string, string][] = [
  ['assets/music/type1.mp3', 'assets/music/type1fast.mp3'],
  ['assets/music/type2.mp3', 'assets/music/type2fast.mp3'],
  ['assets/music/type3.mp3', 'assets/music/type3fast.mp3'],
]

export default class TitleScene extends SceneBase {
  private _container = new Pixi.Container()
  private _musicCheckboxes: CheckBox[] = []
  private _selectedMusic = 0
  private _sfxOn = true
  private _lightsOut = false
  private _inCrisis = false

  public constructor(app: GameApp) {
    super(app)

    this._loadSettings()

    this.stage.addChild(this._container)

    const labelStyle = {
      fontFamily: 'main',
      fontSize: 18,
      fill: 0x7C7C7C,
    }

    const titleStyle = {
      fontFamily: 'main',
      fontSize: 24,
      fill: 0xFFFFFF,
    }

    const arrows = Pixi.Sprite.from(GameApp.resources.arrows.texture)
    arrows.position.x = 24
    arrows.position.y = 24
    this._container.addChild(arrows)

    const arrowsLabel = new Pixi.Text('MOVE', labelStyle)
    arrowsLabel.position.x = arrows.position.x + (arrows.width - arrowsLabel.width) / 2
    arrowsLabel.position.y = 96
    this._container.addChild(arrowsLabel)

    const space = Pixi.Sprite.from(GameApp.resources.space.texture)
    space.position.x = 181
    space.position.y = 60
    this._container.addChild(space)

    const spaceLabel = new Pixi.Text('ROTATE', labelStyle)
    spaceLabel.position.x = space.position.x + (space.width - spaceLabel.width) / 2
    spaceLabel.position.y = 96
    this._container.addChild(spaceLabel)

    const enter = Pixi.Sprite.from(GameApp.resources.enter.texture)
    enter.position.x = 386
    enter.position.y = 54
    this._container.addChild(enter)

    const enterLabel = new Pixi.Text('DROP', labelStyle)
    enterLabel.position.x = enter.position.x + (enter.width - enterLabel.width) / 2
    enterLabel.position.y = 96
    this._container.addChild(enterLabel)

    const escape = Pixi.Sprite.from(GameApp.resources.escape.texture)
    escape.position.x = 547
    escape.position.y = 54
    this._container.addChild(escape)

    const escapeLabel = new Pixi.Text('PAUSE', labelStyle)
    escapeLabel.position.x = escape.position.x + (escape.width - escapeLabel.width) / 2
    escapeLabel.position.y = 96
    this._container.addChild(escapeLabel)

    const musicTitle = new Pixi.Text('MUSIC', titleStyle)
    musicTitle.position.x = 24
    musicTitle.position.y = 140
    this._container.addChild(musicTitle)

    for (let i = 0; i < 4; ++i) {
      const selected = (i === this._selectedMusic)
      const checkBox = new CheckBox(i == 3 ? 'OFF' : `TYPE${i+1}`, selected)
      checkBox.position.x = 38 + i * 160
      checkBox.position.y = 180
      checkBox.interactive = !selected
      checkBox.buttonMode = !selected
      this._container.addChild(checkBox)
      checkBox.on('pointertap', (): void => this._selectMusic(i))
      this._musicCheckboxes.push(checkBox)
    }

    const optionsTitle = new Pixi.Text('OPTIONS', titleStyle)
    optionsTitle.position.x = 24
    optionsTitle.position.y = 240
    this._container.addChild(optionsTitle)

    const sfxCheckbox = new CheckBox('SFX', this._sfxOn)
    sfxCheckbox.position.x = 38
    sfxCheckbox.position.y = 280
    this._container.addChild(sfxCheckbox)
    sfxCheckbox.on('pointertap', (): void => {
      // TODO: Play click sound
      this._sfxOn = !this._sfxOn
      sfxCheckbox.setChecked(this._sfxOn)
    })

    const lightsOutCheckbox = new CheckBox('LIGHTS OUT', this._lightsOut)
    lightsOutCheckbox.position.x = 168
    lightsOutCheckbox.position.y = 280
    this._container.addChild(lightsOutCheckbox)
    lightsOutCheckbox.on('pointertap', (): void => {
      // TODO: Play click sound
      this._lightsOut = !this._lightsOut
      lightsOutCheckbox.setChecked(this._lightsOut)
    })

    const crisisCheckbox = new CheckBox('IN CRISIS', this._inCrisis)
    crisisCheckbox.position.x = 418
    crisisCheckbox.position.y = 280
    this._container.addChild(crisisCheckbox)
    crisisCheckbox.on('pointertap', (): void => {
      // TODO: Play click sound
      this._inCrisis = !this._inCrisis
      crisisCheckbox.setChecked(this._inCrisis)
    })

    const pushStartText = new Pixi.Text('PUSH START', {
      fontFamily: 'main',
      fontSize: 32,
      fill: 0xFFCC00,
    })
    pushStartText.position.x = Math.floor((CONTAINER_WIDTH - pushStartText.width) / 2)
    pushStartText.position.y = 356
    this._container.addChild(pushStartText)
    pushStartText.interactive = true
    pushStartText.buttonMode = true
    pushStartText.on('pointertap', (): void => this._startGame())

    this._setupCreditsText()

    this._playMusic()
  }

  public onResize(width: number, height: number): void {
    this._container.position.x = Math.floor((width - CONTAINER_WIDTH) / 2)
    this._container.position.y = Math.floor((height - CONTAINER_HEIGHT) / 2)
    super.onResize(width, height)
  }

  public onProcessInput(input: Input): void {
    if (input.isPressed('drop')) {
      this._startGame()
    }
  }

  private _loadSettings(): void {
    // TODO: Load settings from local storage
  }

  private _saveSettings(): void {
    // TODO: Save settings to local storage
  }

  private _selectMusic(index: number): void {
    this._selectedMusic = index
    this._saveSettings()
    this._playMusic(this._selectedMusic)

    this._musicCheckboxes.forEach((checkBox, i): void => {
      const selected = (i === index)
      checkBox.setChecked(selected)
      checkBox.interactive = !selected
      checkBox.buttonMode = !selected
    })

    // TODO: Play click sound
  }

  private _playMusic(index: number = this._selectedMusic): void {
    const sound = this.app.sound
    sound.stopMusic()

    if (index >= 3) return

    const [ music, musicFast ] = MUSIC_TRACKS[index]
    sound.setMusic(music, musicFast, {
      preload: true,
      loop: true,
    })
    sound.playSlowMusic()
  }

  private _startGame(): void {
    this.manager.switchTo(new SceneStage(this.app, {
      lightsOut: this._lightsOut,
      crisisMode: this._inCrisis,
    }))
  }

  private _setupCreditsText(): void {
    const creditText = {
      fontFamily: 'main',
      fontSize: 16,
      fill: 0x7C7C7C,
    }

    const linkText = {
      fontFamily: 'main',
      fontSize: 16,
      fill: 0xAAAAAA,
    }

    const text1 = new Pixi.Text('Made by ', creditText)
    const text2 = new Pixi.Text('@sdrmme', linkText)

    text1.position.x = (CONTAINER_WIDTH - text1.width - text2.width) / 2
    text1.position.y = CONTAINER_HEIGHT - 40
    this._container.addChild(text1)

    text2.position.x = text1.position.x + text1.width
    text2.position.y = text1.position.y
    this._container.addChild(text2)
    text2.interactive = true
    text2.buttonMode = true
    text2.on('pointertap', (): void => {
      window.open('https://twitter.com/sdrmme', '_blank')
    })

    const text3 = new Pixi.Text('Based on work by ', creditText)
    const text4 = new Pixi.Text('@dontsave', linkText)

    text3.position.x = (CONTAINER_WIDTH - text3.width - text4.width) / 2
    text3.position.y = CONTAINER_HEIGHT - 20
    this._container.addChild(text3)

    text4.position.x = text3.position.x + text3.width
    text4.position.y = text3.position.y
    this._container.addChild(text4)
    text4.interactive = true
    text4.buttonMode = true
    text4.on('pointertap', (): void => {
      window.open('https://twitter.com/dontsave', '_blank')
    })
  }
}
