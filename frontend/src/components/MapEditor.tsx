import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ViajRuta } from '../services/viajsService';
import '../styles/MapEditor.css';

interface MapEditorProps {
  onRoutesChange: (routes: ViajRuta[]) => void;
  initialRoutes?: ViajRuta[];
  initialCenter?: [number, number];
  title?: string;
}

// Fix para los iconos de Leaflet en Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const MapEditor: React.FC<MapEditorProps> = ({
  onRoutesChange,
  initialRoutes = [],
  initialCenter = [-25.2637, -57.5759], // Centro de Paraguay por defecto
  title = 'Editor de Ruta',
}) => {
  const [routes, setRoutes] = useState<ViajRuta[]>(initialRoutes);
  const [selectedPoint, setSelectedPoint] = useState<string | number | null>(null);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const mapRef = useRef(null);

  // Calcular distancia entre dos puntos (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Actualizar distancia total cuando cambien las rutas
  useEffect(() => {
    let total = 0;
    for (let i = 0; i < routes.length - 1; i++) {
      total += calculateDistance(
        routes[i].latitud,
        routes[i].longitud,
        routes[i + 1].latitud,
        routes[i + 1].longitud,
      );
    }
    setTotalDistance(total);
  }, [routes]);

  // Notificar al componente padre cuando cambien las rutas
  useEffect(() => {
    onRoutesChange(routes);
  }, [routes, onRoutesChange]);

  // Agregar punto de ruta al hacer clic en el mapa
  const handleMapClick = (e: any) => {
    if (mapRef.current) {
      const newPoint: ViajRuta = {
        id: Date.now(),
        orden: routes.length + 1,
        latitud: e.latlng.lat,
        longitud: e.latlng.lng,
      };
      setRoutes([...routes, newPoint]);
    }
  };

  // Eliminar un punto
  const deletePoint = (id: number | undefined) => {
    if (!id) return;
    const updated = routes
      .filter((r) => r.id !== id)
      .map((r, idx) => ({ ...r, orden: idx + 1 }));
    setRoutes(updated);
  };

  // Actualizar notas de un punto
  const updatePointNotes = (id: number | undefined, notas: string) => {
    if (!id) return;
    setRoutes(
      routes.map((r) => (r.id === id ? { ...r, notas } : r)),
    );
  };

  // Coordenadas para la polyline
  const polylineCoordinates = routes.map((r) => [r.latitud, r.longitud] as [number, number]);

  return (
    <div className="map-editor-container">
      <div className="map-header">
        <h3>{title}</h3>
        <div className="map-stats">
          <span className="stat-item">
            <strong>Puntos:</strong> {routes.length}
          </span>
          <span className="stat-item">
            <strong>Distancia Total:</strong> {totalDistance.toFixed(2)} km
          </span>
        </div>
      </div>

      <div className="map-wrapper" onClick={(e: React.MouseEvent) => {
        // Handle clicks on the map area that aren't on controls
        const target = e.target as HTMLElement;
        if (target.classList.contains('leaflet-container')) {
          handleMapClick(e as any);
        }
      }}>
        <MapContainer
          ref={mapRef}
          center={initialCenter as L.LatLngExpression}
          zoom={12}
          style={{ height: '500px', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          {/* Polyline conectando todos los puntos */}
          {polylineCoordinates.length > 1 && (
            <Polyline positions={polylineCoordinates} pathOptions={{color: 'blue', weight: 3, opacity: 0.7}} />
          )}

          {/* Marcadores para cada punto */}
          {routes.map((route, idx) => (
            <Marker
              key={route.id}
              position={[route.latitud, route.longitud]}
              icon={
                selectedPoint === route.id
                  ? L.icon({
                      iconUrl:
                        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
                      iconSize: [40, 41],
                      iconAnchor: [20, 41],
                      popupAnchor: [0, -41],
                    })
                  : L.icon({
                      iconUrl:
                        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
                      iconSize: [25, 41],
                      iconAnchor: [12, 41],
                      popupAnchor: [0, -41],
                    })
              }
            >
              <Popup>
                <div className="marker-popup">
                  <strong>Punto {route.orden}</strong>
                  {idx < routes.length - 1 && (
                    <p>
                      Distancia al siguiente:{' '}
                      {calculateDistance(
                        route.latitud,
                        route.longitud,
                        routes[idx + 1].latitud,
                        routes[idx + 1].longitud,
                      ).toFixed(2)}{' '}
                      km
                    </p>
                  )}
                  <p>Lat: {route.latitud.toFixed(4)}</p>
                  <p>Lon: {route.longitud.toFixed(4)}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Panel de puntos */}
      {routes.length > 0 && (
        <div className="routes-panel">
          <h4>Puntos de Ruta ({routes.length})</h4>
          <div className="routes-list">
            {routes.map((route, idx) => (
              <div
                key={route.id || idx}
                className={`route-item ${selectedPoint === route.id ? 'active' : ''}`}
                onClick={() => route.id && setSelectedPoint(route.id)}
              >
                <div className="route-item-header">
                  <span className="route-number">#{route.orden}</span>
                  <span className="route-coords">
                    {route.latitud.toFixed(4)}, {route.longitud.toFixed(4)}
                  </span>
                  {idx < routes.length - 1 && (
                    <span className="route-distance">
                      {calculateDistance(
                        route.latitud,
                        route.longitud,
                        routes[idx + 1].latitud,
                        routes[idx + 1].longitud,
                      ).toFixed(2)}{' '}
                      km
                    </span>
                  )}
                  <button className="btn-delete" onClick={() => deletePoint(route.id)}>
                    ✕
                  </button>
                </div>
                <textarea
                  placeholder="Notas para este punto..."
                  value={route.notas || ''}
                  onChange={(e) => updatePointNotes(route.id, e.target.value)}
                  className="route-notes"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {routes.length === 0 && (
        <div className="empty-state">
          <p>💡 Haz clic en el mapa para agregar puntos de ruta</p>
        </div>
      )}
    </div>
  );
};

export default MapEditor;
