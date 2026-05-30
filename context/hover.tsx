import { createContext, useContext, useState, ReactNode } from 'react'

type HoveredPoint = { lat: number; lng: number; elevation: number } | null

type HoverContextType = {
  hoveredPoint: HoveredPoint
  setHoveredPoint: (point: HoveredPoint) => void // eslint-disable-line no-unused-vars
}

const HoverContext = createContext<HoverContextType>({
  hoveredPoint: null,
  setHoveredPoint: () => {},
})

export const HoverProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [hoveredPoint, setHoveredPoint] = useState<HoveredPoint>(null)
  return <HoverContext.Provider value={{ hoveredPoint, setHoveredPoint }}>{children}</HoverContext.Provider>
}

export const useHover = (): HoverContextType => useContext(HoverContext)
