import React, { useState } from 'react'
import { Button } from './button'
import { cn } from '../../lib/utils'

export function Card({
  title,
  children,
  className,
  ready,
  onSubmit,
  submitting,
  customSubmit,
  footer,
  wide = false
}) {
  return (
    <div
      className={cn(
        "relative glass-card p-6 flex flex-col",
        wide ? "w-full max-w-[1400px]" : "w-full max-w-md",
        className
      )}
    >
      {title && (
        <h2 className="text-xl font-bold mb-4 text-white text-center">{title}</h2>
      )}

      <div className="flex-1 w-full">{children}</div>

      {ready && !customSubmit && (
        <OverlaySubmit onSubmit={onSubmit} submitting={submitting} />
      )}

      {customSubmit && (
        <div className="text-center mt-4">
          <Button size="lg" onClick={customSubmit} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit'}
          </Button>
        </div>
      )}

      {footer && <div className="mt-4">{footer}</div>}
    </div>
  )
}

function OverlaySubmit({ onSubmit, submitting }) {
  const [clicked, setClicked] = useState(false)
  const handleClick = () => {
    if (clicked || submitting) return
    setClicked(true)
    onSubmit && onSubmit()
  }
  return (
    <div className="absolute inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center rounded-[1.75rem]">
      <Button size="lg" onClick={handleClick} disabled={clicked || submitting}>
        {clicked || submitting ? 'Submitting…' : 'Submit Answer'}
      </Button>
    </div>
  )
}
