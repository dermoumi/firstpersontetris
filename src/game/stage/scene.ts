import SceneBase from 'game/scene/base'
import Assets from 'game/assets'
import GameApp from 'game/app'
import Tetromino, { TetrominoAngle } from './tetromino'
import StageGrid, { WIDTH as GRID_WIDTH, HEIGHT as GRID_HEIGHT, CELL_SIZE, CompleteRow } from './grid'
import Input from 'game/input'
import * as Pixi from 'pixi.js'
import Block, { BlockType, BLOCK_SIZE } from './block'
import { COLOR_TABLE, SCORE_TABLE, STEP_TIME_TABLE } from './constants'
import SettingsScene, { StageData } from 'game/settings/scene'
import { Buttons } from 'game/config'
import SubSprite from 'game/utils/subsprite'

const GRID_SCREEN_X = 192
const GRID_SCREEN_Y = 80
const NEXT_SCREEN_X = 384
const NEXT_SCREEN_Y = 210

export interface StageSceneUserdata {
  level?: number;
  firstPerson?: boolean;
  lightsOut?: boolean;
  crisisMode?: boolean;
  hiScore?: number;
  touchControls?: boolean;
}

export interface StageSettings {
  lightsOut: boolean;
  crisisMode: boolean;
  touchControls: boolean;
}

enum StageState {
  Paused,
  Idle,
  RotationAnimation,
  RowAnimation,
  DropAnimation,
  GameOver,
  AdjustingCamera,
}

export default class StageScene extends SceneBase {
  private _grid = new StageGrid()
  private _state = StageState.Idle

  private _stepTime = 0
  private _stepDuration = 0.799

  private _animationTime = 0

  private _animateRotation = true
  private _rotationDuration = 0.2

  private _completeRows: CompleteRow[] = []
  private _completeRowsBlocks: Block[][] = []
  private _completeRowsContainer = new Pixi.Container()
  private _rowAnimationDuration = 0.5

  private _animateDrop = true
  private _dropAnimationDuration = 0.2
  private _dropTargetY = 0
  private _dropStartPos = 0

  private _gameOverAnimationDuration = 2.4
  private _gameOverCurtain = new Pixi.Graphics()
  private _curtainTexture!: Pixi.RenderTexture
  private _unrotateDuration = this._gameOverAnimationDuration / 3

  private _cameraAdjustTime = 0.2
  private _adjustCameraTarget: [number, number] = [0, 0]
  private _adjustCameraSource: [number, number] = [0, 0]

  private _flickerCounter = 0
  private _scanLinesTime = 0
  private _scanDuration = 3

  private _lastTetrominoAngle = TetrominoAngle.Deg0

  private _firstPersonMode = true
  private _lightsOutMode = false
  private _inCrisisMode = false

  private _currentTetromino: Tetromino
  private _nextTetromino: Tetromino
  private _playerX = 0
  private _playerY = 0

  private _hasWallKick = true
  private _hasLockDelay = false

  private _startingLevel = 0
  private _level = 0
  private _levelUi!: Pixi.Text

  private _lines = 0
  private _linesUi!: Pixi.Text

  private _statistics: Record<string, number> = {}
  private _statisticsUi: Record<string, Pixi.Text> = {}
  private _statsPiecesUi = new Pixi.Container()

  private _score = 0
  private _scoreUi!: Pixi.Text

  private _hiScore = 10000
  private _hiScoreUi!: Pixi.Text

  private _flicker = new Pixi.Graphics()
  private _scanLines = new Pixi.Graphics()

  private _screenUi: SubSprite
  private _roomBg: Pixi.Sprite
  private _screenOverlay: Pixi.Sprite
  private _screenUiValues = new Pixi.Container()
  private _screen = new Pixi.Container()
  private _room = new Pixi.Container()

  private _leftHeld = false
  private _rightHeld = false
  private _downHeld = false
  private _xHoldTimer = 0
  private _yHoldTimer = 0
  private _holdMinDuration = 0.1
  private _holdRepeatInterval = 0.06
  private _forceCheckInput = false

  private _dropStartY = -1
  private _yHoldStart = -1

  private _gameOverInitRotation = 0
  private _gameOverInitPivotX = 0
  private _gameOverInitPivotY = 0

  private _panic = false

  private _touchControls = false
  private _touchContainer = new Pixi.Container()
  private _touchDpad = new Pixi.Container()
  private _touchButtons = new Pixi.Container()

  private PRESS_DIR: Record<number, Function[]> = {
    [Buttons.Left]: [
      this._pressLeft.bind(this),
      (): void => {},
      this._pressRight.bind(this),
      this._pressDown.bind(this),
    ],
    [Buttons.Right]: [
      this._pressRight.bind(this),
      this._pressDown.bind(this),
      this._pressLeft.bind(this),
      (): void => {},
    ],
    [Buttons.Down]: [
      this._pressDown.bind(this),
      this._pressLeft.bind(this),
      (): void => {},
      this._pressRight.bind(this),
    ],
    [Buttons.Up]: [
      (): void => {},
      this._pressRight.bind(this),
      this._pressDown.bind(this),
      this._pressLeft.bind(this),
    ],
  }

  private RELEASE_DIR: Record<number, Function[]> = {
    [Buttons.Left]: [
      this._releaseLeft.bind(this),
      (): void => {},
      this._releaseRight.bind(this),
      this._releaseDown.bind(this),
    ],
    [Buttons.Right]: [
      this._releaseRight.bind(this),
      this._releaseDown.bind(this),
      this._releaseLeft.bind(this),
      (): void => {},
    ],
    [Buttons.Down]: [
      this._releaseDown.bind(this),
      this._releaseLeft.bind(this),
      (): void => {},
      this._releaseRight.bind(this),
    ],
    [Buttons.Up]: [
      (): void => {},
      this._releaseRight.bind(this),
      this._releaseDown.bind(this),
      this._releaseLeft.bind(this),
    ],
  }

