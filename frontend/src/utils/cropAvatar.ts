import type { Area } from 'react-easy-crop'

const AVATAR_SIZE = 512

export const cropAvatar = async (imageSrc: string, crop: Area): Promise<File> => {
    const image = new Image()

    image.src = imageSrc

    await image.decode()

    const canvas = document.createElement('canvas')

    canvas.width = AVATAR_SIZE
    canvas.height = AVATAR_SIZE

    const context = canvas.getContext('2d')

    if (!context) {
        throw new Error('Canvas context is unavailable')
    }

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'

    context.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        AVATAR_SIZE,
        AVATAR_SIZE,
    )

    const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
            if (result) {
                resolve(result)
            } else {
                reject(new Error('Could not crop avatar'))
            }
        }, 'image/png')
    })

    return new File([blob], 'avatar.png', {
        type: 'image/png',
        lastModified: Date.now(),
    })
}
