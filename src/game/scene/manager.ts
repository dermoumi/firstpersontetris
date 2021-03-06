import GameApp from 'game/app'
import SceneBase from './base'

export default class SceneManager {
  private sceneStack: SceneBase[] = []
  private currentScene: SceneBase | null = null
  private app: GameApp
  private isDirty = false // True whene scene stack changes during an update

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private popUserdata?: Record<string, any>

  public constructor(app: GameApp) {
    this.app = app
  }

  public update(frameTime: number): boolean {
    // Trigger onLeave and onEnter events when there's a new scene
    if (this.sceneStack[0] !== this.currentScene) {
      if (this.currentScene) this.currentScene.onLeave()

      this.currentScene = this.sceneStack[0]
      this.currentScene.onEnter(this.popUserdata)
      this.popUserdata = undefined
    }

    // Reset the dirty flag
    this.isDirty = false

    // Process the input of the current scene
    if (this.currentScene.isInputEnabled()) {
      this.currentScene.onProcessInput(this.app.input, frameTime)
      if (this.isDirty) return false
    }

    // Update all scenes until one of them returns 'false' or sceneStack changes
    this.sceneStack.some((scene): boolean => {
      return scene.onUpdate(frameTime) !== true || this.isDirty
    })

    return !this.isDirty
  }

  public clear(): SceneManager {
    // Call onLeave on the current scene
    if (this.currentScene) {
      this.currentScene.onLeave()
      this.currentScene = null
    }

    // Call onDestry on all scenes of the current stack
    this.sceneStack.forEach((scene): void => {
      scene.onDestroy()
    })

    // Reset the current stack
    this.sceneStack = []
    this.isDirty = true

    return this
  }

  public push(newScene: SceneBase): SceneManager {
    // Add the scene to the scene stack
    this.sceneStack.unshift(newScene)
    this.isDirty = true

    // Initial resize of the scene
    newScene._resize()

    return this
  }

  public switchTo(newScene: SceneBase): SceneManager {
    // Clear all the scenes the push the new one
    return this.clear().push(newScene)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public pop(userdata?: Record<string, any>): SceneManager {
    // Don't do anything if there's no scene
    if (this.sceneStack.length === 0) return this

    // Store pop userdata to be passed on the next onEnter()
    this.popUserdata = userdata

    // Call onLeave if the current scene is the last scene
    if (this.currentScene == this.sceneStack[0]) {
      this.currentScene.onLeave()
      this.currentScene = null
    }

    // Destroy the current scene
    this.sceneStack[0].onDestroy()
    this.sceneStack.shift()

    return this
  }

  public updateScreenSize(width: number, height: number): SceneManager {
    this.sceneStack.forEach((scene): void => {
      scene.onResize(width, height)
    })

    return this
  }
}
