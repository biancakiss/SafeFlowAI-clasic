import { useEffect, useMemo, useRef, useState } from 'react'
import { useMediaQuery } from '@mui/material'
import Globe, { type GlobeMethods } from 'react-globe.gl'
import * as THREE from 'three'
import { feature } from 'topojson-client'
import type { FeatureCollection, Geometry } from 'geojson'
import type { GeometryCollection, Topology } from 'topojson-specification'
import worldAtlas from 'world-atlas/countries-110m.json'
import type { RiskLevel, ScamRoute } from '../../types'

const routeColors: Record<RiskLevel, string> = {
  LOW: '#4FD1B5',
  MEDIUM: '#F7B955',
  HIGH: '#FF6B6B',
}

const topology = worldAtlas as unknown as Topology<{
  countries: GeometryCollection
}>

const countries = (
  feature(
    topology,
    topology.objects.countries,
  ) as FeatureCollection<Geometry>
).features

interface ScamGlobeProps {
  routes: ScamRoute[]
  selectedRouteId: string
  onSelectRoute: (route: ScamRoute) => void
}

interface GlobeSize {
  width: number
  height: number
}

export function ScamGlobe({
  routes,
  selectedRouteId,
  onSelectRoute,
}: ScamGlobeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const globeRef = useRef<GlobeMethods | undefined>(undefined)
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [size, setSize] = useState<GlobeSize>({ width: 0, height: 460 })

  const selectedRoute =
    routes.find((route) => route.id === selectedRouteId) ?? routes[0]

  const globeMaterial = useMemo(
    () =>
      new THREE.MeshPhongMaterial({
        color: '#0B2637',
        emissive: '#06141F',
        emissiveIntensity: 0.38,
        shininess: 8,
      }),
    [],
  )

  const points = useMemo(
    () =>
      routes.flatMap((route) => [
        {
          ...route.source,
          id: `${route.id}-source`,
          riskLevel: route.riskLevel,
          label: `${route.source.city}, ${route.source.country}`,
        },
        {
          ...route.target,
          id: `${route.id}-target`,
          riskLevel: route.riskLevel,
          label: `${route.target.city}, ${route.target.country}`,
        },
      ]),
    [routes],
  )

  useEffect(() => {
    const element = containerRef.current

    if (!element) {
      return undefined
    }

    const updateSize = () => {
      const width = element.clientWidth
      setSize({
        width,
        height: width < 600 ? 360 : 460,
      })
    }

    updateSize()

    const observer = new ResizeObserver(updateSize)
    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const controls = globeRef.current?.controls()

    if (!controls) {
      return
    }

    controls.autoRotate = !prefersReducedMotion
    controls.autoRotateSpeed = 0.42
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.enablePan = false
    controls.minDistance = 165
    controls.maxDistance = 360
  }, [prefersReducedMotion, size.width])

  useEffect(() => {
    if (!size.width) {
      return
    }

    globeRef.current?.pointOfView(
      {
        lat: selectedRoute.target.lat,
        lng: selectedRoute.target.lng,
        altitude: 2.1,
      },
      prefersReducedMotion ? 0 : 900,
    )
  }, [prefersReducedMotion, selectedRoute, size.width])

  useEffect(() => () => globeMaterial.dispose(), [globeMaterial])

  return (
    <div
      ref={containerRef}
      aria-label="Interactive globe showing simulated global scam payment corridors"
      style={{ width: '100%', height: size.height, cursor: 'grab' }}
    >
      {size.width > 0 && (
        <Globe
          ref={globeRef}
          width={size.width}
          height={size.height}
          backgroundColor="rgba(0,0,0,0)"
          globeMaterial={globeMaterial}
          showAtmosphere
          atmosphereColor="#53D3C1"
          atmosphereAltitude={0.14}
          showGraticules
          polygonsData={countries}
          polygonGeoJsonGeometry="geometry"
          polygonAltitude={0.006}
          polygonCapColor={() => 'rgba(49, 139, 143, 0.46)'}
          polygonSideColor={() => 'rgba(12, 45, 58, 0.3)'}
          polygonStrokeColor={() => 'rgba(134, 231, 219, 0.16)'}
          polygonsTransitionDuration={0}
          arcsData={routes}
          arcStartLat={(item) => (item as ScamRoute).source.lat}
          arcStartLng={(item) => (item as ScamRoute).source.lng}
          arcEndLat={(item) => (item as ScamRoute).target.lat}
          arcEndLng={(item) => (item as ScamRoute).target.lng}
          arcColor={(item: object) => {
            const route = item as ScamRoute
            const color = routeColors[route.riskLevel]
            return [`${color}22`, color]
          }}
          arcStroke={(item) =>
            (item as ScamRoute).id === selectedRouteId ? 0.7 : 0.34
          }
          arcDashLength={0.36}
          arcDashGap={0.16}
          arcDashAnimateTime={prefersReducedMotion ? 0 : 2800}
          arcAltitudeAutoScale={0.36}
          arcLabel={(item) => {
            const route = item as ScamRoute
            return `${route.source.city} → ${route.target.city} · ${route.scamType}`
          }}
          onArcClick={(item) => onSelectRoute(item as ScamRoute)}
          pointsData={points}
          pointLat="lat"
          pointLng="lng"
          pointLabel="label"
          pointColor={(item) =>
            routeColors[(item as { riskLevel: RiskLevel }).riskLevel]
          }
          pointAltitude={0.012}
          pointRadius={0.25}
          pointsMerge={false}
          ringsData={prefersReducedMotion ? [] : [
            {
              lat: selectedRoute.target.lat,
              lng: selectedRoute.target.lng,
              color: routeColors[selectedRoute.riskLevel],
            },
          ]}
          ringLat="lat"
          ringLng="lng"
          ringColor="color"
          ringMaxRadius={4.2}
          ringPropagationSpeed={2.2}
          ringRepeatPeriod={1100}
          enablePointerInteraction
        />
      )}
    </div>
  )
}
