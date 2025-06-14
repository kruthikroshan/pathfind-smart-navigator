
export interface Location {
  lat: number;
  lng: number;
  name?: string;
}

export interface RouteNode {
  id: string;
  lat: number;
  lng: number;
  name: string;
}

export interface RouteEdge {
  from: string;
  to: string;
  distance: number;
  safetyWeight: number;
}

export interface RouteResult {
  path: RouteNode[];
  totalDistance: number;
  totalTime: number;
  directions: RouteDirection[];
  algorithm: string;
}

export interface RouteDirection {
  instruction: string;
  distance: number;
  direction: string;
  maneuver: string;
}

// Calculate distance between two points using Haversine formula
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Generate intermediate waypoints for route visualization
export function generateRouteWaypoints(source: Location, destination: Location): RouteNode[] {
  const waypoints: RouteNode[] = [];
  const numWaypoints = Math.max(3, Math.floor(calculateDistance(source.lat, source.lng, destination.lat, destination.lng) / 50));
  
  // Add source
  waypoints.push({
    id: 'source',
    lat: source.lat,
    lng: source.lng,
    name: source.name || 'Source'
  });

  // Generate intermediate waypoints
  for (let i = 1; i < numWaypoints; i++) {
    const ratio = i / numWaypoints;
    const lat = source.lat + (destination.lat - source.lat) * ratio;
    const lng = source.lng + (destination.lng - source.lng) * ratio;
    
    waypoints.push({
      id: `waypoint-${i}`,
      lat,
      lng,
      name: `Waypoint ${i}`
    });
  }

  // Add destination  
  waypoints.push({
    id: 'destination',
    lat: destination.lat,
    lng: destination.lng,
    name: destination.name || 'Destination'
  });

  return waypoints;
}

// Dijkstra's algorithm implementation
export function findShortestPath(source: Location, destination: Location, routeType: 'shortest' | 'safest'): RouteResult {
  console.log(`Finding ${routeType} path from`, source, 'to', destination);
  
  // Generate route waypoints
  const waypoints = generateRouteWaypoints(source, destination);
  
  // Create graph with edges
  const edges: RouteEdge[] = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i];
    const to = waypoints[i + 1];
    const distance = calculateDistance(from.lat, from.lng, to.lat, to.lng);
    const safetyWeight = routeType === 'safest' ? Math.random() * 0.5 + 0.75 : 1.0;
    
    edges.push({
      from: from.id,
      to: to.id,
      distance,
      safetyWeight
    });
  }

  // Run Dijkstra's algorithm
  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const visited = new Set<string>();
  const queue = [...waypoints];

  // Initialize distances
  waypoints.forEach(node => {
    distances.set(node.id, node.id === 'source' ? 0 : Infinity);
    previous.set(node.id, null);
  });

  while (queue.length > 0) {
    // Find unvisited node with minimum distance
    let current = queue.reduce((min, node) => 
      !visited.has(node.id) && distances.get(node.id)! < distances.get(min.id)! ? node : min
    );

    if (distances.get(current.id) === Infinity) break;

    visited.add(current.id);
    queue.splice(queue.indexOf(current), 1);

    // Update distances to neighbors
    const currentEdges = edges.filter(edge => edge.from === current.id);
    currentEdges.forEach(edge => {
      if (!visited.has(edge.to)) {
        const weight = routeType === 'shortest' ? edge.distance : edge.distance * edge.safetyWeight;
        const newDistance = distances.get(current.id)! + weight;
        
        if (newDistance < distances.get(edge.to)!) {
          distances.set(edge.to, newDistance);
          previous.set(edge.to, current.id);
        }
      }
    });
  }

  // Reconstruct path
  const path: RouteNode[] = [];
  let currentId: string | null = 'destination';
  
  while (currentId) {
    const node = waypoints.find(w => w.id === currentId)!;
    path.unshift(node);
    currentId = previous.get(currentId) || null;
  }

  // Calculate total metrics
  const totalDistance = path.reduce((sum, node, index) => {
    if (index === 0) return 0;
    const prev = path[index - 1];
    return sum + calculateDistance(prev.lat, prev.lng, node.lat, node.lng);
  }, 0);

  const averageSpeed = 60; // km/h
  const totalTime = totalDistance / averageSpeed * 60; // minutes

  // Generate turn-by-turn directions
  const directions = generateDirections(path);

  return {
    path,
    totalDistance: Math.round(totalDistance * 100) / 100,
    totalTime: Math.round(totalTime),
    directions,
    algorithm: routeType === 'shortest' ? 'Dijkstra (Distance)' : 'Dijkstra (Safety-Weighted)'
  };
}

// Generate turn-by-turn directions
function generateDirections(path: RouteNode[]): RouteDirection[] {
  const directions: RouteDirection[] = [];
  
  if (path.length < 2) return directions;

  // Start direction
  directions.push({
    instruction: `Start at ${path[0].name}`,
    distance: 0,
    direction: 'start',
    maneuver: 'depart'
  });

  // Intermediate directions
  for (let i = 1; i < path.length - 1; i++) {
    const prev = path[i - 1];
    const current = path[i];
    const next = path[i + 1];
    
    const distance = calculateDistance(prev.lat, prev.lng, current.lat, current.lng);
    const bearing = calculateBearing(current, next);
    const direction = bearingToDirection(bearing);
    
    directions.push({
      instruction: `Continue ${direction.toLowerCase()} for ${distance.toFixed(1)} km`,
      distance: Math.round(distance * 100) / 100,
      direction: direction,
      maneuver: 'continue'
    });
  }

  // Final direction
  const lastDistance = calculateDistance(
    path[path.length - 2].lat, 
    path[path.length - 2].lng, 
    path[path.length - 1].lat, 
    path[path.length - 1].lng
  );
  
  directions.push({
    instruction: `Arrive at ${path[path.length - 1].name}`,
    distance: Math.round(lastDistance * 100) / 100,
    direction: 'arrive',
    maneuver: 'arrive'
  });

  return directions;
}

// Calculate bearing between two points
function calculateBearing(from: RouteNode, to: RouteNode): number {
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  
  let bearing = Math.atan2(y, x);
  bearing = (bearing * 180 / Math.PI + 360) % 360;
  
  return bearing;
}

// Convert bearing to direction
function bearingToDirection(bearing: number): string {
  const directions = ['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

// Search for locations using Nominatim API
export async function searchLocations(query: string): Promise<Location[]> {
  if (!query.trim()) return [];
  
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1`
    );
    
    if (!response.ok) throw new Error('Search failed');
    
    const data = await response.json();
    
    return data.map((item: any) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      name: item.display_name
    }));
  } catch (error) {
    console.error('Location search error:', error);
    return [];
  }
}
