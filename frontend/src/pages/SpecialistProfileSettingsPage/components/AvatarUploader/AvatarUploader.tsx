import { useRef, useState, useEffect } from 'react'
import './AvatarUploader.scss'
import { OutlineButton, PrimaryButton } from '../../../../components/UI/Buttons'
import { SpecialistPhoto } from '../../../../components/UI/SpecialistPhoto'
import { AvatarPlaceholder } from '../../../../components/AvatarPlaceholder'

interface Props {
    avatarUrl?: string | null
    onChange: (file: File | null) => void
}

export const AvatarUploader = ({ avatarUrl, onChange }: Props) => {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    const preview = selectedFile ? URL.createObjectURL(selectedFile) : (avatarUrl ?? null)

    useEffect(() => {
        return () => {
            if (preview?.startsWith('blob:')) {
                URL.revokeObjectURL(preview)
            }
        }
    }, [preview])

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]

        if (!file) return

        if (!file.type.startsWith('image/')) return

        setSelectedFile(file)
        onChange(file)

        event.target.value = ''
    }

    const handleRemove = () => {
        setSelectedFile(null)
        onChange(null)
    }

    const handleReplace = () => {
        fileInputRef.current?.click()
    }

    return (
        <div className="avatar-uploader">
            <div className="avatar-uploader__preview">
                {preview ? (
                    <SpecialistPhoto
                        src={preview}
                        alt="Profile avatar"
                        className="avatar-uploader__image"
                        fallback={
                            <AvatarPlaceholder
                                className="avatar-uploader__placeholder"
                                variant="large"
                            />
                        }
                    />
                ) : (
                    <AvatarPlaceholder className="avatar-uploader__placeholder" variant="large" />
                )}
            </div>

            <div className="avatar-uploader__actions">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    className="avatar-uploader__input"
                    onChange={handleFileChange}
                />

                <PrimaryButton
                    className="avatar-uploader__button avatar-uploader__button--replace"
                    onClick={handleReplace}
                >
                    {!selectedFile ? 'Додати фото профілю' : 'Замінити'}
                </PrimaryButton>

                {preview && (
                    <OutlineButton
                        className="avatar-uploader__button avatar-uploader__button--remove"
                        onClick={handleRemove}
                    >
                        Видалити
                    </OutlineButton>
                )}
            </div>
        </div>
    )
}
