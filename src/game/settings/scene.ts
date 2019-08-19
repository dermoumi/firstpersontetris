import * as Pixi from 'pixi.js'
import GameApp from 'game/app'
import Assets from 'game/assets'
import Input from 'game/input'
import SceneBase from 'game/scene/base'
import SceneStage from 'game/stage/scene'
import CheckBox from './checkbox'
import { Buttons } from 'game/config'

import bgmCrisis from 'assets/music/crisis.mp3'
import bgmType1 from 'assets/music/type1.mp3'
import bgmType1Fast from 'assets/music/type1fast.mp3'
import bgmType2 from 'assets/music/type2.mp3'
import bgmType2Fast from 'assets/music/type2fast.mp3'
import bgmType3 from 'assets/music/type3.mp3'
import bgmType3Fast from 'assets/music/type3fast.mp3'
import SubSprite from 'game/utils/subsprite'

const CONTAINER_WIDTH = 640
const CONTAINER_HEIGHT = 480

const MUSIC_TRACKS: [string, string][] = [
  [bgmType1, bgmType1Fast],
  [bgmType2, bgmType2Fast],
  [bgmType3, bgmType3Fast],
]

const TITLE_STYLE = {
  fontFamily: 'main',
  fontSize: 24,
  fill: 0xFFFFFF,
}

export interface StageData {
  level: number;
  lines: number;
  score: number;
  hiScore: number;
  panic: boolean;
}

export interface TitleUserdata {
  gameOver?: StageData;
  pause?: StageData;
}

export interface Settings {
  hiScore: number;
  music: number;
  sfx: boolean;
  lightsOut: boolean;
  crisis: boolean;
}

export default class SettingsScene extends SceneBase {
  private container = new Pixi.Container()
  private musicCheckboxes: CheckBox[] = []
  private selectedMusic = 0
  private sfxOn = true
  private lightsOut = false
  private inCrisis = false
  private hiScore = 10000
  private isPaused = false
  private panicMode = false

  public constructor(app: GameApp, userdata: TitleUserdata = {}) {
    super(app)

    this.loadSettings()
    this.app.sound.setSfxEnabled(this.sfxOn)

    // Set layout depending on which mode is current
    if (userdata.pause !== undefined) {
      this.setupPauseMenu(userdata.pause)
    } else if (userdata.gameOver !== undefined) {
      this.setupGameOverMenu(userdata.gameOver)
    } else {
      this.setupTitleMenu()
    }

    this.container.pivot.x = Math.floor(CONTAINER_WIDTH / 2)
    this.container.pivot.y = Math.floor(CONTAINER_HEIGHT / 2)
    this.stage.addChild(this.container)
  }

  private setupTitleMenu(): void {
    this.drawControlsSection("IT'S FIRST-PERSON TETRIS")
    this.drawMusicSection()
    this.drawOptionsSection()
    this.drawStartButton()
    this.drawCreditsText()
  }

  private setupPauseMenu(stageData: StageData): void {
    this.isPaused = true
    this.panicMode = stageData.panic
    this.app.sound.playSfx('pause')

    this.drawStageDataSection('PAUSED', stageData)
    this.drawMusicSection()
    this.drawOptionsSection()
    this.drawStartButton()
    this.drawCreditsText()
  }

  private setupGameOverMenu(stageData: StageData): void {
    this.hiScore = stageData.hiScore
    this.saveSettings()

    this.drawStageDataSection('GAME OVER', stageData)
    this.drawMusicSection()
    this.drawOptionsSection()
    this.drawStartButton()
    this.drawCreditsText()
  }

  private drawTitleText(text: string, posX: number, posY: number): void {
    const title = new Pixi.Text(text, TITLE_STYLE)
    title.position.x = posX
    title.position.y = posY
    this.container.addChild(title)
  }

