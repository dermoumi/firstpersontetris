import SceneBase from 'game/scene/base'
import GameApp from 'game/app'
import Tetromino, { TetrominoAngle } from './tetromino'
import StageGrid, { WIDTH as GRID_WIDTH, HEIGHT as GRID_HEIGHT, CELL_SIZE, CompleteRow } from './grid'
import Input from 'game/input'
import * as Pixi from 'pixi.js'
import Block, { BlockType, BLOCK_SIZE } from './block'
import { COLOR_TABLE, SCORE_TABLE } from './constants'
import TitleScene from 'game/title/scene'

const GRID_SCREEN_X = 192
const GRID_SCREEN_Y = 80
const NEXT_SCREEN_X = 384
const NEXT_SCREEN_Y = 210

export interface StageSceneUserdata {
  level?: number;
  firstPerson?: boolean;
  lightsOut?: boolean;
  crisisMode?: boolean;
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

  private _cameraAdjustTime = 0.2

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

  private _screen = new Pixi.Container()
  private _room = new Pixi.Container()

  private MOVE_DIR = {
    left: [
      this._moveLeft.bind(this),
      (): void => {},
      this._moveRight.bind(this),
      this._moveDown.bind(this),
    ],
    right: [
      this._moveRight.bind(this),
      this._moveDown.bind(this),
      this._moveLeft.bind(this),
      (): void => {},
    ],
    down: [
      this._moveDown.bind(this),
      this._moveLeft.bind(this),
      (): void => {},
      this._moveRight.bind(this),
    ],
    up: [
      (): void => {},
      this._moveRight.bind(this),
      this._moveDown.bind(this),
      this._moveLeft.bind(this),
    ],
  }

  public constructor(app: GameApp, userdata: StageSceneUserdata = {}) {
    super(app)

    if (userdata.level !== undefined) {
      this._level = this._startingLevel = userdata.level
    }

    if (userdata.firstPerson !== undefined) {
      this._firstPersonMode = userdata.firstPerson
    }

    if (userdata.lightsOut !== undefined) {
      this._lightsOutMode = userdata.lightsOut
    }

    if (userdata.crisisMode !== undefined) {
      this._inCrisisMode = userdata.crisisMode
    }

    this._screen.sortableChildren = true

    this._grid.position.x = GRID_SCREEN_X
    this._grid.position.y = GRID_SCREEN_Y
    this._screen.addChild(this._grid)

    this._completeRowsContainer.position.x = GRID_SCREEN_X
    this._completeRowsContainer.position.y = GRID_SCREEN_Y
    this._screen.addChild(this._completeRowsContainer)

    const screenUi = Pixi.Sprite.from(GameApp.resources.stage.texture)
    screenUi.zIndex = 100
    screenUi.visible = !this._lightsOutMode
    this._screen.addChild(screenUi)

    this._levelUi = this._createUiText(`0${this._level}`.substr(-2), 416, 314)
    this._linesUi = this._createUiText('000', 304, 26)
    this._scoreUi = this._createUiText('000000', 384, 106)
    this._hiScoreUi = this._createUiText('010000', 384, 58)

    const tetrominoTypes = ['T', 'Z', 'J', 'O', 'L', 'S', 'I']
    tetrominoTypes.forEach((type, i): void => {
      this._statistics[type] = 0
      this._statisticsUi[type] = this._createUiText('000', 96, 170 + i * 32, 0xF83800)
    })

    this._statsPiecesUi.position.x = 48
    this._statsPiecesUi.position.y = 160
    this._statsPiecesUi.zIndex = 110
    this._statsPiecesUi.visible = !this._lightsOutMode
    this._screen.addChild(this._statsPiecesUi)

    this._gameOverCurtain.position.x = GRID_SCREEN_X
    this._gameOverCurtain.position.y = GRID_SCREEN_Y
    this._gameOverCurtain.zIndex = 120
    this._screen.addChild(this._gameOverCurtain)

    this._nextTetromino = this._getNextTetromino()
    this._currentTetromino = this._spawnTetromino()

    const roomSprite = Pixi.Sprite.from(GameApp.resources.room.texture)
    this._room.addChild(roomSprite)

    this._screen.position.x = 740
    this._screen.position.y = 768
    this._screen.scale.x = 425 / GameApp.resources.stage.texture.width
    this._screen.scale.y = 372 / GameApp.resources.stage.texture.height
    this._room.addChild(this._screen)

    const screenOverlay = Pixi.Sprite.from(GameApp.resources.screen.texture)
    screenOverlay.position.x = 733
    screenOverlay.position.y = 761
    this._room.addChild(screenOverlay)

    this._room.pivot.x = GameApp.resources.room.texture.width / 2
    this._room.pivot.y = GameApp.resources.room.texture.height / 2

    this.stage.addChild(this._room)

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

    const piecesOverlayTexture = GameApp.resources.stats.texture

    const colorLayer = new Pixi.Graphics()
    colorLayer.beginFill(color1)
    colorLayer.drawRect(0, 0, piecesOverlayTexture.width, piecesOverlayTexture.height)
    colorLayer.endFill()
    colorLayer.beginFill(color2)
    colorLayer.drawRect(2, 72, 38, 26)
    colorLayer.drawRect(2, 166, 38, 26)
    colorLayer.endFill()
    this._statsPiecesUi.addChild(colorLayer)

    const piecesOverlay = Pixi.Sprite.from(piecesOverlayTexture)
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
    uiText.zIndex = 110
    uiText.resolution = 2
    uiText.roundPixels = true
    uiText.visible = !this._lightsOutMode
    this._screen.addChild(uiText)
    return uiText
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
  }

