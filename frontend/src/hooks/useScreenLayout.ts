import { useEffect, useState } from 'react'

export type ScreenType = 'mobile' | 'tablet' | 'desktop'

type ScreenLayout = {
    screenType: ScreenType
    visibleCards: 1 | 2 | 3 | 4 | 5
}

const MOBILE_BREAKPOINT = 768
const DESKTOP_BREAKPOINT = 1200
const LARGE_DESKTOP_BREAKPOINT = 1400
const EXTRA_LARGE_DESKTOP_BREAKPOINT = 1800

const getLayout = (): ScreenLayout => {
    const width = window.innerWidth

    if (width < MOBILE_BREAKPOINT) {
        return {
            screenType: 'mobile',
            visibleCards: 1,
        }
    }

    if (width < DESKTOP_BREAKPOINT) {
        return {
            screenType: 'tablet',
            visibleCards: 2,
        }
    }

    if (width < LARGE_DESKTOP_BREAKPOINT) {
        return {
            screenType: 'desktop',
            visibleCards: 3,
        }
    }

    if (width < EXTRA_LARGE_DESKTOP_BREAKPOINT) {
        return {
            screenType: 'desktop',
            visibleCards: 4,
        }
    }

    return {
        screenType: 'desktop',
        visibleCards: 5,
    }
}

export const useScreenLayout = (): ScreenLayout => {
    const [layout, setLayout] = useState<ScreenLayout>(getLayout)

    useEffect(() => {
        const handleResize = () => {
            setLayout(getLayout())
        }

        window.addEventListener('resize', handleResize)

        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    return layout
}
