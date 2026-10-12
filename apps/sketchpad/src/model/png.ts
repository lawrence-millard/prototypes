import { pngPixelSize } from './svg'

export async function svgToPngBlob(svg: string, width: number, height: number): Promise<Blob> {
  const pixel = pngPixelSize(width, height)
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  try {
    const image = new Image()
    image.decoding = 'async'
    const loaded = new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('Could not create the PNG.'))
    })
    image.src = url
    await loaded
    const canvas = document.createElement('canvas')
    canvas.width = pixel.width
    canvas.height = pixel.height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Could not create the PNG.')
    context.drawImage(image, 0, 0, pixel.width, pixel.height)
    const png = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), 'image/png')
    })
    if (!png) throw new Error('Could not create the PNG.')
    return png
  } finally {
    URL.revokeObjectURL(url)
  }
}
