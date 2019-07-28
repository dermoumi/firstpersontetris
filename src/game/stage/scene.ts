import SceneBase from 'game/scene/base'
import GameApp from 'game/app'
import Tetromino, { TetrominoAngle } from './tetromino'
import StageGrid, { WIDTH as GRID_WIDTH, CELL_SIZE, CompleteRow, COLORS } from './grid'
import Input from 'game/input'
import * as Pixi from 'pixi.js'
import Block, { BlockType, BLOCK_SIZE } from './block'

const GRID_SCREEN_X = 192
const GRID_SCREEN_Y = 80
const NEXT_SCREEN_X = 384
const NEXT_SCREEN_Y = 210

enum GameMode {
  Normal,
  DarkRoom,
  ExistentialCrisis,
}

enum StageState {
  Paused,
  Idle,
  RotationAnimation,
  RowAnimation,
}

export default class StageScene extends SceneBase {
  private _grid = new StageGrid()
  private _state = StageState.Idle

  private _stepTime = 0
  private _stepDuration = 1

  private _animationTime = 0

  private _animateRotation = true
  private _rotationDuration = 0.1

  private _completeRows: CompleteRow[] = []
  private _completeRowsBlocks: Block[][] = []
  private _completeRowsContainer = new Pixi.Container()
  private _rowAnimationDuration = 0.5

  private _firstPersonMode = true
  private _gameMode = GameMode.Normal

  private _currentTetromino: Tetromino
  private _nextTetromino: Tetromino
  private _playerX = 0
  private _playerY = 0

  private _hasWallKick = true
  private _hasLockDelay = false

  private _screen = new Pixi.Container()

  public constructor(app: GameApp) {
    super(app)

    this._screen.sortableChildren = true

    this._grid.position.x = GRID_SCREEN_X
    this._grid.position.y = GRID_SCREEN_Y
    this._screen.addChild(this._grid)

    this._completeRowsContainer.position.x = GRID_SCREEN_X
    this._completeRowsContainer.position.y = GRID_SCREEN_Y
    this._screen.addChild(this._completeRowsContainer)

    const screenUi = Pixi.Sprite.from(GameApp.resources.stage.texture)
    screenUi.zIndex = 100
    this._screen.addChild(screenUi)

    this._nextTetromino = this._getNextTetromino()
    this._currentTetromino = this._spawnTetromino()

    this.stage.addChild(this._screen)
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
  }

  public onProcessInput(input: Input): void {
    if (this._state === StageState.Idle) {
      if (input.isPressed('left', true)) {
        this._moveLeft()
      } else if (input.isPressed('right', true)) {
        this._moveRight()
      } else if (input.isPressed('down', true)) {
        this._moveDown(true)
      }

      if (input.isPressed('rotate', true)) {
        this._rotate()
      }
    }
  }

  private _getNextTetromino(): Tetromino {
    const tetromino = Tetromino.getRandom()
    tetromino.update()

    if (this._gameMode === GameMode.DarkRoom) {
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
    }

    const tetromino = this._nextTetromino
    tetromino.visible = true

    this._nextTetromino = this._getNextTetromino()

    this._playerX = Math.ceil(GRID_WIDTH / 2 - tetromino.getSize() / 2)
    this._playerY = -tetromino.getOffset()

    tetromino.setX(GRID_SCREEN_X + CELL_SIZE * this._playerX)
    tetromino.setY(GRID_SCREEN_Y + CELL_SIZE * this._playerY)

    this._stepTime = 0

    // TODO: Check collision and gameover

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
  }

