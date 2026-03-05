import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polygon,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { useSearchStore } from "../../store/search.store";
import { useRouteStore } from "../../store/route.store";
import { useThemeStore } from "../../store/theme.store";
import { useCreditsStore } from "../../store/credits.store";
import type { Company, HeatmapCell } from "../../types";
import { MOCK_COMPANIES } from "../../mocks/companies";
import { UF_COORDS } from "../../constants/uf-coords";
import {
  MAX_VIEWPORT_DIAGONAL_KM,
  getBoundsDiagonalKm,
} from "../../hooks/useCompanySearch";
import { FiMapPin, FiPhone, FiMail, FiStar } from "react-icons/fi";
import { renderToString } from "react-dom/server";

const MAX_RADIUS_KM = 50;
const MAX_RADIUS_M = MAX_RADIUS_KM * 1000;

const SEGMENT_COLORS: Record<string, string> = {
  Tecnologia: "#3b82f6",
  Saúde: "#ef4444",
  Varejo: "#f59e0b",
  Educação: "#8b5cf6",
  Alimentação: "#f97316",
  Indústria: "#6b7280",
  "Construção Civil": "#92400e",
  "Serviços Financeiros": "#059669",
  Logística: "#0891b2",
  Consultoria: "#7c3aed",
  Marketing: "#ec4899",
  Agronegócio: "#16a34a",
};

function createMarkerIcon(segmento: string, isEnriched: boolean) {
  const color = SEGMENT_COLORS[segmento] || "#6b7280";
  const html = renderToString(
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: "50% 50% 50% 0",
        background: color,
        transform: "rotate(-45deg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: isEnriched ? "3px solid #f97316" : "2px solid white",
        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
      }}
    >
      <span
        style={{
          transform: "rotate(45deg)",
          color: "white",
          fontSize: 14,
          fontWeight: "bold",
        }}
      >
        {segmento[0]}
      </span>
    </div>,
  );

  return L.divIcon({
    html,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

const USER_LOCATION_KEY = "geo-kipflow-user-location";

function getSavedLocation(): [number, number] | null {
  try {
    const raw = localStorage.getItem(USER_LOCATION_KEY);
    if (!raw) return null;
    const { lat, lng } = JSON.parse(raw);
    if (typeof lat === "number" && typeof lng === "number") return [lat, lng];
  } catch {
    /* ignore */
  }
  return null;
}

function UserLocationCenter({
  onReady,
  onDenied,
}: {
  onReady: () => void;
  onDenied: () => void;
}) {
  const map = useMap();
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const saved = getSavedLocation();
    if (saved) {
      map.setView(saved, 15);
      onReady();
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            localStorage.setItem(
              USER_LOCATION_KEY,
              JSON.stringify({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              }),
            );
          },
          () => {},
          { enableHighAccuracy: false, timeout: 8000 },
        );
      }
      return;
    }

    if (!navigator.geolocation) {
      onDenied();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: [number, number] = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];
        localStorage.setItem(
          USER_LOCATION_KEY,
          JSON.stringify({ lat: loc[0], lng: loc[1] }),
        );
        map.setView(loc, 15);
        onReady();
      },
      () => {
        onDenied();
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }, [map, onReady, onDenied]);

  return null;
}

function MapBoundsReporter() {
  const map = useMap();
  const setMapBounds = useSearchStore((s) => s.setMapBounds);

  useEffect(() => {
    const reportBounds = () => {
      const b = map.getBounds();
      setMapBounds(
        {
          north: b.getNorth(),
          south: b.getSouth(),
          east: b.getEast(),
          west: b.getWest(),
        },
        map.getZoom(),
      );
    };

    // Report initial bounds
    reportBounds();

    map.on("moveend", reportBounds);
    map.on("zoomend", reportBounds);
    return () => {
      map.off("moveend", reportBounds);
      map.off("zoomend", reportBounds);
    };
  }, [map, setMapBounds]);

  return null;
}

type DrawMode = "none" | "circle" | "polygon";

