import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'

import './ClientSessionsPanel.scss'

type Props = {
    panelKey: string
    reduceMotion: boolean
    children: ReactNode
}

export const ClientSessionsPanel = ({ panelKey, reduceMotion, children }: Props) => {
    const contentRef = useRef<HTMLDivElement>(null)
    const [contentHeight, setContentHeight] = useState<number | null>(null)
    const [isResizing, setIsResizing] = useState(false)

    useLayoutEffect(() => {
        const content = contentRef.current
        if (!content) return

        const observer = new ResizeObserver(() => {
            setContentHeight(content.getBoundingClientRect().height)
        })

        observer.observe(content)
        return () => observer.disconnect()
    }, [])

    return (
        <motion.div
            initial={false}
            animate={{ height: contentHeight ?? 'auto' }}
            transition={{ duration: reduceMotion ? 0 : 0.25, ease: 'easeOut' }}
            onAnimationStart={() => setIsResizing(true)}
            onAnimationComplete={() => setIsResizing(false)}
            style={{ overflow: isResizing && !reduceMotion ? 'clip' : 'visible' }}
        >
            <div ref={contentRef} className="client-sessions-table__panel-content">
                <AnimatePresence initial={false} mode="wait">
                    <motion.div
                        key={panelKey}
                        className="client-sessions-table__panel-content"
                        initial={reduceMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: reduceMotion ? 0 : 0.14, ease: 'easeOut' }}
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    )
}
