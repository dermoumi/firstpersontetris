import 'pixi-sound'
import GameApp from './app'

export default class Sound {
  private bgm?: HTMLAudioElement
  private bgmFast?: HTMLAudioElement
  private sfxEnabled = true

  public setMusic(urlSlow: string, urlFast: string): void {
    this.stopMusic()

    this.bgm = new Audio(urlSlow)
    this.bgm.loop = true
    this.bgm.volume = 0.5

    this.bgmFast = new Audio(urlFast)
    this.bgmFast.loop = true
    this.bgmFast.volume = 0.5
  }

  public removeMusic(): void {
    this.stopMusic()

    this.bgm = undefined
    this.bgmFast = undefined
  }

  public playSlowMusic(): void {
    if (!this.bgm) return
    const promise = this.bgm.play()
    if (promise !== null) {
      promise.catch((): void => {})
    }
  }

  public playFastMusic(): void {
    if (!this.bgmFast) return
    this.bgmFast.play()
  }

  public stopMusic(): void {
    if (this.bgm) {
      this.bgm.pause()
      this.bgm.currentTime = 0
    }

    if (this.bgmFast) {
      this.bgmFast.pause()
      this.bgmFast.currentTime = 0
    }
  }

  public setSfxEnabled(enabled: boolean): void {
    this.sfxEnabled = enabled
  }

  public isSfxEnabled(): boolean {
    return this.sfxEnabled
  }

  public playSfx(name?: string, res: string = 'sfxSprites'): void {
    if (!this.sfxEnabled) return
    GameApp.resources[res].sound.play(name)
  }

  public isMusicPlaying(): boolean {
    if (this.bgm && !this.bgm.paused) {
      return true
    }

    if (this.bgmFast && !this.bgmFast.paused) {
      return true
    }

    return false
  }
}