function DrawingOverlay() {
  const map = useMap();
  const setArea = useSearchStore((s) => s.setArea);
  const area = useSearchStore((s) => s.filters.area);
  const [mode, setMode] = useState<DrawMode>("none");
  const [circleCenter, setCircleCenter] = useState<[number, number] | null>(
    null,
  );
  const [polygonPoints, setPolygonPoints] = useState<[number, number][]>([]);
  const [circleRadius, setCircleRadius] = useState(10000);
  const [mousePos, setMousePos] = useState<[number, number] | null>(null);

  // Refs to avoid stale closures in map click handler
  const modeRef = useRef(mode);
  const circleRadiusRef = useRef(circleRadius);
  const polygonPointsRef = useRef(polygonPoints);
  modeRef.current = mode;
  circleRadiusRef.current = circleRadius;
  polygonPointsRef.current = polygonPoints;

  // Zoom map to fit a circle
  const zoomToCircle = useCallback(
    (center: [number, number], radius: number) => {
      const circleBounds = L.latLng(center[0], center[1]).toBounds(
        radius * 2.4,
      );
      map.fitBounds(circleBounds, { padding: [30, 30], maxZoom: 15 });
    },
    [map],
  );

  // Zoom map to fit polygon bounds
  const zoomToPolygon = useCallback(
    (points: [number, number][]) => {
      if (points.length < 3) return;
      const bounds = L.latLngBounds(points.map((p) => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    },
    [map],
  );

  // Check if click is near the first polygon point (within 15px on screen)
  const isNearFirstPoint = useCallback(
    (latlng: L.LatLng): boolean => {
      const pts = polygonPointsRef.current;
      if (pts.length < 3) return false;
      const firstPointPx = map.latLngToContainerPoint(
        L.latLng(pts[0][0], pts[0][1]),
      );
      const clickPx = map.latLngToContainerPoint(latlng);
      const dist = firstPointPx.distanceTo(clickPx);
      return dist <= 15;
    },
    [map],
  );

  // Finish polygon ref so click handler can call it without stale closure
  const finishPolygonRef = useRef<() => void>(() => {});

  // Click handler
  useEffect(() => {
    const onClick = (e: L.LeafletMouseEvent) => {
      if (modeRef.current === "circle") {
        const { lat, lng } = e.latlng;
        const actualRadius = circleRadiusRef.current / 2;
        setCircleCenter([lat, lng]);
        setArea({ type: "circle", center: [lat, lng], radius: actualRadius });
        zoomToCircle([lat, lng], actualRadius);
      } else if (modeRef.current === "polygon") {
        // Close polygon if clicking near the first point
        if (isNearFirstPoint(e.latlng)) {
          finishPolygonRef.current();
          return;
        }
        const { lat, lng } = e.latlng;
        setPolygonPoints((prev) => [...prev, [lat, lng]]);
      }
    };
    map.on("click", onClick);
    return () => {
      map.off("click", onClick);
    };
  }, [map, setArea, zoomToCircle, isNearFirstPoint]);

  // Mousemove handler for polygon preview line
  useEffect(() => {
    const onMouseMove = (e: L.LeafletMouseEvent) => {
      if (
        modeRef.current === "polygon" &&
        polygonPointsRef.current.length > 0
      ) {
        setMousePos([e.latlng.lat, e.latlng.lng]);
      }
    };
    map.on("mousemove", onMouseMove);
    return () => {
      map.off("mousemove", onMouseMove);
    };
  }, [map]);

  // Clear mouse pos when leaving polygon mode or when no points
  useEffect(() => {
    if (mode !== "polygon" || polygonPoints.length === 0) {
      setMousePos(null);
    }
  }, [mode, polygonPoints.length]);

  // Cursor style
  useEffect(() => {
    map.getContainer().style.cursor = mode !== "none" ? "crosshair" : "";
    return () => {
      map.getContainer().style.cursor = "";
    };
  }, [mode, map]);

  const finishPolygon = useCallback(() => {
    const pts = polygonPointsRef.current;
    if (pts.length >= 3) {
      setArea({ type: "polygon", coordinates: pts });
      zoomToPolygon(pts);
    }
    setMode("none");
    setMousePos(null);
    setPolygonPoints([]);
  }, [setArea, zoomToPolygon]);

  finishPolygonRef.current = finishPolygon;

  const clearArea = () => {
    setMode("none");
    setCircleCenter(null);
    setPolygonPoints([]);
    setMousePos(null);
    setArea(null);
  };

  const startCircle = () => {
    clearArea();
    setMode("circle");
  };

  const startPolygon = () => {
    clearArea();
    setMode("polygon");
  };

  const handleRadiusChange = (r: number) => {
    const clamped = Math.min(r, MAX_RADIUS_M);
    setCircleRadius(clamped);
    if (circleCenter) {
      const actualRadius = clamped / 2;
      setArea({ type: "circle", center: circleCenter, radius: actualRadius });
      zoomToCircle(circleCenter, actualRadius);
    }
  };

  // Build preview lines for polygon drawing: existing edges + line from last point to mouse
  const polygonPreviewPositions = useMemo(() => {
    if (mode !== "polygon" || polygonPoints.length === 0 || area) return null;
    return polygonPoints;
  }, [mode, polygonPoints, area]);

  const mousePreviewLine = useMemo((): [number, number][] | null => {
    if (!mousePos || polygonPoints.length === 0 || mode !== "polygon" || area)
      return null;
    const lastPoint = polygonPoints[polygonPoints.length - 1];
    return [lastPoint, mousePos];
  }, [mousePos, polygonPoints, mode, area]);

  // Prevent map from capturing events on control panels
  const controlsRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const polyInfoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const els = [controlsRef.current, sliderRef.current, polyInfoRef.current];
    for (const el of els) {
      if (!el) continue;
      L.DomEvent.disableClickPropagation(el);
      L.DomEvent.disableScrollPropagation(el);
    }
  });

  return (
    <>
      {/* Draw controls */}
      <div
        ref={controlsRef}
        className="absolute top-3 right-3 z-[1000] flex flex-col gap-2"
      >
        <button
          onClick={startCircle}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-md text-sm font-medium transition-colors ${
            mode === "circle"
              ? "bg-primary text-white"
              : "bg-card text-text hover:bg-surface-alt"
          }`}
        >
          <FiMapPin size={16} />
          Raio
        </button>
        <button
          onClick={startPolygon}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-md text-sm font-medium transition-colors ${
            mode === "polygon"
              ? "bg-primary text-white"
              : "bg-card text-text hover:bg-surface-alt"
          }`}
        >
          <FiStar size={16} />
          Polígono
        </button>
        {(area || mode !== "none") && (
          <button
            onClick={clearArea}
            className="px-3 py-2 rounded-lg shadow-md text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            Limpar
          </button>
        )}
        {mode === "polygon" && polygonPoints.length >= 3 && (
          <button
            onClick={finishPolygon}
            className="px-3 py-2 rounded-lg shadow-md text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-colors"
          >
            Fechar
          </button>
        )}
      </div>

      {/* Radius slider */}
      {mode === "circle" && (
        <div
          ref={sliderRef}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-card rounded-lg shadow-lg px-4 py-3 flex items-center gap-3"
        >
          <span className="text-sm text-text-muted">Alcance:</span>
          <input
            type="range"
            min={2000}
            max={MAX_RADIUS_M}
            step={1000}
            value={circleRadius}
            onChange={(e) => handleRadiusChange(Number(e.target.value))}
            className="w-32 accent-primary"
          />
          <span className="text-sm font-medium text-text">
            {(circleRadius / 1000).toFixed(0)} km
          </span>
          <span className="text-xs text-text-muted ml-2">
            Clique no mapa para posicionar
          </span>
        </div>
      )}

      {/* Polygon instructions */}
      {mode === "polygon" && (
        <div
          ref={polyInfoRef}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-card rounded-lg shadow-lg px-4 py-3"
        >
          <span className="text-sm text-text-muted">
            Clique no mapa para adicionar pontos ({polygonPoints.length} pontos)
            {polygonPoints.length >= 3 &&
              " — clique no primeiro ponto para fechar"}
          </span>
        </div>
      )}

      {/* Circle shape */}
      {area?.type === "circle" && (
        <Circle
          center={area.center}
          radius={area.radius}
          pathOptions={{
            color: "#f97316",
            fillColor: "#f97316",
            fillOpacity: 0.1,
            weight: 2,
          }}
        />
      )}

      {/* Polygon shape (committed) */}
      {area?.type === "polygon" && (
        <Polygon
          positions={area.coordinates}
          pathOptions={{
            color: "#f97316",
            fillColor: "#f97316",
            fillOpacity: 0.1,
            weight: 2,
          }}
        />
      )}

      {/* First point indicator (clickable to close) */}
      {mode === "polygon" && polygonPoints.length >= 3 && !area && (
        <Circle
          center={polygonPoints[0]}
          radius={500}
          pathOptions={{
            color: "#f97316",
            fillColor: "#f97316",
            fillOpacity: 0.4,
            weight: 2,
          }}
        />
      )}

      {/* Polygon edges drawn so far */}
      {polygonPreviewPositions && polygonPreviewPositions.length >= 2 && (
        <Polyline
          positions={polygonPreviewPositions}
          pathOptions={{ color: "#f97316", weight: 2, dashArray: "6,6" }}
        />
      )}

      {/* Polygon preview line from last point to mouse cursor */}
      {mousePreviewLine && (
        <Polyline
          positions={mousePreviewLine}
          pathOptions={{
            color: "#f97316",
            weight: 2,
            opacity: 0.6,
            dashArray: "4,8",
          }}
        />
      )}
    </>
  );
}