  public constructor(app: GameApp, userdata: StageSceneUserdata = {}) {
    super(app)

    if (userdata.level !== undefined) {
      this._level = this._startingLevel = userdata.level
      this._updateStepDuration()
    }

    if (userdata.firstPerson !== undefined) {
      this._firstPersonMode = userdata.firstPerson
    }

    if (userdata.hiScore !== undefined) {
      this._hiScore = userdata.hiScore
    }

    if (window.location.hash.startsWith('#tps') || window.location.hash.indexOf(',tps') >= 0) {
      this._firstPersonMode = false
      this._animateRotation = false
    }

    this._screen.sortableChildren = true

    this._grid.position.x = GRID_SCREEN_X
    this._grid.position.y = GRID_SCREEN_Y
    this._screen.addChild(this._grid)

    this._completeRowsContainer.position.x = GRID_SCREEN_X
    this._completeRowsContainer.position.y = GRID_SCREEN_Y
    this._screen.addChild(this._completeRowsContainer)

    const stageBgRect = new Pixi.Rectangle(0, 0, 256, 224)

    this._screenUi = new SubSprite(Assets.stage.texture, stageBgRect)
    this._screenUi.scale.x = 2
    this._screenUi.scale.y = 2
    this._screenUi.zIndex = 100
    this._screen.addChild(this._screenUi)

    this._flicker.alpha = 0.05
    this._flicker.zIndex = 120
    this._flicker.beginFill(0x000000)
    this._flicker.drawRect(0, 0, 2 * stageBgRect.width, 2 * stageBgRect.height)
    this._screen.addChild(this._flicker)

    this._scanLines.alpha = 0.15
    this._scanLines.zIndex = 125
    this._scanLines.beginFill(0x000000)
    this._scanLines.drawRect(0, 0, 2 * stageBgRect.width, 176)
    this._screen.addChild(this._scanLines)

    this._levelUi = this._createUiText(`0${this._level}`.substr(-2), 416, 314)
    this._linesUi = this._createUiText('000', 304, 26)
    this._scoreUi = this._createUiText('000000', 384, 106)
    this._hiScoreUi = this._createUiText(`00000${this._hiScore}`.substr(-6), 384, 58)

    this._screenUiValues.zIndex = 110
    this._screen.addChild(this._screenUiValues)

    const tetrominoTypes = ['T', 'Z', 'J', 'O', 'L', 'S', 'I']
    tetrominoTypes.forEach((type, i): void => {
      this._statistics[type] = 0
      this._statisticsUi[type] = this._createUiText('000', 96, 170 + i * 32, 0xF83800)
    })

    this._statsPiecesUi.position.x = 48
    this._statsPiecesUi.position.y = 160
    this._statsPiecesUi.zIndex = 110
    this._screen.addChild(this._statsPiecesUi)

    this._gameOverCurtain.position.x = GRID_SCREEN_X
    this._gameOverCurtain.position.y = GRID_SCREEN_Y
    this._gameOverCurtain.zIndex = 120
    this._screen.addChild(this._gameOverCurtain)

    this._roomBg = Pixi.Sprite.from(Assets.room.texture)
    this._room.addChild(this._roomBg)

    this._screen.position.x = 740
    this._screen.position.y = 768
    this._screen.scale.x = 425 / (stageBgRect.width * 2)
    this._screen.scale.y = 372 / (stageBgRect.height * 2)
    this._room.addChild(this._screen)

    this._screenOverlay = Pixi.Sprite.from(Assets.screen.texture)
    this._screenOverlay.position.x = 733
    this._screenOverlay.position.y = 584
    this._room.addChild(this._screenOverlay)

    this._room.pivot.x = Assets.room.texture.width / 2
    this._room.pivot.y = Assets.room.texture.height / 2
    this._room.scale.x = 1.25
    this._room.scale.y = 1.25

    this.stage.addChild(this._room)

    this._nextTetromino = this._getNextTetromino()
    this._currentTetromino = this._spawnTetromino()

    if (userdata.lightsOut !== undefined) {
      this._lightsOutMode = userdata.lightsOut
      this._updateLightsOutMode()
    }

    if (userdata.crisisMode !== undefined) {
      this._inCrisisMode = userdata.crisisMode
      this._updateCrisisMode()
    }

    if (userdata.touchControls === true) {
      this._touchControls = true
      this._setupTouchControls()
    }

    this._updateColors()
    this._updateScreenPos()
    this._updateScreenRotation()
  }

  private _getColors(): [number, number] {
    return COLOR_TABLE[this._level % COLOR_TABLE.length]
  }

  private _updateColors(): void {
    const [color1, color2] = this._getColors()

    // Update the colors of the grid
    this._grid.setColors(color1, color2)

    // Update the colors of the current and next tetrominos
    this._nextTetromino.setColors(color1, color2)
    this._currentTetromino.setColors(color1, color2)

    // Update the statistics pieces color
    this._statsPiecesUi.removeChildren()

    const statsRect = new Pixi.Rectangle(24, 80, 24, 112)

    const colorLayer = new Pixi.Graphics()
    colorLayer.beginFill(color1)
    colorLayer.drawRect(0, 0, statsRect.width * 2, statsRect.height * 2)
    colorLayer.endFill()
    colorLayer.beginFill(color2)
    colorLayer.drawRect(2, 72, 38, 26)
    colorLayer.drawRect(2, 166, 38, 26)
    colorLayer.endFill()
    this._statsPiecesUi.addChild(colorLayer)

    const piecesOverlay = new SubSprite(Assets.stage.texture, statsRect)
    piecesOverlay.scale.x = 2
    piecesOverlay.scale.y = 2
    this._statsPiecesUi.addChild(piecesOverlay)
  }