  private drawControlsSection(title: string): void {
    this.drawTitleText(title, 24, 24)

    const labelStyle = {
      fontFamily: 'main',
      fontSize: 18,
      fill: 0x7C7C7C,
    }

    const arrows = new SubSprite(Assets.ui.texture, new Pixi.Rectangle(0, 0, 51, 33))
    arrows.scale.x = 2
    arrows.scale.y = 2
    arrows.position.x = 24
    arrows.position.y = 64
    this.container.addChild(arrows)

    const arrowsLabel = new Pixi.Text('MOVE', labelStyle)
    arrowsLabel.position.x = arrows.position.x + (arrows.width - arrowsLabel.width) / 2
    arrowsLabel.position.y = 136
    this.container.addChild(arrowsLabel)

    const space = new SubSprite(Assets.ui.texture, new Pixi.Rectangle(52, 38, 75, 15))
    space.scale.x = 2
    space.scale.y = 2
    space.position.x = 181
    space.position.y = 100
    this.container.addChild(space)

    const spaceLabel = new Pixi.Text('ROTATE', labelStyle)
    spaceLabel.position.x = space.position.x + (space.width - spaceLabel.width) / 2
    spaceLabel.position.y = 136
    this.container.addChild(spaceLabel)

    const enter = new SubSprite(Assets.ui.texture, new Pixi.Rectangle(52, 0, 53, 18))
    enter.scale.x = 2
    enter.scale.y = 2
    enter.position.x = 386
    enter.position.y = 94
    this.container.addChild(enter)

    const enterLabel = new Pixi.Text('DROP', labelStyle)
    enterLabel.position.x = enter.position.x + (enter.width - enterLabel.width) / 2
    enterLabel.position.y = 136
    this.container.addChild(enterLabel)

    const escape = new SubSprite(Assets.ui.texture, new Pixi.Rectangle(52, 19, 35, 18))
    escape.scale.x = 2
    escape.scale.y = 2
    escape.position.x = 547
    escape.position.y = 94
    this.container.addChild(escape)

    const escapeLabel = new Pixi.Text('PAUSE', labelStyle)
    escapeLabel.position.x = escape.position.x + (escape.width - escapeLabel.width) / 2
    escapeLabel.position.y = 136
    this.container.addChild(escapeLabel)
  }

  private drawStageDataSection(title: string, data: StageData): void {
    this.drawTitleText(title, 24, 24)

    const labelStyle = {
      fontFamily: 'main',
      fontSize: 18,
      fill: 0x7C7C7C,
    }

    const valueStyle = {
      fontFamily: 'main',
      fontSize: 18,
      fill: 0xFFFFFF,
    }

    const levelLabel = new Pixi.Text('LEVEL', labelStyle)
    levelLabel.position.x = 38
    levelLabel.position.y = 64
    this.container.addChild(levelLabel)

    const linesLabel = new Pixi.Text('LINES', labelStyle)
    linesLabel.position.x = 38
    linesLabel.position.y = 84
    this.container.addChild(linesLabel)

    const scoreLabel = new Pixi.Text('SCORE', labelStyle)
    scoreLabel.position.x = 38
    scoreLabel.position.y = 104
    this.container.addChild(scoreLabel)

    const hiScoreLabel = new Pixi.Text('TOP SCORE', labelStyle)
    hiScoreLabel.position.x = 38
    hiScoreLabel.position.y = 124
    this.container.addChild(hiScoreLabel)

    const level = new Pixi.Text(data.level.toString(), valueStyle)
    level.position.x = 180
    level.position.y = 64
    this.container.addChild(level)

    const lines = new Pixi.Text(data.lines.toString(), valueStyle)
    lines.position.x = 180
    lines.position.y = 84
    this.container.addChild(lines)

    const score = new Pixi.Text(data.score.toString(), valueStyle)
    score.position.x = 180
    score.position.y = 104
    this.container.addChild(score)

    const hiScore = new Pixi.Text(data.hiScore.toString(), valueStyle)
    hiScore.position.x = 180
    hiScore.position.y = 124
    this.container.addChild(hiScore)
  }

  private drawMusicSection(): void {
    this.drawTitleText('MUSIC', 24, 180)

    this.musicCheckboxes = new Array(4)
    for (let i = 0; i < 4; ++i) {
      const selected = (i === this.selectedMusic)
      const interactive = (!selected || !this.app.sound.isMusicPlaying())

      const checkBoxLabel = (i === 3) ? 'OFF' : `TYPE${i + 1}`
      const checkBox = new CheckBox(checkBoxLabel, selected)
      checkBox.position.x = 38 + i * 160
      checkBox.position.y = 220
      checkBox.interactive = interactive
      checkBox.buttonMode = interactive
      checkBox.on('pointertap', this.actionSelectMusic.bind(this, i))

      this.container.addChild(checkBox)
      this.musicCheckboxes[i] = checkBox
    }
  }

