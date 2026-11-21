import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useLocation } from 'react-router-dom'

type Props = {
    children: ReactNode
}

export const PageTransition = ({ children }: Props) => {
    const location = useLocation()
    const shouldReduceMotion = useReducedMotion()

    return (
        <motion.div
            key={location.pathname}
            initial={{ opacity: shouldReduceMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={{
                duration: shouldReduceMotion ? 0 : 0.3,
                ease: 'easeOut',
            }}
            style={{
                width: '100%',
                minHeight: '100dvh',
            }}
        >
            {children}
        </motion.div>
    )
}