  private _createUiText(text: string, posX: number, posY: number, fill = 0xFFFFFF): Pixi.Text {
    const uiText = new Pixi.Text(text, {
      fontFamily: 'main',
      fontSize: 82,
      fill,
    })
    uiText.position.x = posX
    uiText.position.y = posY
    uiText.scale.x = 0.25
    uiText.scale.y = 0.25
    uiText.resolution = 2
    uiText.roundPixels = true
    uiText.visible = !this._lightsOutMode
    this._screenUiValues.addChild(uiText)
    return uiText
  }

  public onEnter(userdata?: StageSettings): void {
    super.onEnter(userdata)

    if (userdata !== undefined) {
      if (this._lightsOutMode !== userdata.lightsOut) {
        this._lightsOutMode = userdata.lightsOut
        this._updateLightsOutMode()
      }

      if (this._inCrisisMode !== userdata.crisisMode) {
        this._inCrisisMode = userdata.crisisMode
        this._updateCrisisMode()
      }

      if (!this._touchControls && userdata.touchControls) {
        this._touchControls = true
        this._setupTouchControls()

        const { width, height } = this.app.getSize()
        this.onResize(width, height)
      }
    }
  }

  public onUpdate(frameTime: number): void {
    if (this._state === StageState.Paused) {
      return
    }

    if (this._state === StageState.Idle) {
      this._updateIdle(frameTime)
    }

    if (this._state === StageState.RotationAnimation) {
      this._updateRotation(frameTime)
    }

    if (this._state === StageState.RowAnimation) {
      this._updateRowAnimation(frameTime)
    }

    if (this._state === StageState.DropAnimation) {
      this._updateDropAnimation(frameTime)
    }

    if (this._state === StageState.GameOver) {
      this._updateGameOver(frameTime)
    }

    if (this._state === StageState.AdjustingCamera) {
      this._updateCameraAdjustment(frameTime)
    }

    this._updateFlicker(frameTime)
  }

  public onProcessInput(input: Input, frameTime: number): void {
    const directions = [Buttons.Left, Buttons.Right, Buttons.Down, Buttons.Up]
    const angle = this._effectiveAngle()
    const player = input.getFor(0)

    if (player.isPressed(Buttons.Pause)) {
      this._pause()
    }

    directions.forEach((direction): void => {
      if (player.isReleased(direction)) {
        this._releaseAction(direction, angle)
      }
    })

    if (this._state === StageState.Idle) {
      directions.forEach((direction): void => {
        if (player.isPressed(direction) || (this._forceCheckInput && player.isDown(direction))) {
          this._pressAction(direction, angle)
          this._forceCheckInput = false
        }
      })

      if (player.isPressed(Buttons.Rotate)) {
        this._rotate()
      }

      if (player.isPressed(Buttons.Drop)) {
        this._hardDrop()
      }

      if (this._leftHeld || this._rightHeld) {
        this._xHoldTimer += frameTime
        if (this._xHoldTimer > this._holdRepeatInterval + this._holdMinDuration) {
          const extraTime = this._xHoldTimer - this._holdMinDuration
          this._xHoldTimer = this._holdMinDuration + (extraTime % this._holdRepeatInterval)

          if (this._leftHeld) {
            this._moveLeft()
          } else {
            this._moveRight()
          }
        }
      }

      if (this._downHeld) {
        this._yHoldTimer += frameTime
        if (this._yHoldTimer > this._holdRepeatInterval + this._holdMinDuration) {
          const extraTime = this._yHoldTimer - this._holdMinDuration
          this._yHoldTimer = this._holdMinDuration + (extraTime % this._holdRepeatInterval)

          if (this._yHoldStart === -1) {
            this._yHoldStart = this._playerY
          }

          this._moveDown()
        }
      }
    }

    super.onProcessInput(input, frameTime)
  }

  private _effectiveAngle(): TetrominoAngle {
    return (this._lastTetrominoAngle + this._currentTetromino.getAngle()) % 4
  }

  private _pressAction(direction: Buttons, angle = this._effectiveAngle()): void {
    if (this._firstPersonMode) {
      this.PRESS_DIR[direction][angle]()
    } else if (direction === Buttons.Left) {
      this._pressLeft()
    } else if (direction === Buttons.Right) {
      this._pressRight()
    } else if (direction === Buttons.Down) {
      this._pressDown()
    }
  }

  private _releaseAction(direction: Buttons, angle = this._effectiveAngle()): void {
    if (this._firstPersonMode) {
      this.RELEASE_DIR[direction][angle]()
    } else if (direction === Buttons.Left) {
      this._releaseLeft()
    } else if (direction === Buttons.Right) {
      this._releaseRight()
    } else if (direction === Buttons.Down) {
      this._releaseDown()
    }
  }

  private _pressLeft(): void {
    this._moveLeft()

    this._leftHeld = true
    this._xHoldTimer = 0
  }

  private _releaseLeft(): void {
    this._leftHeld = false
  }

  private _pressRight(): void {
    this._moveRight()

    this._rightHeld = true
    this._xHoldTimer = 0
  }

  private _releaseRight(): void {
    this._rightHeld = false
  }