  private _updateRowAnimation(frameTime: number): void {
    if (this._animationTime === this._rowAnimationDuration) {
      // Shift rows in the grid
      this._completeRows.forEach(({ row }): void => {
        this._grid.removeRow(row)
      })
      this._grid.update()

      // Empty the complete rows container to avoid unecessary invisible renders
      this._completeRowsContainer.removeChildren()

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
    if (this._grid.collidesWith(this._currentTetromino, this._playerX - 1, this._playerY)) {
      // TODO: Play collision sound
      console.debug('THUD!')
    } else {
      this._playerX--
      this._currentTetromino.setX(GRID_SCREEN_X + this._playerX * CELL_SIZE)
    }
  }

  private _moveRight(): void {
    if (this._grid.collidesWith(this._currentTetromino, this._playerX + 1, this._playerY)) {
      // TODO: Play collision sound
      console.debug('THUD!')
    } else {
      this._playerX++
      this._currentTetromino.setX(GRID_SCREEN_X + this._playerX * CELL_SIZE)
    }
  }

  private _moveDown(resetStepTime = false): void {
    if (this._grid.collidesWith(this._currentTetromino, this._playerX, this._playerY + 1)) {
      this._uniteTetromino()
    } else {
      this._playerY++
      this._currentTetromino.setY(GRID_SCREEN_Y + this._playerY * CELL_SIZE)
      if (resetStepTime) {
        this._stepTime = 0
      }
    }
  }

  private _rotate(): void {
    const nextAngle = (this._currentTetromino.getAngle() + 1) % 4

    let playerX = this._playerX
    let collides = this._grid.collidesWith(this._currentTetromino, playerX, this._playerY, nextAngle)
    const halfSize = Math.floor(this._currentTetromino.getSize() / 2)

    // Check if it still collides if moved n blocks to the left or n blocks to the right
    if (collides && this._hasWallKick) {
      let shiftedPlayerX
      for (let i = 1; i <= halfSize; i++) {
        // Test from the left
        shiftedPlayerX = this._playerX - i
        collides = this._grid.collidesWith(this._currentTetromino, shiftedPlayerX, this._playerY, nextAngle)
        if (!collides) {
          playerX = shiftedPlayerX
          break
        }

        // Test from the right
        shiftedPlayerX = this._playerX + i
        collides = this._grid.collidesWith(this._currentTetromino, shiftedPlayerX, this._playerY, nextAngle)
        if (!collides) {
          playerX = shiftedPlayerX
          break
        }
      }
    }

    // Allow blocks to rotate even if there's not enough space below them by shifting them a bit upward
    // if (collides) {
    //   for (let i = 0; i < halfSize; ++i) {
    //     const playerY = this._playerY - i
    //     collides = this._grid.collidesWith(this._currentTetromino, this._playerX, playerY, nextAngle)
    //     if (!collides) {
    //       this._playerY = playerY
    //       break
    //     }
    //   }
    // }

    if (collides) {
      // TODO: Play collision sound
      console.debug('THUD!')
    } else {
      this._initRotation(nextAngle, playerX)
    }
  }

  private _uniteTetromino(): void {
    const completeRows = this._grid.unite(this._currentTetromino, this._playerX, this._playerY)
    this._grid.update()

    if (completeRows.length > 0) {
      this._initRowsAnimation(completeRows)
    }

    this._currentTetromino = this._spawnTetromino()
  }

  private _initRotation(angle: TetrominoAngle, playerX = this._playerX, playerY = this._playerY): void {
    this._playerX = playerX
    this._playerY = playerY
    this._currentTetromino.setAngle(angle)
    this._currentTetromino.setX(GRID_SCREEN_X + this._playerX * CELL_SIZE)
    this._currentTetromino.setY(GRID_SCREEN_Y + this._playerY * CELL_SIZE)
    this._currentTetromino.update()

    // Reset step time when rotating if lock delay is on
    if (this._hasLockDelay && this._grid.collidesWith(this._currentTetromino, this._playerX, this._playerY + 1)) {
      this._stepTime = 0
    }

    if (this._animateRotation) {
      this._animationTime = 0
      this._currentTetromino.angle = -90
      this._state = StageState.RotationAnimation
    }
  }

  private _initRowsAnimation(completeRows: CompleteRow[]): void {
    this._completeRows = completeRows

    this._completeRowsContainer.removeChildren()
    this._completeRowsBlocks = []
    completeRows.forEach(({ row, blocks }): void => {
      const blockArray = blocks.map((colorIndex, index): Block => {
        const color = COLORS[colorIndex - 1]
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
}
