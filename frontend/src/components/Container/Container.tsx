import type { PropsWithChildren } from 'react'
import classNames from 'classnames'
import './Container.scss'

type Props = PropsWithChildren<{
    className?: string
}>

export const Container = ({
                              className,
                              children,
                          }: Props) => {
    return (
        <div className={classNames('container', className)}>
            {children}
        </div>
    )
}