  private _pressDown(): void {
    this._moveDown()

    this._downHeld = true
    this._yHoldTimer = 0
  }

  private _releaseDown(): void {
    this._downHeld = false
    this._yHoldStart = -1
  }

  private _getNextTetromino(): Tetromino {
    const tetromino = Tetromino.getRandom()

    const [color1, color2] = this._getColors()
    tetromino.setColors(color1, color2)

    const [centerX, centerY] = tetromino.getCenter()
    tetromino.setX(NEXT_SCREEN_X + CELL_SIZE * (2 - centerX))
    tetromino.setY(NEXT_SCREEN_Y + CELL_SIZE * (2 - centerY))
    tetromino.visible = !this._lightsOutMode

    this._screen.addChild(tetromino)
    return tetromino
  }

  private _spawnTetromino(): Tetromino {
    if (this._currentTetromino) {
      this._screen.removeChild(this._currentTetromino)
      this._lastTetrominoAngle = (this._lastTetrominoAngle + this._currentTetromino.getAngle()) % 4
    }

    const tetromino = this._nextTetromino
    tetromino.visible = true
    this._increaseStatistics(tetromino.getName())

    this._nextTetromino = this._getNextTetromino()

    this._playerX = Math.ceil(GRID_WIDTH / 2 - tetromino.getSize() / 2)

    for (this._playerY = -tetromino.getSize(); this._playerY < -tetromino.getOffset(); ++this._playerY) {
      if (this._grid.collidesWith(tetromino, this._playerX, this._playerY + 1)) {
        break
      }
    }

    tetromino.setX(GRID_SCREEN_X + CELL_SIZE * this._playerX)
    tetromino.setY(GRID_SCREEN_Y + CELL_SIZE * this._playerY)

    this._stepTime = 0

    // Check collision and gameover
    if (this._playerY < -tetromino.getOffset()) {
      this._initGameOver()
    }

    return tetromino
  }

  private _updateIdle(frameTime: number): void {
    this._stepTime += frameTime
    if (this._stepTime > this._stepDuration) {
      this._stepTime = this._stepTime % this._stepDuration

      if (!this._downHeld) {
        this._performStep()
      }
    }
  }

  private _performStep(): void {
    this._moveDown()
  }

  private _updateRotation(frameTime: number): void {
    this._animationTime += frameTime
    if (this._animationTime > this._rotationDuration) {
      this._animationTime = this._rotationDuration
      this.setState(StageState.Idle)
    }

    const percent = this._animationTime / this._rotationDuration
    this._currentTetromino.angle = -90 + 90 * percent
    this._updateScreenRotation()
  }

  private _updateRowAnimation(frameTime: number): void {
    if (this._animationTime === this._rowAnimationDuration) {
      // Shift back to the idle state and leave method
      this.setState(StageState.Idle)

      // Update level
      this._updateLevel()

      // Shift rows in the grid
      this._completeRows.forEach(({ row }): void => {
        this._grid.removeRow(row)
      })
      this._grid.update()

      // Post-Unite routine
      this._postUnite()

      // Empty the complete rows container to avoid unecessary invisible renders
      this._completeRowsContainer.removeChildren()
      return
    }

    this._animationTime += frameTime
    if (this._animationTime > this._rowAnimationDuration) {
      this._animationTime = this._rowAnimationDuration
    }

    const steps = Math.ceil(GRID_WIDTH / 2)
    const blendTime = (this._rowAnimationDuration / steps) / 2
    const interval = (this._rowAnimationDuration - blendTime) / steps
    const stepDuration = interval + blendTime

    const oddWidth = (GRID_WIDTH % 2 === 1)
    const halfWidth = Math.floor(GRID_WIDTH / 2)

    if (oddWidth) {
      // Do the middle block first
      const percent = 1 - Math.max(Math.min(this._animationTime / stepDuration, 1), 0)
      this._completeRowsBlocks.forEach((row): void => {
        const block = row[halfWidth]
        block.scale.x = percent
        block.scale.y = percent
      })
    }

    for (let i = oddWidth ? 1 : 0; i < halfWidth; ++i) {
      const percent = 1 - Math.max(Math.min((this._animationTime - i * interval)/ stepDuration, 1), 0)

      this._completeRowsBlocks.forEach((row): void => {
        // Do block on the left
        const leftBlock = row[halfWidth - i - 1]
        leftBlock.scale.x = percent
        leftBlock.scale.y = percent

        // Do block on the right
        const rightBlock = row[halfWidth + i]
        rightBlock.scale.x = percent
        rightBlock.scale.y = percent
      })
    }
  }

  private _moveLeft(): void {
    if (!this._grid.collidesWith(this._currentTetromino, this._playerX - 1, this._playerY)) {
      this._playerX--
      this._currentTetromino.setX(GRID_SCREEN_X + this._playerX * CELL_SIZE)
      this._updateScreenPos()
    }
  }

  private _moveRight(): void {
    if (!this._grid.collidesWith(this._currentTetromino, this._playerX + 1, this._playerY)) {
      this._playerX++
      this._currentTetromino.setX(GRID_SCREEN_X + this._playerX * CELL_SIZE)
      this._updateScreenPos()
    }
  }

  private _moveDown(resetStepTime = false): void {
    if (this._grid.collidesWith(this._currentTetromino, this._playerX, this._playerY + 1)) {
      this._uniteTetromino()
    } else {
      this._playerY++
      this._currentTetromino.setY(GRID_SCREEN_Y + this._playerY * CELL_SIZE)
      this._updateScreenPos()
      if (resetStepTime) {
        this._stepTime = 0
      }
    }
  }