  private drawOptionsSection(): void {
    this.drawTitleText('OPTIONS', 24, 280)

    const sfxCheckbox = new CheckBox('SFX', this.sfxOn)
    sfxCheckbox.position.x = 38
    sfxCheckbox.position.y = 320
    sfxCheckbox.on('pointertap', this.actionToggleSfx.bind(this, sfxCheckbox))
    this.container.addChild(sfxCheckbox)

    const lightsOutCheckbox = new CheckBox('LIGHTS OUT', this.lightsOut)
    lightsOutCheckbox.position.x = 168
    lightsOutCheckbox.position.y = 320
    lightsOutCheckbox.on('pointertap', this.actionToggleLightsOut.bind(this, lightsOutCheckbox))
    this.container.addChild(lightsOutCheckbox)

    const inCrisisCheckbox = new CheckBox('IN CRISIS', this.inCrisis)
    inCrisisCheckbox.position.x = 418
    inCrisisCheckbox.position.y = 320
    inCrisisCheckbox.on('pointertap', this.actionToggleCrisisMode.bind(this, inCrisisCheckbox))
    this.container.addChild(inCrisisCheckbox)
  }

  private drawStartButton(): void {
    const buttonStyle = {
      fontFamily: 'main',
      fontSize: 32,
      fill: 0x3CBCFC,
    }

    const buttonText = this.isPaused ? 'RESUME' : 'PUSH START'
    const buttonAction = this.isPaused ? this.actionResumeGame : this.actionStartGame

    const button = new Pixi.Text(buttonText, buttonStyle)
    button.position.x = Math.floor((CONTAINER_WIDTH - button.width) / 2)
    button.position.y = 376
    button.interactive = true
    button.buttonMode = true
    button.on('tap', buttonAction.bind(this, true))
    button.on('click', buttonAction.bind(this, false))
    this.container.addChild(button)
  }

  private drawCreditsText(): void {
    const creditText = {
      fontFamily: 'main',
      fontSize: 12,
      fill: 0x7C7C7C,
    }

    const linkText = {
      fontFamily: 'main',
      fontSize: 12,
      fill: 0xAAAAAA,
    }

    const text1 = new Pixi.Text('Made by ', creditText)
    const text2 = new Pixi.Text('@sdrmme', linkText)

    text1.position.x = (CONTAINER_WIDTH - text1.width - text2.width) / 2
    text1.position.y = CONTAINER_HEIGHT - 32
    this.container.addChild(text1)

    text2.position.x = text1.position.x + text1.width
    text2.position.y = text1.position.y
    text2.interactive = true
    text2.buttonMode = true
    text2.on('pointertap', (): void => {
      window.open('https://twitter.com/sdrmme', '_blank')
    })
    this.container.addChild(text2)

    const text3 = new Pixi.Text('Based on work by ', creditText)
    const text4 = new Pixi.Text('@dontsave', linkText)

    text3.position.x = (CONTAINER_WIDTH - text3.width - text4.width) / 2
    text3.position.y = CONTAINER_HEIGHT - 16
    this.container.addChild(text3)

    text4.position.x = text3.position.x + text3.width
    text4.position.y = text3.position.y
    text4.interactive = true
    text4.buttonMode = true
    text4.on('pointertap', (): void => {
      window.open('https://twitter.com/dontsave', '_blank')
    })
    this.container.addChild(text4)
  }

  private loadSettings(): void {
    const settingsJson = window.localStorage.getItem('settings')
    if (!settingsJson) return

    try {
      const settings: Settings = JSON.parse(settingsJson)
      this.hiScore = settings.hiScore
      this.selectedMusic = settings.music
      this.sfxOn = settings.sfx
      this.lightsOut = settings.lightsOut
      this.inCrisis = settings.crisis
    } catch (err) {
      // Ignore silently
    }
  }

  private saveSettings(): void {
    const settings: Settings = {
      hiScore: this.hiScore,
      music: this.selectedMusic,
      sfx: this.sfxOn,
      lightsOut: this.lightsOut,
      crisis: this.inCrisis,
    }

    window.localStorage.setItem('settings', JSON.stringify(settings))
  }