  public onProcessInput(input: Input): void {
    if (this._state === StageState.Idle) {
      const angle = (this._lastTetrominoAngle + this._currentTetromino.getAngle()) % 4

      if (input.isPressed('left', true)) {
        if (this._firstPersonMode) {
          this.MOVE_DIR['left'][angle]()
        } else {
          this._moveLeft()
        }
      } else if (input.isPressed('right', true)) {
        if (this._firstPersonMode) {
          this.MOVE_DIR['right'][angle]()
        } else {
          this._moveRight()
        }
      } else if (input.isPressed('down', true)) {
        if (this._firstPersonMode) {
          this.MOVE_DIR['down'][angle]()
        } else {
          this._moveDown()
        }
      } else if (input.isPressed('up', true)) {
        if (this._firstPersonMode) this.MOVE_DIR['up'][angle]()
      }

      if (input.isPressed('rotate', true)) {
        this._rotate()
      }

      if (input.isPressed('drop')) {
        this._drop()
      }
    }
  }

  private _getNextTetromino(): Tetromino {
    const tetromino = Tetromino.getRandom()

    const [color1, color2] = this._getColors()
    tetromino.setColors(color1, color2)

    if (this._lightsOutMode) {
      tetromino.visible = false
    } else {
      const [centerX, centerY] = tetromino.getCenter()
      tetromino.setX(NEXT_SCREEN_X + CELL_SIZE * (2 - centerX))
      tetromino.setY(NEXT_SCREEN_Y + CELL_SIZE * (2 - centerY))
    }

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
      this._performStep()
    }
  }

  private _performStep(): void {
    this._moveDown()
  }

  private _updateRotation(frameTime: number): void {
    this._animationTime += frameTime
    if (this._animationTime > this._rotationDuration) {
      this._animationTime = this._rotationDuration
      this._state = StageState.Idle
    }

    const percent = this._animationTime / this._rotationDuration
    this._currentTetromino.angle = -90 + 90 * percent
    this._updateScreenRotation()
  }

  private _updateRowAnimation(frameTime: number): void {
    if (this._animationTime === this._rowAnimationDuration) {
      // Update level
      this._updateLevel()

      // Shift rows in the grid
      this._completeRows.forEach(({ row }): void => {
        this._grid.removeRow(row)
      })
      this._grid.update()

      // Empty the complete rows container to avoid unecessary invisible renders
      this._completeRowsContainer.removeChildren()

      // Spawn new tetromino now that the animation has ended
      this._currentTetromino = this._spawnTetromino()
      this._updateScreenPos()
      this._updateScreenRotation()

      // Shift back to the idle state and leave method
      this._state = StageState.Idle
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

  private _drop(): void {
    this._dropTargetY = this._playerY
    while (!this._grid.collidesWith(this._currentTetromino, this._playerX, this._dropTargetY + 1)) {
      this._dropTargetY++
    }

    if (this._animateDrop) {
      this._state = StageState.DropAnimation
      this._animationTime = 0
      this._dropStartPos = this._currentTetromino.position.y
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
      this.app.sound.playSfx('united')
      this._currentTetromino = this._spawnTetromino()
      this._updateScreenPos()
      this._updateScreenRotation()
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
      this._state = StageState.RotationAnimation
    } else {
      this._updateScreenRotation()
    }
  }

  private _initRowsAnimation(completeRows: CompleteRow[]): void {
    this._completeRows = completeRows
    this._increaseLineCount(completeRows.length, true, false)

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
    this._state = StageState.RowAnimation
  }

  private _setLevel(level: number): void {
    if (this._level === level) return

    this._level += level
    this._levelUi.text = `0${level}`.substr(-2)

    this._updateColors()
    this.app.sound.playSfx('level')
  }

  private _increaseStatistics(type: string): void {
    const count = ++this._statistics[type]
    this._statisticsUi[type].text = `00${count}`.substr(-3)
  }

  private _increaseLineCount(count = 1, increaseScore = true, increaseLevel = true): void {
    this._lines += count
    this._linesUi.text = `00${this._lines}`.substr(-3)

    if (increaseScore) {
      this._increaseScore(count)
    }

    if (increaseLevel) {
      this._updateLevel()
    }
  }

  private _increaseScore(lineCount = 1): void {
    const score = SCORE_TABLE[Math.min(lineCount - 1, 3)] * (this._level + 1)

    this._score += score
    this._scoreUi.text = `00000${this._score}`.substr(-6)

    if (this._score > this._hiScore) {
      this._hiScore = this._score
      this._hiScoreUi.text = this._scoreUi.text
    }
  }

  private _updateLevel(): void {
    const level = Math.floor(this._lines / 10) + this._startingLevel
    this._setLevel(level)
  }

  private _updateDropAnimation(frameTime: number): void {
    if (this._animationTime === this._dropAnimationDuration) {
      this._playerY = this._dropTargetY
      this._state = StageState.Idle
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
    this._state = StageState.GameOver
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

    this.app.pixi.renderer.render(curtainBlock, this._curtainTexture)
  }

  private _updateGameOver(frameTime: number): void {
    if (this._animationTime === this._gameOverAnimationDuration) {
      this.manager.switchTo(new TitleScene(this.app, {
        gameOver: {
          level: this._level,
          lines: this._lines,
          score: this._score,
          hiScore: this._hiScore,
        },
      }))
    }

    this._animationTime = Math.min(this._animationTime + frameTime, this._gameOverAnimationDuration)

    const percent = this._animationTime / this._gameOverAnimationDuration
    const curtain = this._gameOverCurtain
    curtain.clear()
    curtain.beginTextureFill(this._curtainTexture)
    curtain.drawRect(0, 0, GRID_WIDTH * CELL_SIZE, GRID_HEIGHT * CELL_SIZE * percent)
  }

  public onResize(width: number, height: number): void {
    super.onResize(width, height)

    this._room.position.x = width / 2
    this._room.position.y = height / 2
  }

  private _updateScreenPos(): void {
    if (!this._firstPersonMode) return

    const tetromino = this._currentTetromino
    const [centerX, centerY] = tetromino.getCenter()
    const tetrominoX = tetromino.position.x - tetromino.pivot.x + centerX
    const tetrominoY = tetromino.position.y - tetromino.pivot.y + centerY
    const x = this._screen.scale.x * tetrominoX + this._screen.position.x
    const y = this._screen.scale.y * tetrominoY + this._screen.position.y

    this._room.pivot.x = x
    this._room.pivot.y = y
  }

  private _updateScreenRotation(): void {
    if (!this._firstPersonMode) return

    const tetromino = this._currentTetromino
    const angle = tetromino.getAngle() as number
    const lastAngle = this._lastTetrominoAngle as number
    this._room.angle = - lastAngle * 90 - angle * 90 - tetromino.angle
  }
}