  private _rotate(): void {
    const nextAngle = (this._currentTetromino.getAngle() + 1) % 4

    let playerX = this._playerX
    let playerY = this._playerY
    let collides = this._grid.collidesWith(this._currentTetromino, playerX, playerY, nextAngle)
    const halfSize = Math.floor(this._currentTetromino.getSize() / 2)

    // Check if it still collides if moved n blocks to the left or n blocks to the right
    if (collides && this._hasWallKick) {
      let shiftedPlayerX: number
      for (let i = 1; i <= halfSize; ++i) {
        // Test from the left
        shiftedPlayerX = this._playerX - i
        collides = this._grid.collidesWith(this._currentTetromino, shiftedPlayerX, playerY, nextAngle)
        if (!collides) {
          playerX = shiftedPlayerX
          break
        }

        // Test from the right
        shiftedPlayerX = this._playerX + i
        collides = this._grid.collidesWith(this._currentTetromino, shiftedPlayerX, playerY, nextAngle)
        if (!collides) {
          playerX = shiftedPlayerX
          break
        }
      }
    }

    if (!collides) {
      this._initRotation(nextAngle, playerX, playerY)
    }
  }

  private _hardDrop(): void {
    this._dropStartY = Math.max(0, this._playerY)
    this._dropTargetY = this._playerY
    while (!this._grid.collidesWith(this._currentTetromino, this._playerX, this._dropTargetY + 1)) {
      this._dropTargetY++
    }

    if (this._animateDrop) {
      this.setState(StageState.DropAnimation)
      this._animationTime = 0
      this._dropStartPos = this._currentTetromino.position.y - this._currentTetromino.pivot.y
    } else {
      this._playerY = this._dropTargetY
      this._uniteTetromino()
    }
  }

  private _uniteTetromino(): void {
    const completeRows = this._grid.unite(this._currentTetromino, this._playerX, this._playerY)
    this._grid.update()
    this._currentTetromino.visible = false

    if (completeRows.length > 0) {
      this._initRowsAnimation(completeRows)
    } else {
      this._increaseDropScore()

      this.app.sound.playSfx('united')
      this._postUnite()
    }
  }

  private _initRotation(angle: TetrominoAngle, playerX = this._playerX, playerY = this._playerY): void {
    this.app.sound.playSfx('rotate')

    this._playerX = playerX
    this._playerY = playerY
    this._currentTetromino.setAngle(angle)
    this._currentTetromino.setX(GRID_SCREEN_X + this._playerX * CELL_SIZE)
    this._currentTetromino.setY(GRID_SCREEN_Y + this._playerY * CELL_SIZE)
    this._currentTetromino.update()
    this._updateScreenPos()

    // Reset step time when rotating if lock delay is on
    if (this._hasLockDelay && this._grid.collidesWith(this._currentTetromino, this._playerX, this._playerY + 1)) {
      this._stepTime = 0
    }

    if (this._animateRotation) {
      this._animationTime = 0
      this._currentTetromino.angle = -90
      this.setState(StageState.RotationAnimation)
    } else {
      this._updateScreenRotation()
    }

    // Reset keys hold state when rotating in first-person mode
    // Wouldn't register them as released when the new angle is on
    if (this._firstPersonMode) {
      this._leftHeld = false
      this._rightHeld = false
      this._downHeld = false

      // Sorry to all the hardcore people counting on maximizing score ¯\_(ツ)_/¯
      this._yHoldStart = -1
    }
  }

  private _initRowsAnimation(completeRows: CompleteRow[]): void {
    this._completeRows = completeRows
    this._increaseLineCount(completeRows.length)
    this._increaseLineScore(completeRows.length)
    this._increaseDropScore()

    // Play row completed sound
    if (completeRows.length < 4) {
      this.app.sound.playSfx('line')
    } else {
      this.app.sound.playSfx('tetris')
    }

    this._completeRowsContainer.removeChildren()
    this._completeRowsBlocks = []

    const colors = this._getColors()

    completeRows.forEach(({ row, blocks }): void => {
      const blockArray = blocks.map((colorIndex, index): Block => {
        const color = colors[(colorIndex - 1) % 2]
        const type = colorIndex === 1 ? BlockType.Block1 : BlockType.Block2

        const block = new Block(color, type)
        this._completeRowsContainer.addChild(block)

        block.pivot.x = Math.floor(BLOCK_SIZE / 2)
        block.pivot.y = Math.floor(BLOCK_SIZE / 2)
        block.position.x = index * CELL_SIZE + block.pivot.x
        block.position.y = row * CELL_SIZE + block.pivot.y

        return block
      })

      this._completeRowsBlocks.push(blockArray)
    })

    this._animationTime = 0
    this.setState(StageState.RowAnimation)
  }

  private _setLevel(level: number): void {
    if (this._level === level) return

    this._level = level
    this._levelUi.text = `0${level}`.substr(-2)

    this._updateStepDuration()

    this._updateColors()
    this.app.sound.playSfx('level')
  }

  private _updateStepDuration(): void {
    this._stepDuration = STEP_TIME_TABLE[this._level] || .017
  }

  private _increaseStatistics(type: string): void {
    const count = ++this._statistics[type]
    this._statisticsUi[type].text = `00${count}`.substr(-3)
  }

  private _increaseLineCount(count = 1): void {
    this._lines += count
    this._linesUi.text = `00${this._lines}`.substr(-3)
  }

  private _increaseLineScore(lineCount = 1): void {
    const score = SCORE_TABLE[Math.min(lineCount - 1, 3)] * (this._level + 1)

    this._score += score
    this._updateScore()
  }

