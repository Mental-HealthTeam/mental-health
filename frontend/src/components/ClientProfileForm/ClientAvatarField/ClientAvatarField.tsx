import { useId, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { AVATAR_ACCEPT } from '../../../hooks'
import type { useAvatar } from '../../../hooks'
import { OutlineButton, PrimaryButton } from '../../UI/Buttons'
import { AvatarFallbackIcon } from '../../UI/Icons'

import './ClientAvatarField.scss'

type Props = {
    avatar: ReturnType<typeof useAvatar>
}

export const ClientAvatarField = ({ avatar }: Props) => {
    const { t } = useTranslation('clientProfileSettings')
    const errorId = useId()
    const fileInputRef = useRef<HTMLInputElement>(null)

    return (
        <div className="client-profile-form__avatar" aria-busy={avatar.isValidating}>
            <div className="client-profile-form__photo">
                {avatar.imageSrc ? (
                    <img
                        key={avatar.imageSrc}
                        src={avatar.imageSrc}
                        alt=""
                        onError={avatar.handleImageError}
                    />
                ) : (
                    <AvatarFallbackIcon />
                )}
            </div>

            <input
                ref={fileInputRef}
                className="client-profile-form__file"
                type="file"
                accept={AVATAR_ACCEPT}
                disabled={avatar.isValidating}
                aria-label={t('addPhoto')}
                aria-invalid={Boolean(avatar.error)}
                aria-describedby={avatar.error ? errorId : undefined}
                onChange={(event) => void avatar.handleChange(event)}
            />

            <div className="client-profile-form__photo-actions">
                <PrimaryButton
                    type="button"
                    fullWidth
                    disabled={avatar.isValidating}
                    onClick={() => fileInputRef.current?.click()}
                >
                    {avatar.hasAvatar ? t('changePhoto') : t('addPhoto')}
                </PrimaryButton>

                {avatar.hasAvatar && (
                    <OutlineButton type="button" fullWidth onClick={avatar.handleRemove}>
                        {t('deletePhoto')}
                    </OutlineButton>
                )}
            </div>

            {avatar.error && (
                <p className="client-profile-form__error" id={errorId} role="alert">
                    {t(`errors.${avatar.error}`)}
                </p>
            )}
        </div>
    )
}
