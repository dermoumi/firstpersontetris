import { Howl, Howler } from 'howler'

const USER_GESTURES = ['keydown', 'mousedown', 'click', 'touchstart', 'touchend', 'pointerdown', 'pointerup']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BlobRecord = Record<string, any>

export default class Sound {
  private bgm?: Howl
  private bgmFast?: Howl
  private sfxEnabled = true
  private sounds: Record<string, Howl> = {}
  private soundBlobs: BlobRecord = {}
  private blobsSetupDone = false

  public constructor() {
    this.userGestureEvent = this.userGestureEvent.bind(this)

    window.addEventListener('focus', (): void => {
      // Make sure this is initialized just in case
      this.userGestureEvent()

      // Mute sound
      Howler.mute(false)
    }, false)

    window.addEventListener('blur', (): void => {
      // Unmute sound
      Howler.mute(true)
    }, false)
  }

  private userGestureEvent(): void {
    if (this.blobsSetupDone) return

    Object.entries(this.soundBlobs).forEach(([key, options]): void => {
      this.sounds[key] = new Howl(options)
    })
    this.blobsSetupDone = true

    USER_GESTURES.forEach((event): void => {
      window.removeEventListener(event, this.userGestureEvent)
    })
  }

  public setSoundBlobs(blobs: BlobRecord): void {
    this.soundBlobs = blobs

    // Offloading
    this.blobsSetupDone = false
    USER_GESTURES.forEach((event): void => {
      window.addEventListener(event, this.userGestureEvent, false)
    })
  }

  public setMusic(urlSlow: string, urlFast: string): void {
    if (this.bgm) this.bgm.unload()
    if (this.bgmFast) this.bgmFast.unload()

    this.bgm = new Howl({
      src: [ urlSlow ],
      loop: true,
      volume: 0.5,
      html5: true,
    })

    if (urlSlow === urlFast) {
      this.bgmFast = this.bgm
    } else {
      this.bgmFast = new Howl({
        src: [ urlFast ],
        loop: true,
        volume: 0.5,
        html5: true,
      })
    }
  }

  public removeMusic(): void {
    this.stopMusic()

    this.bgm = undefined
    this.bgmFast = undefined
  }

  public playSlowMusic(): void {
    if (!this.bgm) return
    this.bgm.play()
  }

  public playFastMusic(): void {
    if (!this.bgmFast) return
    this.bgmFast.play()
  }

  public stopMusic(): void {
    if (this.bgm) {
      this.bgm.stop()
    }

    if (this.bgmFast) {
      this.bgmFast.stop()
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
    this.sounds[res].play(name)
  }

  public isMusicPlaying(): boolean {
    if (this.bgm && this.bgm.playing()) {
      return true
    }

    if (this.bgmFast && this.bgmFast.playing()) {
      return true
    }

    return false
  }
}
