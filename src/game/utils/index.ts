const WEBP_IMAGES = {
  basic: "data:image/webp;base64,UklGRjIAAABXRUJQVlA4ICYAAACyAgCdASoCAAEALmk0mk0iIiIiIgBoSygABc6zbAAA/v56QAAAAA==",
  lossless: "data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAQAAAAfQ//73v/+BiOh/AAA=",
}

export async function isWebpSupported(lossless = false): Promise<boolean> {
  return new Promise((resolve): void => {
    const img = document.createElement('img')
    img.onload = (): void => {
      resolve(img.width === 2 && img.height === 1)
    }
    img.onerror = (): void => {
      resolve(false)
    }
    img.src = WEBP_IMAGES[lossless ? 'lossless' : 'basic']
  })
}