function ZoomTransitionAlert() {
  const map = useMap();
  const segmentos = useSearchStore((s) => s.filters.segmentos);
  const mapBounds = useSearchStore((s) => s.mapBounds);

  const [showHeatmapPrompt, setShowHeatmapPrompt] = useState(false);
  const [showMarkerToast, setShowMarkerToast] = useState(false);

  const prevSegmentosRef = useRef<string[]>([]);
  const prevWasHeatmapRef = useRef(false);

  // Detect: user selected a segment while zoomed in → ask to zoom out
  useEffect(() => {
    const wasEmpty = prevSegmentosRef.current.length === 0;
    const nowHas = segmentos.length > 0;
    prevSegmentosRef.current = segmentos;

    if (wasEmpty && nowHas && mapBounds) {
      const diagonal = getBoundsDiagonalKm(mapBounds);
      if (diagonal <= MAX_VIEWPORT_DIAGONAL_KM) {
        setShowHeatmapPrompt(true);
      }
    }
  }, [segmentos, mapBounds]);

  // Detect: transitioning from heatmap range to marker range
  useEffect(() => {
    if (!mapBounds || segmentos.length === 0) {
      prevWasHeatmapRef.current = false;
      return;
    }

    const diagonal = getBoundsDiagonalKm(mapBounds);
    const isHeatmapRange = diagonal > MAX_VIEWPORT_DIAGONAL_KM;
    const wasHeatmap = prevWasHeatmapRef.current;

    if (wasHeatmap && !isHeatmapRange) {
      setShowMarkerToast(true);
      setTimeout(() => setShowMarkerToast(false), 3000);
    }

    prevWasHeatmapRef.current = isHeatmapRange;
  }, [mapBounds, segmentos]);

  const handleZoomOut = useCallback(() => {
    map.setZoom(8, { animate: true });
    setShowHeatmapPrompt(false);
  }, [map]);

  return (
    <>
      {/* Prompt: zoom out to see heatmap */}
      {showHeatmapPrompt && (
        <div className="absolute inset-0 z-[1500] flex items-center justify-center pointer-events-none">
          <div className="bg-card rounded-xl shadow-2xl px-6 py-5 max-w-sm pointer-events-auto border border-border">
            <h3 className="font-bold text-text text-base mb-2">
              Mapa de Concentração
            </h3>
            <p className="text-sm text-text-muted mb-4">
              Deseja visualizar o mapa de concentração para este segmento? O
              mapa será afastado para mostrar as regiões com maior densidade de
              empresas.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleZoomOut}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
              >
                Ver concentração
              </button>
              <button
                onClick={() => setShowHeatmapPrompt(false)}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-surface-alt text-text hover:bg-border transition-colors"
              >
                Manter aqui
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast: leaving heatmap view */}
      {showMarkerToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1500] bg-card/95 backdrop-blur-sm rounded-lg shadow-lg px-4 py-2.5 border border-border">
          <p className="text-sm text-text font-medium">Exibindo empresas</p>
        </div>
      )}
    </>
  );
}

