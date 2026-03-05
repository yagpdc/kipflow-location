import { useSearchStore } from '../../store/search.store'

// Brazil bounding box
const BR = { north: 5.5, south: -34.0, east: -34.5, west: -74.5 }
const BR_W = BR.east - BR.west
const BR_H = BR.north - BR.south

// Simplified Brazil outline — real [lat, lng] coordinates clockwise from Oiapoque
const BRAZIL_GEO: [number, number][] = [
  // Oiapoque → North coast (east to west along Atlantic)
  [4.4, -51.6],
  [2.2, -50.0],
  [0.7, -49.9],
  [-0.5, -48.5],
  [-1.0, -46.0],
  [-2.5, -44.3],
  [-2.8, -42.0],
  [-3.4, -39.0],
  [-3.8, -38.0],
  [-5.1, -36.0],
  [-5.8, -35.2],
  // Northeast bulge
  [-7.2, -34.8],
  [-8.0, -34.9],
  [-9.4, -35.5],
  [-10.5, -36.4],
  [-11.8, -37.5],
  [-13.0, -38.5],
  // Bahia → Southeast coast
  [-15.0, -39.0],
  [-17.8, -39.2],
  [-19.8, -40.0],
  [-20.3, -40.3],
  [-22.0, -41.0],
  // Rio → São Paulo → South coast
  [-23.0, -43.2],
  [-23.8, -45.4],
  [-24.5, -47.0],
  [-25.5, -48.5],
  [-27.2, -48.7],
  [-28.6, -49.4],
  [-29.3, -49.7],
  // Rio Grande do Sul coast
  [-30.0, -50.3],
  [-32.0, -52.1],
  [-33.0, -52.8],
  [-33.7, -53.4],
  // RS → Uruguay/Argentina border (going west)
  [-33.0, -53.5],
  [-31.4, -54.0],
  [-30.2, -57.0],
  [-29.5, -57.6],
  // Argentina border (going north)
  [-28.0, -55.8],
  [-27.3, -55.6],
  [-27.1, -54.6],
  // Paraguay border
  [-25.3, -54.6],
  [-24.0, -54.6],
  [-23.4, -55.4],
  [-22.3, -55.8],
  // Mato Grosso do Sul → Bolivia
  [-21.0, -57.5],
  [-19.8, -57.8],
  [-18.3, -57.7],
  [-17.8, -58.0],
  // Bolivia border (going north)
  [-16.0, -58.4],
  [-14.2, -59.9],
  [-12.5, -60.5],
  [-11.0, -61.5],
  [-10.1, -65.3],
  // Acre → Peru border
  [-9.2, -66.6],
  [-9.0, -68.7],
  [-8.2, -72.8],
  [-7.5, -73.2],
  // Peru → Colombia border
  [-4.3, -69.9],
  [-2.5, -69.7],
  [-1.1, -69.6],
  // Colombia → Venezuela
  [0.6, -67.1],
  [1.3, -66.9],
  [2.0, -64.5],
  [2.2, -61.0],
  // Venezuela → Guyana → Suriname → French Guiana
  [3.9, -60.6],
  [5.2, -60.7],
  [5.0, -59.8],
  [4.5, -58.5],
  [4.0, -56.5],
  [3.8, -54.5],
  [3.9, -52.3],
  [4.2, -51.8],
  // Close back to Oiapoque
  [4.4, -51.6],
]

function geoToSvg(lat: number, lng: number, w: number, h: number) {
  const x = ((lng - BR.west) / BR_W) * w
  const y = ((BR.north - lat) / BR_H) * h
  return { x, y }
}

export default function BrazilMinimap() {
  const mapBounds = useSearchStore((s) => s.mapBounds)
  const filteredCompanies = useSearchStore((s) => s.filteredCompanies)
  const heatmapCells = useSearchStore((s) => s.heatmapCells)

  const W = 200
  const H = 200

  // Brazil outline as SVG path
  const outlinePath = BRAZIL_GEO
    .map(([lat, lng], i) => {
      const { x, y } = geoToSvg(lat, lng, W, H)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ') + ' Z'

  // Viewport rectangle
  let viewRect = null
  if (mapBounds) {
    const tl = geoToSvg(mapBounds.north, mapBounds.west, W, H)
    const br = geoToSvg(mapBounds.south, mapBounds.east, W, H)
    const rw = Math.max(br.x - tl.x, 4)
    const rh = Math.max(br.y - tl.y, 4)
    viewRect = {
      x: Math.max(0, tl.x),
      y: Math.max(0, tl.y),
      w: Math.min(rw, W - Math.max(0, tl.x)),
      h: Math.min(rh, H - Math.max(0, tl.y)),
    }
  }

  const count = filteredCompanies.length + heatmapCells.reduce((s, c) => s + c.count, 0)

  return (
    <div className="flex flex-col items-center gap-2 py-4 px-4">
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-w-[200px]"
      >
        {/* Brazil outline */}
        <path
          d={outlinePath}
          className="fill-surface-alt stroke-border"
          strokeWidth={1.2}
          strokeLinejoin="round"
        />

        {/* Viewport rectangle */}
        {viewRect && (
          <rect
            x={viewRect.x}
            y={viewRect.y}
            width={viewRect.w}
            height={viewRect.h}
            fill="rgba(249, 115, 22, 0.15)"
            stroke="#f97316"
            strokeWidth={1.5}
            rx={2}
          />
        )}
      </svg>
      <span className="text-xs font-medium text-text-muted">
        {count > 0
          ? `${count} empresa${count !== 1 ? 's' : ''} na área`
          : 'Navegue o mapa para buscar'}
      </span>
    </div>
  )
}
