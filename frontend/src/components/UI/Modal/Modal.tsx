import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
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

const SCROLLBAR_GAP_PROPERTY = '--modal-scrollbar-gap'

let scrollLockCount = 0
let restorePageScroll: (() => void) | undefined

const lockPageScroll = () => {
    if (scrollLockCount === 0) {
        const { body, documentElement } = document
        const previousOverflow = body.style.overflow
        const previousPaddingRight = body.style.paddingRight
        const previousGap = body.style.getPropertyValue(SCROLLBAR_GAP_PROPERTY)
        const previousGapPriority = body.style.getPropertyPriority(SCROLLBAR_GAP_PROPERTY)
        const previousViewportWidth = documentElement.clientWidth
        const currentPaddingRight = window.getComputedStyle(body).paddingRight

        body.style.overflow = 'hidden'

        const scrollbarGap = Math.max(0, documentElement.clientWidth - previousViewportWidth)
        body.style.setProperty(SCROLLBAR_GAP_PROPERTY, `${scrollbarGap}px`)

        if (scrollbarGap > 0) {
            body.style.paddingRight = `calc(${currentPaddingRight} + ${scrollbarGap}px)`
        }

        restorePageScroll = () => {
            body.style.overflow = previousOverflow
            body.style.paddingRight = previousPaddingRight

            if (previousGap) {
                body.style.setProperty(SCROLLBAR_GAP_PROPERTY, previousGap, previousGapPriority)
            } else {
                body.style.removeProperty(SCROLLBAR_GAP_PROPERTY)
            }
        }
    }

    scrollLockCount += 1

    return () => {
        scrollLockCount -= 1

        if (scrollLockCount === 0) {
            restorePageScroll?.()
            restorePageScroll = undefined
        }
    }
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

    useEffect(() => {
        const frame = window.requestAnimationFrame(() => {
            if (open) {
                closingRef.current = false
                userCloseRef.current = false
                setIsClosing(false)
                setIsPresent(true)
            } else if (dialogRef.current?.open && !closingRef.current) {
                closingRef.current = true
                userCloseRef.current = false
                setIsClosing(true)
            }
        })

        return () => window.cancelAnimationFrame(frame)
    }, [open])

    useLayoutEffect(() => {
        const dialog = dialogRef.current

        if (!isPresent || !dialog) {
            return
        }

        const previousFocus =
            document.activeElement instanceof HTMLElement ? document.activeElement : null

        const unlockPageScroll = lockPageScroll()

        if (!dialog.open) {
            dialog.showModal()
        }

        titleRef.current?.focus({ preventScroll: true })

        return () => {
            dialog.close()
            unlockPageScroll()

            if (previousFocus?.isConnected) {
                previousFocus.focus({ preventScroll: true })
            }
        }
    }, [isPresent])

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

    const handleClose = () => {
        if (closeDisabled || closingRef.current) {
            return
        }

        closingRef.current = true
        userCloseRef.current = true
        setIsClosing(true)
    }

    const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
        if (event.target !== event.currentTarget) {
            return
        }

        const { left, right, top, bottom } = event.currentTarget.getBoundingClientRect()

        if (
            event.clientX < left ||
            event.clientX > right ||
            event.clientY < top ||
            event.clientY > bottom
        ) {
            handleClose()
        }
    }

    const handleAnimationEnd = (event: AnimationEvent<HTMLDialogElement>) => {
        if (
            event.target === event.currentTarget &&
            event.animationName === 'modal-disappear' &&
            !event.pseudoElement
        ) {
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
                <div className="modal__close-row">
                    <CloseButton
                        className="modal__close"
                        aria-label={closeLabel}
                        disabled={closeDisabled || isClosing}
                        onClick={handleClose}
                    />
                </div>

                <h2 ref={titleRef} id={titleId} className="modal__title" tabIndex={-1}>
                    {title}
                </h2>
            </header>

            {children}
        </dialog>,
        document.body,
    )
}