function LocationFilterMismatchAlert() {
  const uf = useSearchStore((s) => s.filters.uf);
  const municipio = useSearchStore((s) => s.filters.municipio);
  const filteredCompanies = useSearchStore((s) => s.filteredCompanies);
  const mapBounds = useSearchStore((s) => s.mapBounds);
  const setUf = useSearchStore((s) => s.setUf);
  const setMunicipio = useSearchStore((s) => s.setMunicipio);
  const setFlyToTarget = useSearchStore((s) => s.setFlyToTarget);

  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed when filter changes
  useEffect(() => {
    setDismissed(false);
  }, [uf, municipio]);

  useEffect(() => {
    // Only when location filter is active
    if (!uf && !municipio) {
      setShow(false);
      return;
    }
    // Only when zoomed in enough
    if (!mapBounds) {
      setShow(false);
      return;
    }
    const diagonal = getBoundsDiagonalKm(mapBounds);
    if (diagonal > MAX_VIEWPORT_DIAGONAL_KM) {
      setShow(false);
      return;
    }
    // If filtered companies are visible, no mismatch
    if (filteredCompanies.length > 0) {
      setShow(false);
      return;
    }
    // Already dismissed
    if (dismissed) {
      setShow(false);
      return;
    }

    // Check if there ARE companies in this viewport ignoring location filter
    const companiesInView = MOCK_COMPANIES.filter(
      (c) =>
        c.latitude >= mapBounds.south &&
        c.latitude <= mapBounds.north &&
        c.longitude >= mapBounds.west &&
        c.longitude <= mapBounds.east,
    );

    setShow(companiesInView.length > 0);
  }, [mapBounds, uf, municipio, filteredCompanies, dismissed]);

  if (!show) return null;

  const filterLabel = uf ? uf : `"${municipio}"`;

  const handleGoBack = () => {
    if (uf && UF_COORDS[uf]) {
      setFlyToTarget(UF_COORDS[uf]);
    }
    setShow(false);
    setDismissed(true);
  };

  const handleClearFilter = () => {
    if (uf) setUf("");
    if (municipio) setMunicipio("");
    setShow(false);
    setDismissed(true);
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
  };

  return (
    <div className="absolute inset-0 z-[1500] flex items-center justify-center pointer-events-none">
      <div className="bg-card rounded-xl shadow-2xl px-6 py-5 max-w-sm pointer-events-auto border border-border">
        <h3 className="font-bold text-text text-base mb-2">
          Filtro de localização ativo
        </h3>
        <p className="text-sm text-text-muted mb-4">
          Você tem um filtro aplicado para{" "}
          <strong className="text-text">{filterLabel}</strong>, mas está
          visualizando outra região. Existem empresas aqui que não estão sendo
          exibidas.
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={handleClearFilter}
            className="w-full px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            Limpar filtro de localização
          </button>
          {uf && UF_COORDS[uf] && (
            <button
              onClick={handleGoBack}
              className="w-full px-4 py-2 text-sm font-medium rounded-lg bg-surface-alt text-text hover:bg-border transition-colors"
            >
              Voltar para {uf}
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="w-full px-4 py-2 text-sm font-medium rounded-lg text-text-muted hover:bg-surface-alt transition-colors"
          >
            Manter filtro
          </button>
        </div>
      </div>
    </div>
  );
}

function FlyToHandler() {
  const map = useMap();
  const flyToTarget = useSearchStore((s) => s.flyToTarget);
  const setFlyToTarget = useSearchStore((s) => s.setFlyToTarget);

  useEffect(() => {
    if (!flyToTarget) return;
    map.flyTo(flyToTarget.center, flyToTarget.zoom, { duration: 1.5 });
    // Clear after flying so it doesn't re-trigger
    setFlyToTarget(null);
  }, [flyToTarget, map, setFlyToTarget]);

  return null;
}

function ThemeTileLayer() {
  const isDark = useThemeStore((s) => s.isDark);

  return (
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      className={isDark ? "dark-tiles" : ""}
    />
  );
}

function ViewModeLabel() {
  const heatmapCells = useSearchStore((s) => s.heatmapCells);
  const filteredCompanies = useSearchStore((s) => s.filteredCompanies);

  const isHeatmap = heatmapCells.length > 0;
  const isMarkers = filteredCompanies.length > 0;

  if (!isHeatmap && !isMarkers) return null;

  const label = isHeatmap
    ? "Visualização de segmentos"
    : "Visualização de empresas";

  return (
    <div className="absolute bottom-4 left-3 z-[1000] pointer-events-none">
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/80 backdrop-blur-sm text-xs font-medium text-text-muted shadow-sm border border-border/50">
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: isHeatmap ? "#f97316" : "#3b82f6" }}
        />
        {label}
      </span>
    </div>
  );
}

