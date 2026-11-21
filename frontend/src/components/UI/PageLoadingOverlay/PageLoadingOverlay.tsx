import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import classNames from 'classnames'

import { Spinner } from '../Spinner'

import './PageLoadingOverlay.scss'

type Props = {
    open: boolean
    message?: string
    className?: string
}

export const PageLoadingOverlay = ({ open, message, className }: Props) => {
    const shouldReduceMotion = useReducedMotion()

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    className={classNames('page-loading-overlay', className)}
                    role="status"
                    aria-live="polite"
                    aria-label={message || 'Loading'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{
                        duration: shouldReduceMotion ? 0 : 0.2,
                        ease: 'easeOut',
                    }}
                >
                    <motion.div
                        className="page-loading-overlay__content"
                        initial={{
                            opacity: 0,
                            scale: shouldReduceMotion ? 1 : 0.95,
                            y: shouldReduceMotion ? 0 : 8,
                        }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                        }}
                        exit={{
                            opacity: 0,
                            scale: shouldReduceMotion ? 1 : 0.95,
                            y: shouldReduceMotion ? 0 : 8,
                        }}
                        transition={{
                            duration: shouldReduceMotion ? 0 : 0.25,
                            ease: 'easeOut',
                        }}
                    >
                        <Spinner size="medium" className="page-loading-overlay__spinner" />

                        {message && <p className="page-loading-overlay__message">{message}</p>}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    )
}
