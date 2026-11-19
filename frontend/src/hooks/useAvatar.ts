import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'

type AvatarError = 'imageType' | 'imageSize' | 'imageInvalid'

type AvatarState = {
    file: File | null
    previewUrl: string | null
    removeAvatar: boolean
}

const MAX_FILE_SIZE = 5 * 1024 * 1024
const MAX_IMAGE_DIMENSION = 8192
const MAX_IMAGE_PIXELS = 32_000_000

const ACCEPTED_IMAGES = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp'],
} as const

export const AVATAR_ACCEPT = 'image/jpeg,image/png,image/webp'

const matchesSignature = (bytes: Uint8Array, mime: string) => {
    if (mime === 'image/jpeg') {
        return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    }

    if (mime === 'image/png') {
        return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
            (byte, index) => bytes[index] === byte,
        )
    }

    if (mime === 'image/webp') {
        return (
            bytes[0] === 0x52 &&
            bytes[1] === 0x49 &&
            bytes[2] === 0x46 &&
            bytes[3] === 0x46 &&
            bytes[8] === 0x57 &&
            bytes[9] === 0x45 &&
            bytes[10] === 0x42 &&
            bytes[11] === 0x50
        )
    }

    return false
}

const validateFile = async (file: File): Promise<AvatarError | null> => {
    const extensions = ACCEPTED_IMAGES[file.type as keyof typeof ACCEPTED_IMAGES]

    const extension = file.name.split('.').pop()?.toLowerCase()

    if (!extensions || !extension || !(extensions as readonly string[]).includes(extension)) {
        return 'imageType'
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
        return 'imageSize'
    }

    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())

    if (!matchesSignature(bytes, file.type)) {
        return 'imageInvalid'
    }

    const bitmap = await createImageBitmap(file)

    try {
        if (
            bitmap.width === 0 ||
            bitmap.height === 0 ||
            bitmap.width > MAX_IMAGE_DIMENSION ||
            bitmap.height > MAX_IMAGE_DIMENSION ||
            bitmap.width * bitmap.height > MAX_IMAGE_PIXELS
        ) {
            return 'imageInvalid'
        }
    } finally {
        bitmap.close()
    }

    return null
}

export const useAvatar = (avatarUrl: string | null) => {
    const [state, setState] = useState<AvatarState>({
        file: null,
        previewUrl: null,
        removeAvatar: false,
    })
    const [error, setError] = useState<AvatarError | null>(null)
    const [isValidating, setIsValidating] = useState(false)
    const [failedImage, setFailedImage] = useState<string | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const requestIdRef = useRef(0)
    const mountedRef = useRef(false)
    const objectUrlRef = useRef<string | null>(null)

    useEffect(() => {
        mountedRef.current = true

        return () => {
            mountedRef.current = false
            requestIdRef.current += 1

            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current)
                objectUrlRef.current = null
            }
        }
    }, [])

    const replacePreview = (nextUrl: string | null) => {
        const previousUrl = objectUrlRef.current

        objectUrlRef.current = nextUrl

        if (previousUrl) {
            URL.revokeObjectURL(previousUrl)
        }
    }

    const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.currentTarget.files?.[0]

        event.currentTarget.value = ''

        if (!file) {
            return
        }

        const requestId = ++requestIdRef.current

        setIsValidating(true)
        setError(null)

        try {
            const validationError = await validateFile(file)

            if (!mountedRef.current || requestId !== requestIdRef.current) {
                return
            }

            if (validationError) {
                setError(validationError)
                return
            }

            const previewUrl = URL.createObjectURL(file)

            replacePreview(previewUrl)
            setFailedImage(null)
            setState({
                file,
                previewUrl,
                removeAvatar: false,
            })
        } catch {
            if (mountedRef.current && requestId === requestIdRef.current) {
                setError('imageInvalid')
            }
        } finally {
            if (mountedRef.current && requestId === requestIdRef.current) {
                setIsValidating(false)
            }
        }
    }

    const handleRemove = () => {
        requestIdRef.current += 1

        replacePreview(null)
        setError(null)
        setFailedImage(null)
        setIsValidating(false)
        setState({
            file: null,
            previewUrl: null,
            removeAvatar: Boolean(avatarUrl),
        })
    }

    const imageSrc = state.previewUrl ?? (state.removeAvatar ? null : avatarUrl)

    const handleImageError = () => {
        setFailedImage(imageSrc)

        if (state.previewUrl) {
            setError('imageInvalid')
        }
    }

    return {
        avatarFile: state.file,
        removeAvatar: state.removeAvatar,
        imageSrc: imageSrc === failedImage ? null : imageSrc,
        hasAvatar: Boolean(imageSrc),
        isDirty: state.file !== null || (state.removeAvatar && Boolean(avatarUrl)),
        isValidating,
        error,
        fileInputRef,
        handleChange,
        handleRemove,
        handleImageError,
    }
}