function HeatmapOverlay() {
  const map = useMap();
  const heatmapCells = useSearchStore((s) => s.heatmapCells);

  const handleCellClick = useCallback(
    (cell: HeatmapCell) => {
      const bounds = L.latLngBounds(
        cell.coordinates.map((c) => L.latLng(c[0], c[1])),
      );
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    },
    [map],
  );

  if (heatmapCells.length === 0) return null;

  return (
    <>
      {heatmapCells.map((cell, i) => (
        <Polygon
          key={`heatmap-${i}`}
          positions={cell.coordinates}
          pathOptions={{
            color: "#f97316",
            fillColor: "#f97316",
            fillOpacity: 0.15 + cell.intensity * 0.55,
            weight: 1,
            opacity: 0.4,
          }}
          eventHandlers={{ click: () => handleCellClick(cell) }}
        >
          <Popup>
            <div className="text-center p-1">
              <p className="font-bold text-lg text-primary">{cell.count}</p>
              <p className="text-xs text-text-muted">{cell.municipio}</p>
              <p className="text-xs text-text-muted mt-1">
                Clique para aproximar
              </p>
            </div>
          </Popup>
        </Polygon>
      ))}
    </>
  );
}

const ROUTE_UPDATE_INTERVAL = 120_000; // 2 minutos