  private _updateLevel(): void {
    const level = Math.floor(this._lines / 10) + this._startingLevel
    this._setLevel(level)
  }

  private _updateDropAnimation(frameTime: number): void {
    if (this._animationTime === this._dropAnimationDuration) {
      this._playerY = this._dropTargetY
      this.setState(StageState.Idle)
      this._uniteTetromino()
      return
    }

    this._animationTime += frameTime
    if (this._animationTime > this._dropAnimationDuration) {
      this._animationTime = this._dropAnimationDuration
    }

    const percent = this._animationTime / this._dropAnimationDuration
    const distance = GRID_SCREEN_Y + this._dropTargetY * CELL_SIZE - this._dropStartPos

    this._currentTetromino.setY(this._dropStartPos + distance * percent * percent)
    this._updateScreenPos()
  }

  private _initGameOver(): void {
    this.app.sound.playSfx('over')
    this.setState(StageState.GameOver)
    this._animationTime = 0

    const baseRenderTexture = new Pixi.BaseRenderTexture({
      width: 16,
      height: 16,
      scaleMode: Pixi.SCALE_MODES.NEAREST,
      resolution: 1,
    })
    this._curtainTexture = new Pixi.RenderTexture(baseRenderTexture)

    const [color1, color2] = this._getColors()

    const curtainBlock = new Pixi.Graphics()
    curtainBlock.beginFill(0x000000)
    curtainBlock.drawRect(0, 0, 16, 16)
    curtainBlock.beginFill(color2)
    curtainBlock.drawRect(0, 0, 16, 4)
    curtainBlock.beginFill(0xFFFFFF)
    curtainBlock.drawRect(0, 4, 16, 6)
    curtainBlock.beginFill(color1)
    curtainBlock.drawRect(0, 10, 16, 4)

    this.app.renderer.render(curtainBlock, this._curtainTexture)

    this._gameOverInitRotation = this._room.angle
    this._gameOverInitPivotX = this._room.pivot.x
    this._gameOverInitPivotY = this._room.pivot.y
  }

  private _updateGameOver(frameTime: number): void {
    if (this._animationTime === this._gameOverAnimationDuration) {
      this.manager.switchTo(new SettingsScene(this.app, {
        gameOver: {
          level: this._level,
          lines: this._lines,
          score: this._score,
          hiScore: this._hiScore,
          panic: this._panic,
        },
      }))
    }

    this._animationTime = this._animationTime + frameTime
    if (this._animationTime > this._gameOverAnimationDuration) {
      this._animationTime = this._gameOverAnimationDuration
    }

    const percent = this._animationTime / this._gameOverAnimationDuration
    const curtain = this._gameOverCurtain
    curtain.clear()
    curtain.beginTextureFill(this._curtainTexture)
    curtain.drawRect(0, 0, GRID_WIDTH * CELL_SIZE, GRID_HEIGHT * CELL_SIZE * percent)

    // Center the screen and unrotate to 0deg
    const unrotatePercent = Math.min(this._animationTime, this._unrotateDuration) / this._unrotateDuration
    const unrotatePercent1 = 1 - unrotatePercent

    let initRotation = this._gameOverInitRotation
    if (initRotation > 180) initRotation -= 360
    if (initRotation < -180) initRotation += 360
    this._room.angle = initRotation * unrotatePercent1

    this._room.pivot.x = this._gameOverInitPivotX * unrotatePercent1
      + ((this._room.width / 2) / this._room.scale.x) * unrotatePercent
    this._room.pivot.y = this._gameOverInitPivotY * unrotatePercent1
      + ((this._room.height / 2) / this._room.scale.y) * unrotatePercent
  }

  public onResize(width: number, height: number): void {
    // Reposition the room inside the view
    const maxWidth = this._inCrisisMode ? CELL_SIZE * 12 : 1300
    const maxHeight = this._inCrisisMode ? CELL_SIZE * 12 : 1300
    const defaultScale = 1.25
    let scale = defaultScale

    // Check max width first
    if (width > maxWidth) {
      scale = width / maxWidth
    }

    // Check the scaled max height (if scaled)
    if (height > maxHeight * scale) {
      scale = height / maxHeight
    }

    if (scale === defaultScale) {
      const minWidth = this._inCrisisMode ? CELL_SIZE * 10 : Assets.screen.texture.width * 1.1
      const minHeight = this._inCrisisMode ? CELL_SIZE * 12 : Assets.screen.texture.height * 1.1

      // Then check min width
      if (width < minWidth) {
        scale = width / minWidth
      }

      // then scaled min height last (if scaled)
      if (height < minHeight * scale) {
        scale = height / minHeight
      }
    }

    this._room.position.x = width / 2
    this._room.position.y = height / 2

    this._room.scale.x = scale
    this._room.scale.y = scale

    // Reposition the touch controller
    if (this._touchControls) {
      const ratio = width / height
      const narrowScreen = ratio < (10 / 16)

      this._touchContainer.position.x = width / 2
      this._touchContainer.position.y = height

      this._touchButtons.position.x = width / 2
      this._touchButtons.position.y = -60

      this._touchDpad.position.x = -width / 2
      this._touchDpad.position.y = -60

      if (narrowScreen) {
        this._room.position.y = (height - 200) / 2
      } else {
        this._room.scale.x *= 1.5
        this._room.scale.y *= 1.5
      }
    }

    super.onResize(width, height)
  }

