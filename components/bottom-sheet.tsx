import { useState, useRef, ReactNode, TouchEvent } from 'react'

type BottomSheetProps = {
  children: ReactNode
  collapsedHeight?: number
}

const BottomSheet = ({ children, collapsedHeight = 220 }: BottomSheetProps): JSX.Element => {
  const [expanded, setExpanded] = useState(false)
  const startYRef = useRef<number>(0)

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    startYRef.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    const dy = startYRef.current - e.changedTouches[0].clientY
    if (dy > 40) setExpanded(true)
    if (dy < -40) setExpanded(false)
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl"
      style={{
        height: expanded ? '85dvh' : `${collapsedHeight}px`,
        transition: 'height 0.3s ease',
        zIndex: 20,
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button
        type="button"
        className="w-full flex justify-center pt-3 pb-1"
        onClick={() => setExpanded(v => !v)}
        aria-label={expanded ? 'Sheet einklappen' : 'Sheet ausklappen'}
      >
        <div className="w-8 h-1 bg-gray-300 rounded-full" />
      </button>
      <div className="overflow-y-auto h-full pb-8 px-5">{children}</div>
    </div>
  )
}

export default BottomSheet