function RouteTracker() {
  const isTracking = useRouteStore((s) => s.isTracking);
  const destination = useRouteStore((s) => s.destination);
  const fetchRoute = useRouteStore((s) => s.fetchRoute);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    if (!isTracking || !destination || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastUpdateRef.current < ROUTE_UPDATE_INTERVAL) return;
        lastUpdateRef.current = now;

        const newOrigin: [number, number] = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];
        localStorage.setItem(
          USER_LOCATION_KEY,
          JSON.stringify({ lat: newOrigin[0], lng: newOrigin[1] }),
        );
        fetchRoute(newOrigin, destination, true);
      },
      () => {
        /* silently ignore errors during tracking */
      },
      { enableHighAccuracy: true, maximumAge: 30_000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isTracking, destination, fetchRoute]);

  return null;
}

function RouteInfoPanel() {
  const route = useRouteStore((s) => s.route);
  const isTracking = useRouteStore((s) => s.isTracking);
  const isLoading = useRouteStore((s) => s.isLoading);
  const clearRoute = useRouteStore((s) => s.clearRoute);

  if (!route) return null;

  const distKm =
    route.distance >= 1000
      ? `${(route.distance / 1000).toFixed(1)} km`
      : `${Math.round(route.distance)} m`;
  const hours = Math.floor(route.duration / 3600);
  const minutes = Math.ceil((route.duration % 3600) / 60);
  const time = hours > 0 ? `${hours}h ${minutes}min` : `${minutes} min`;

  return (
    <div className="absolute bottom-6 right-4 z-[1000]">
      <div className="bg-card/95 backdrop-blur-sm rounded-xl shadow-2xl border border-border px-6 py-5 space-y-3 min-w-[240px]">
        {isTracking && (
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            <span className="text-xs text-green-500 font-semibold">
              {isLoading ? "Atualizando rota..." : "Rastreando em tempo real"}
            </span>
          </div>
        )}
        <div className="flex items-center gap-6">
          <div>
            <p className="text-[11px] text-text-muted uppercase tracking-wide mb-0.5">
              Distância
            </p>
            <p className="text-xl font-bold text-text">{distKm}</p>
          </div>
          <div className="w-px h-10 bg-border" />
          <div>
            <p className="text-[11px] text-text-muted uppercase tracking-wide mb-0.5">
              Tempo
            </p>
            <p className="text-xl font-bold text-text">{time}</p>
          </div>
        </div>
        <button
          onClick={clearRoute}
          className="w-full py-2 text-sm font-medium rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
        >
          Limpar rota
        </button>
      </div>
    </div>
  );
}

