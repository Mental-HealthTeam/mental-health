import { useEffect, useId, useRef, useState } from 'react'
import type { AnimationEvent, MouseEvent, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import classNames from 'classnames'

import { CloseButton } from '../Buttons'

import './Modal.scss'

type Props = {
    open: boolean
    title: string
    closeLabel: string
    children: ReactNode
    onClose: () => void
    onExited?: () => void
    className?: string
    closeDisabled?: boolean
}

export const Modal = ({
    open,
    title,
    closeLabel,
    children,
    onClose,
    onExited,
    className,
    closeDisabled = false,
}: Props) => {
    const dialogRef = useRef<HTMLDialogElement>(null)
    const titleRef = useRef<HTMLHeadingElement>(null)
    const closingRef = useRef(false)
    const userCloseRef = useRef(false)
    const callbacksRef = useRef({ onClose, onExited })

    const [isPresent, setIsPresent] = useState(open)
    const [isClosing, setIsClosing] = useState(false)

    const titleId = useId()

    useEffect(() => {
        callbacksRef.current = { onClose, onExited }
    }, [onClose, onExited])

    const finishClose = () => {
        if (!closingRef.current) {
            return
        }

        const shouldNotifyClose = userCloseRef.current
        const callbacks = callbacksRef.current

        closingRef.current = false
        userCloseRef.current = false

        dialogRef.current?.close()

        setIsPresent(false)
        setIsClosing(false)

        if (shouldNotifyClose) {
            callbacks.onClose()
        }

        callbacks.onExited?.()
    }

    const startClose = (initiatedByUser: boolean) => {
        if (closingRef.current) {
            return
        }

        closingRef.current = true
        userCloseRef.current = initiatedByUser

        setIsClosing(true)
    }

    useEffect(() => {
        if (open) {
            closingRef.current = false
            userCloseRef.current = false

            setIsClosing(false)
            setIsPresent(true)
        } else if (dialogRef.current?.open) {
            startClose(false)
        }
    }, [open])

    useEffect(() => {
        const dialog = dialogRef.current

        if (!isPresent || !dialog) {
            return
        }

        const previousFocus =
            document.activeElement instanceof HTMLElement ? document.activeElement : null

        const previousOverflow = document.body.style.overflow

        if (!dialog.open) {
            dialog.showModal()
            titleRef.current?.focus({ preventScroll: true })
        }

        document.body.style.overflow = 'hidden'

        return () => {
            dialog.close()
            document.body.style.overflow = previousOverflow

            if (previousFocus?.isConnected) {
                previousFocus.focus({ preventScroll: true })
            }
        }
    }, [isPresent])

    const handleClose = () => {
        if (!closeDisabled) {
            startClose(true)
        }
    }

    const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
        if (event.target !== event.currentTarget) {
            return
        }

        const rect = event.currentTarget.getBoundingClientRect()

        const isOutside =
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom

        if (isOutside) {
            handleClose()
        }
    }

    const handleAnimationEnd = (event: AnimationEvent<HTMLDialogElement>) => {
        if (event.target === event.currentTarget && event.animationName === 'modal-disappear') {
            finishClose()
        }
    }

    if (!isPresent) {
        return null
    }

    return createPortal(
        <dialog
            ref={dialogRef}
            className={classNames('modal', className, {
                'modal--closing': isClosing,
            })}
            aria-labelledby={titleId}
            onCancel={(event) => {
                event.preventDefault()
                handleClose()
            }}
            onClick={handleBackdropClick}
            onAnimationEnd={handleAnimationEnd}
        >
            <header className="modal__header">
                <h2 ref={titleRef} id={titleId} className="modal__title" tabIndex={-1}>
                    {title}
                </h2>

                <CloseButton
                    className="modal__close"
                    aria-label={closeLabel}
                    disabled={closeDisabled || isClosing}
                    onClick={handleClose}
                />
            </header>

            {children}
        </dialog>,
        document.body,
    )
}