  private _updateScreenPos(animate = false): void {
    if (!this._firstPersonMode) return

    const tetromino = this._currentTetromino
    const [centerX, centerY] = tetromino.getCenter()
    const tetrominoX = tetromino.position.x - tetromino.pivot.x + centerX * CELL_SIZE
    const tetrominoY = tetromino.position.y - tetromino.pivot.y + centerY * CELL_SIZE
    const x = this._screen.scale.x * tetrominoX + this._screen.position.x
    const y = this._screen.scale.y * tetrominoY + this._screen.position.y

    if (animate && this._state === StageState.Idle) {
      this._adjustCameraTarget = [x, y]
      this._adjustCameraSource = [this._room.pivot.x, this._room.pivot.y]
      this._animationTime = 0
      this.setState(StageState.AdjustingCamera)
    } else {
      this._room.pivot.x = x
      this._room.pivot.y = y
    }
  }

  private _updateScreenRotation(): void {
    if (!this._firstPersonMode) return

    const tetromino = this._currentTetromino
    const angle = tetromino.getAngle() as number
    const lastAngle = this._lastTetrominoAngle as number
    this._room.angle = - lastAngle * 90 - angle * 90 - tetromino.angle
  }

  private _updateCameraAdjustment(frameTime: number): void {
    if (this._animationTime === this._cameraAdjustTime) {
      this.setState(StageState.Idle)
    }

    this._animationTime += frameTime
    if (this._animationTime > this._cameraAdjustTime) {
      this._animationTime = this._cameraAdjustTime
    }

    const percent = this._animationTime / this._cameraAdjustTime
    const [targetX, targetY] = this._adjustCameraTarget
    const [sourceX, sourceY] = this._adjustCameraSource
    this._room.pivot.x = sourceX + (targetX - sourceX) * percent
    this._room.pivot.y = sourceY + (targetY - sourceY) * percent
  }

  private _pause(): void {
    const stageData: StageData = {
      level: this._level,
      lines: this._lines,
      score: this._score,
      hiScore: this._hiScore,
      panic: this._panic,
    }
    this.manager.push(new SettingsScene(this.app, { pause: stageData }))
  }

  private _updateLightsOutMode(): void {
    const visible = !this._lightsOutMode
    this._screenUi.visible = visible
    this._screenUiValues.visible = visible
    this._screenOverlay.visible = visible
    this._roomBg.visible = visible
    this._nextTetromino.visible = visible
    this._statsPiecesUi.visible = visible
    this._flicker.visible = visible
    this._scanLines.visible = visible
  }

  private _updateCrisisMode(): void {
    const { width, height } = this.app.getSize()
    this.onResize(width, height)
  }

  private _updateFlicker(frameTime: number): void {
    this._flicker.alpha = 0.02 + 0.02 * (Math.floor(this._flickerCounter++ / 4) % 3)

    this._scanLinesTime += frameTime
    const percent =  (this._scanLinesTime % this._scanDuration) / this._scanDuration

    this._scanLines.position.y = -177 + 582 * percent
  }

  private _increaseDropScore(currentY = this._playerY): void {
    const factor = this._level + 1

    let dropScore = 0
    if (this._dropStartY !== -1) {
      dropScore = (currentY - this._dropStartY) * factor
    } else if (this._yHoldStart !== -1) {
      dropScore = (currentY - this._yHoldStart) * factor
    }

    if (dropScore > 0) {
      this._score += dropScore
      this._updateScore()
    }

    this._dropStartY = -1
    this._yHoldStart = -1
  }

  private _updateScore(): void {
    this._scoreUi.text = `00000${this._score}`.substr(-6)

    if (this._score > this._hiScore) {
      this._hiScore = this._score
      this._hiScoreUi.text = this._scoreUi.text
    }
  }

  private _postUnite(): void {
    // Spawn new tetromino
    this._currentTetromino = this._spawnTetromino()
    this._updateScreenPos(true)
    this._updateScreenRotation()

    // Should panic
    if (this._panic !== this._grid.shouldPanic()) {
      this._panic = this._grid.shouldPanic()

      if (!this._inCrisisMode) {
        this.app.sound.stopMusic()
        if (this._panic) {
          this.app.sound.playFastMusic()
        } else {
          this.app.sound.playSlowMusic()
        }
      }
    }
  }