function RouteOverlay() {
  const map = useMap();
  const route = useRouteStore((s) => s.route);
  const prevRouteRef = useRef<typeof route>(null);

  useEffect(() => {
    if (route && route !== prevRouteRef.current) {
      const bounds = L.latLngBounds(
        route.geometry.map(([lat, lng]) => L.latLng(lat, lng)),
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
    prevRouteRef.current = route;
  }, [route, map]);

  if (!route) return null;

  return (
    <>
      <Polyline
        positions={route.geometry}
        pathOptions={{ color: "#3b82f6", weight: 4, opacity: 0.8 }}
      />
      <Circle
        center={route.origin}
        radius={150}
        pathOptions={{
          color: "#3b82f6",
          fillColor: "#3b82f6",
          fillOpacity: 0.5,
          weight: 2,
        }}
      />
    </>
  );
}

const DEFAULT_CENTER: [number, number] = [-14.235, -51.925];
const DEFAULT_ZOOM = 4;

export default function MapView() {
  const initialLocation = useMemo(() => getSavedLocation(), []);
  const [locationState, setLocationState] = useState<
    "ready" | "loading" | "denied"
  >(initialLocation ? "ready" : "loading");
  const handleLocationReady = useCallback(() => setLocationState("ready"), []);
  const handleLocationDenied = useCallback(
    () => setLocationState("denied"),
    [],
  );
  const filteredCompanies = useSearchStore((s) => s.filteredCompanies);
  const setSelectedCompany = useSearchStore((s) => s.setSelectedCompany);
  const setShowDetail = useSearchStore((s) => s.setShowDetail);
  const enrichCompany = useSearchStore((s) => s.enrichCompany);
  const credits = useCreditsStore((s) => s.credits);
  const spendCredits = useCreditsStore((s) => s.spendCredits);

  const handleEnrich = useCallback(
    (company: Company) => {
      if (company.is_enriched) {
        setSelectedCompany(company);
        setShowDetail(true);
        return;
      }
      if (spendCredits(1)) {
        enrichCompany(company.id);
        const enriched = { ...company, is_enriched: true };
        setSelectedCompany(enriched);
        setShowDetail(true);
      }
    },
    [setSelectedCompany, setShowDetail, enrichCompany, spendCredits],
  );

  const markers = useMemo(
    () =>
      filteredCompanies.map((company) => (
        <Marker
          key={company.id}
          position={[company.latitude, company.longitude]}
          icon={createMarkerIcon(company.segmento, company.is_enriched)}
        >
          <Popup maxWidth={320} minWidth={280}>
            <div className="p-1">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-base text-text leading-tight">
                  {company.nome_fantasia}
                </h3>
                <span
                  className="shrink-0 text-xs px-2 py-0.5 rounded-full text-white font-medium"
                  style={{
                    backgroundColor:
                      SEGMENT_COLORS[company.segmento] || "#6b7280",
                  }}
                >
                  {company.segmento}
                </span>
              </div>
              <p className="text-xs text-text-muted mb-1">
                {company.razao_social}
              </p>
              <p className="text-xs text-text-muted mb-1">
                CNPJ: {company.cnpj}
              </p>
              <p className="text-xs text-text-muted mb-1">
                CNAE: {company.cnae_descricao}
              </p>
              <p className="text-xs text-text-muted mb-3">
                {company.municipio}/{company.uf} — {company.endereco}
              </p>

              {company.is_enriched ? (
                <div className="border-t border-border pt-2">
                  <div className="flex items-center gap-1.5 text-xs text-text mb-1">
                    <FiPhone size={12} className="text-green-600" />
                    {company.telefones.map((t) => t.numero).join(", ")}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-text mb-2">
                    <FiMail size={12} className="text-blue-600" />
                    {company.emails.map((e) => e.email).join(", ")}
                  </div>
                  <button
                    onClick={() => handleEnrich(company)}
                    className="w-full py-1.5 text-xs font-medium rounded bg-secondary text-white hover:bg-secondary-light transition-colors"
                  >
                    Ver detalhes completos
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleEnrich(company)}
                  disabled={credits < 1}
                  className="w-full py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {credits < 1 ? "Sem créditos" : "Enriquecer (1 crédito)"}
                </button>
              )}
            </div>
          </Popup>
        </Marker>
      )),
    [filteredCompanies, credits, handleEnrich],
  );

  return (
    <div className="relative h-full w-full">
      {locationState === "loading" && (
        <div className="absolute inset-0 z-[2000] bg-surface/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-text-muted font-medium">
            Obtendo sua localização...
          </p>
        </div>
      )}
      {locationState === "denied" && (
        <div className="absolute inset-0 z-[2000] bg-surface/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
          <FiMapPin size={32} className="text-primary" />
          <p className="text-sm text-text font-medium">
            Localização bloqueada pelo navegador
          </p>
          <p className="text-xs text-text-muted text-center max-w-xs">
            Clique no ícone de cadeado/localização na barra de endereço e
            permita o acesso à localização.
          </p>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => {
                setLocationState("loading");
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    const loc: [number, number] = [
                      pos.coords.latitude,
                      pos.coords.longitude,
                    ];
                    localStorage.setItem(
                      USER_LOCATION_KEY,
                      JSON.stringify({ lat: loc[0], lng: loc[1] }),
                    );
                    setLocationState("ready");
                  },
                  () => setLocationState("denied"),
                  { enableHighAccuracy: false, timeout: 8000 },
                );
              }}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
            >
              Tentar novamente
            </button>
            <button
              onClick={() => setLocationState("ready")}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-200 text-text hover:bg-gray-300 transition-colors"
            >
              Continuar sem localização
            </button>
          </div>
        </div>
      )}
      <MapContainer
        center={initialLocation || DEFAULT_CENTER}
        zoom={initialLocation ? 15 : DEFAULT_ZOOM}
        className="h-full w-full"
        zoomControl={false}
      >
        <ThemeTileLayer />

        <UserLocationCenter
          onReady={handleLocationReady}
          onDenied={handleLocationDenied}
        />
        <MapBoundsReporter />
        <FlyToHandler />
        <DrawingOverlay />
        <HeatmapOverlay />
        <ZoomTransitionAlert />
        {markers}
        <RouteOverlay />
      </MapContainer>
      <LocationFilterMismatchAlert />
      <ViewModeLabel />
      <RouteInfoPanel />
      <RouteTracker />
    </div>
  );
}