  private playMusic(index: number = this.selectedMusic): void {
    const sound = this.app.sound

    if (this.inCrisis) {
      sound.setMusic(bgmCrisis, bgmCrisis)
      sound.playSlowMusic()
      return
    }

    if (index >= 3) {
      sound.removeMusic()
      return
    }

    const [music, musicFast] = MUSIC_TRACKS[index]
    sound.setMusic(music, musicFast)

    if (this.panicMode) {
      sound.playFastMusic()
    } else {
      sound.playSlowMusic()
    }
  }

  private actionSelectMusic(index: number): void {
    this.selectedMusic = index
    this.saveSettings()

    if (!this.inCrisis || !this.app.sound.isMusicPlaying()) {
      this.playMusic(this.selectedMusic)
    }

    this.musicCheckboxes.forEach((checkBox, i): void => {
      const selected = (i === index)
      checkBox.setChecked(selected)
      checkBox.interactive = !selected
      checkBox.buttonMode = !selected
    })

    this.app.sound.playSfx('beep')
  }

  private actionToggleSfx(checkbox: CheckBox): void {
    this.sfxOn = !this.sfxOn

    checkbox.setChecked(this.sfxOn)
    this.app.sound.setSfxEnabled(this.sfxOn)
    this.app.sound.playSfx('beep')

    this.saveSettings()
  }

  private actionToggleLightsOut(checkbox: CheckBox): void {
    this.lightsOut = !this.lightsOut

    checkbox.setChecked(this.lightsOut)
    this.app.sound.playSfx('beep')

    this.saveSettings()
  }

  private actionToggleCrisisMode(checkbox: CheckBox): void {
    this.inCrisis = !this.inCrisis

    checkbox.setChecked(this.inCrisis)
    this.app.sound.playSfx('beep')

    if (this.inCrisis) {
      this.app.sound.setMusic(bgmCrisis, bgmCrisis)
      this.app.sound.playSlowMusic()
    } else {
      this.playMusic()
    }

    this.saveSettings()
  }

  private actionStartGame(touch = false): void {
    if (touch) this.requestFullScreen()

    this.app.sound.playSfx('beep')

    if (!this.app.sound.isMusicPlaying()) {
      this.playMusic()
    }

    this.manager.switchTo(new SceneStage(this.app, {
      hiScore: this.hiScore,
      lightsOut: this.lightsOut,
      crisisMode: this.inCrisis,
      touchControls: touch,
    }))
  }

  private actionResumeGame(touch = false): void {
    if (touch) this.requestFullScreen()

    this.app.sound.playSfx('pause')

    this.manager.pop({
      lightsOut: this.lightsOut,
      crisisMode: this.inCrisis,
      touchControls: touch,
    })
  }

  public onResize(width: number, height: number): void {
    const minWidth = CONTAINER_WIDTH
    const minHeight = CONTAINER_HEIGHT
    let scale = 1

    // Check width first
    if (width < minWidth) {
      scale = width / minWidth
    }

    // Check the scaled height (if scaled)
    if (height < minHeight * scale) {
      scale = height / minHeight
    }

    this.container.position.x = Math.floor(width / 2)
    this.container.position.y = Math.floor(height / 2)

    this.container.scale.x = scale
    this.container.scale.y = scale

    super.onResize(width, height)
  }

  public onProcessInput(input: Input): void {
    const playerInput = input.getFor(0)

    if (this.isPaused) {
      if (playerInput.isPressed(Buttons.Pause)) {
        this.actionResumeGame()
      }
      return
    }

    if (playerInput.isPressed(Buttons.Pause | Buttons.Drop | Buttons.Rotate)) {
      this.actionStartGame()
    }
  }

  private requestFullscreen(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = document.body as any

    if (body.requestFullscreen) {
      body.requestFullscreen()
    } else if (body.webkitRequestFullscreen) {
      body.webkitRequestFullscreen()
    } else if (body.mozRequestFullScreen) {
      body.mozRequestFullScreen()
    } else if (body.msRequestFullscreen) {
      body.msRequestFullscreen()
    }
  }
}