  private _setupTouchControls(): void {
    const onScreenControlsTexture = Assets.onScreenControls.texture

    // Pause button
    const pauseBtn = new SubSprite(Assets.ui.texture, new Pixi.Rectangle(16, 34, 14, 14))
    pauseBtn.scale.x = 2
    pauseBtn.scale.y = 2
    pauseBtn.position.x = 16
    pauseBtn.position.y = 16
    pauseBtn.interactive = true
    pauseBtn.on('touchstart', (): void => {
      this._pause()
    })
    this.stage.addChild(pauseBtn)

    // Right buttons
    this._touchContainer.addChild(this._touchButtons)
    const btnUpRect = new Pixi.Rectangle(213, 0, 173, 175)
    const btnDownRect = new Pixi.Rectangle(391, 0, 173, 175)

    // Rotate button
    const btnRotate = new SubSprite(onScreenControlsTexture, btnUpRect)
    btnRotate.pivot.x = btnUpRect.width
    btnRotate.pivot.y = btnUpRect.height
    btnRotate.setSize(110, 110)
    btnRotate.interactive = true
    btnRotate.on('touchstart', (): void => {
      btnRotate.setSubRect(btnDownRect)
      if (this._state === StageState.Idle) {
        this._rotate()
      }
    })
    const btnRotateTouchEnd = (): void => {
      btnRotate.setSubRect(btnUpRect)
    }
    btnRotate.on('touchend', btnRotateTouchEnd)
    btnRotate.on('touchendoutside', btnRotateTouchEnd)
    this._touchButtons.addChild(btnRotate)

    // Drop button
    const btnDrop = new SubSprite(onScreenControlsTexture, btnUpRect)
    btnDrop.pivot.x = btnUpRect.width
    btnDrop.pivot.y = btnUpRect.height - 30
    btnDrop.position.x = -110
    btnDrop.setSize(60, 60)
    btnDrop.interactive = true
    btnDrop.on('touchstart', (): void => {
      btnDrop.setSubRect(btnDownRect)
      if (this._state === StageState.Idle) {
        this._hardDrop()
      }
    })
    const btnDropTouchEnd = (): void => {
      btnDrop.setSubRect(btnUpRect)
    }
    btnDrop.on('touchend', btnDropTouchEnd)
    btnDrop.on('touchendoutside', btnDropTouchEnd)
    this._touchButtons.addChild(btnDrop)

    // Left buttons
    this._touchContainer.addChild(this._touchDpad)

    // Neutral dpad
    const dpadRect = new Pixi.Rectangle(0, 0, 208, 206)
    const dpadDownRect = new Pixi.Rectangle(0, 211, 208, 206)
    const dpadUpRect = new Pixi.Rectangle(213, 211, 208, 206)
    const dpadRightRect = new Pixi.Rectangle(426, 211, 208, 206)
    const dpadLeftRect = new Pixi.Rectangle(639, 211, 208, 206)
    let dpadDir: Buttons | null = null

    const dpad = new SubSprite(onScreenControlsTexture, dpadRect)
    dpad.pivot.y = dpadRect.height - 30
    dpad.setSize(180, 180)
    this._touchDpad.addChild(dpad)

    // Dpad up
    const dpadUp = new Pixi.Container()
    dpadUp.position.x = 62
    dpadUp.position.y = 0
    dpadUp.hitArea = new Pixi.Rectangle(0, 0, 80, 80)
    dpadUp.interactive = true
    dpadUp.on('touchstart', (): void => {
      dpad.setSubRect(dpadUpRect)
      dpadDir = Buttons.Up
      if (this._state === StageState.Idle) {
        this._pressAction(Buttons.Up)
      }
    })
    const dpadUpTouchEnd = (): void => {
      this._releaseAction(Buttons.Up)
      if (dpadDir === Buttons.Up) {
        dpad.setSubRect(dpadRect)
        dpadDir = null
      }
    }
    dpadUp.on('touchend', dpadUpTouchEnd)
    dpadUp.on('touchendoutside', dpadUpTouchEnd)
    dpad.addChild(dpadUp)

    // Dpad down
    const dpadDown = new Pixi.Container()
    dpadDown.position.x = 62
    dpadDown.position.y = 123
    dpadDown.hitArea = new Pixi.Rectangle(0, 0, 80, 80)
    dpadDown.interactive = true
    dpadDown.on('touchstart', (): void => {
      dpad.setSubRect(dpadDownRect)
      dpadDir = Buttons.Down
      if (this._state === StageState.Idle) {
        this._pressAction(Buttons.Down)
      }
    })
    const dpadDownTouchEnd = (): void => {
      this._releaseAction(Buttons.Down)
      if (dpadDir === Buttons.Down) {
        dpad.setSubRect(dpadRect)
        dpadDir = null
      }
    }
    dpadDown.on('touchend', dpadDownTouchEnd)
    dpadDown.on('touchendoutside', dpadDownTouchEnd)
    dpad.addChild(dpadDown)

    // Dpad left
    const dpadLeft = new Pixi.Container()
    dpadLeft.position.x = 0
    dpadLeft.position.y = 60
    dpadLeft.hitArea = new Pixi.Rectangle(0, 0, 80, 80)
    dpadLeft.interactive = true
    dpadLeft.on('touchstart', (): void => {
      dpad.setSubRect(dpadLeftRect)
      dpadDir = Buttons.Left
      if (this._state === StageState.Idle) {
        this._pressAction(Buttons.Left)
      }
    })
    const dpadLeftTouchEnd = (): void => {
      this._releaseAction(Buttons.Left)
      if (dpadDir === Buttons.Left) {
        dpad.setSubRect(dpadRect)
        dpadDir = null
      }
    }
    dpadLeft.on('touchend', dpadLeftTouchEnd)
    dpadLeft.on('touchendoutside', dpadLeftTouchEnd)
    dpad.addChild(dpadLeft)

    // Dpad right
    const dpadRight = new Pixi.Container()
    dpadRight.position.x = 128
    dpadRight.position.y = 60
    dpadRight.hitArea = new Pixi.Rectangle(0, 0, 80, 80)
    dpadRight.interactive = true
    dpadRight.on('touchstart', (): void => {
      dpad.setSubRect(dpadRightRect)
      dpadDir = Buttons.Right
      if (this._state === StageState.Idle) {
        this._pressAction(Buttons.Right)
      }
    })
    const dpadRightTouchEnd = (): void => {
      if (dpadDir === Buttons.Right) {
        dpad.setSubRect(dpadRect)
        dpadDir = null
      }
      this._releaseAction(Buttons.Right)
    }
    dpadRight.on('touchend', dpadRightTouchEnd)
    dpadRight.on('touchendoutside', dpadRightTouchEnd)
    dpad.addChild(dpadRight)

    this.stage.addChild(this._touchContainer)
  }

  private setState(newState: StageState): void {
    if (this._state === newState) return
    this._state = newState
    this._forceCheckInput = (newState === StageState.Idle)
  }
}
