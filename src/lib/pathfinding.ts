
// Smart Route Planner - Advanced Pathfinding Implementation
// Using Dijkstra's Algorithm with real-world coordinates

export interface Location {
  lat: number;
  lng: number;
  name: string;
  category?: string;
}

export interface GraphNode {
  id: string;
  lat: number;
  lng: number;
  name: string;
  category?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  weight: number;
  distance: number;
}

export interface RouteResult {
  path: GraphNode[];
  totalDistance: string;
  totalTime: string;
  algorithm: string;
  directions: Direction[];
}

export interface Direction {
  instruction: string;
  distance: number;
  direction: string;
}

class PriorityQueue<T> {
  private items: Array<{ element: T; priority: number }> = [];

  enqueue(element: T, priority: number): void {
    this.items.push({ element, priority });
    this.items.sort((a, b) => a.priority - b.priority);
  }

  dequeue(): T | undefined {
    return this.items.shift()?.element;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

// Haversine formula for calculating distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const dLon = toRadians(lon2 - lon1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  
  const directions = ['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

// Generate a realistic graph with intermediate points
function generateGraph(source: Location, destination: Location, routeType: 'shortest' | 'safest'): { nodes: GraphNode[], edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  
  // Add source and destination
  const sourceNode: GraphNode = { id: 'source', ...source };
  const destNode: GraphNode = { id: 'destination', ...destination };
  nodes.push(sourceNode, destNode);
  
  // Generate intermediate waypoints
  const distance = calculateDistance(source.lat, source.lng, destination.lat, destination.lng);
  const numWaypoints = Math.min(Math.max(Math.floor(distance / 100), 2), 8);
  
  // Create waypoints along the route
  for (let i = 1; i < numWaypoints; i++) {
    const ratio = i / numWaypoints;
    const lat = source.lat + (destination.lat - source.lat) * ratio;
    const lng = source.lng + (destination.lng - source.lng) * ratio;
    
    // Add some variation for realistic routing
    const variation = 0.01 * (Math.random() - 0.5);
    const waypoint: GraphNode = {
      id: `waypoint_${i}`,
      lat: lat + variation,
      lng: lng + variation,
      name: `Waypoint ${i}`,
      category: 'waypoint'
    };
    nodes.push(waypoint);
  }
  
  // Connect nodes with edges
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const node1 = nodes[i];
      const node2 = nodes[j];
      const dist = calculateDistance(node1.lat, node1.lng, node2.lat, node2.lng);
      
      // Weight calculation based on route type
      let weight = dist;
      if (routeType === 'safest') {
        // Apply safety factor (simulated)
        const safetyFactor = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
        weight = dist * (2 - safetyFactor); // Safer routes get lower weights
      }
      
      edges.push({
        from: node1.id,
        to: node2.id,
        weight,
        distance: dist
      });
    }
  }
  
  return { nodes, edges };
}

// Dijkstra's algorithm implementation
export function findShortestPath(source: Location, destination: Location, routeType: 'shortest' | 'safest'): RouteResult {
  const { nodes, edges } = generateGraph(source, destination, routeType);
  
  // Create adjacency list
  const graph: Map<string, Array<{ nodeId: string; weight: number; distance: number }>> = new Map();
  
  nodes.forEach(node => graph.set(node.id, []));
  
  edges.forEach(edge => {
    graph.get(edge.from)?.push({ nodeId: edge.to, weight: edge.weight, distance: edge.distance });
    graph.get(edge.to)?.push({ nodeId: edge.from, weight: edge.weight, distance: edge.distance });
  });
  
  // Dijkstra's algorithm
  const distances: Map<string, number> = new Map();
  const previous: Map<string, string | null> = new Map();
  const pq = new PriorityQueue<string>();
  
  // Initialize distances
  nodes.forEach(node => {
    distances.set(node.id, node.id === 'source' ? 0 : Infinity);
    previous.set(node.id, null);
  });
  
  pq.enqueue('source', 0);
  
  while (!pq.isEmpty()) {
    const currentNodeId = pq.dequeue();
    if (!currentNodeId) break;
    
    if (currentNodeId === 'destination') break;
    
    const neighbors = graph.get(currentNodeId) || [];
    
    for (const neighbor of neighbors) {
      const altDistance = (distances.get(currentNodeId) || 0) + neighbor.weight;
      
      if (altDistance < (distances.get(neighbor.nodeId) || Infinity)) {
        distances.set(neighbor.nodeId, altDistance);
        previous.set(neighbor.nodeId, currentNodeId);
        pq.enqueue(neighbor.nodeId, altDistance);
      }
    }
  }
  
  // Reconstruct path
  const path: GraphNode[] = [];
  let currentId: string | null = 'destination';
  
  while (currentId !== null) {
    const node = nodes.find(n => n.id === currentId);
    if (node) path.unshift(node);
    currentId = previous.get(currentId) || null;
  }
  
  // Calculate total distance and time
  let totalDistance = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const current = path[i];
    const next = path[i + 1];
    totalDistance += calculateDistance(current.lat, current.lng, next.lat, next.lng);
  }
  
  // Generate directions
  const directions: Direction[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const current = path[i];
    const next = path[i + 1];
    const distance = calculateDistance(current.lat, current.lng, next.lat, next.lng);
    const bearing = calculateBearing(current.lat, current.lng, next.lat, next.lng);
    
    let instruction = '';
    if (i === 0) {
      instruction = `Start your journey from ${current.name}`;
    } else if (i === path.length - 2) {
      instruction = `Arrive at ${next.name}`;
    } else {
      instruction = `Continue ${bearing.toLowerCase()} towards ${next.name}`;
    }
    
    directions.push({
      instruction,
      distance: Math.round(distance * 10) / 10,
      direction: bearing
    });
  }
  
  const totalTime = Math.round(totalDistance * 1.2); // Approximate time in minutes
  
  return {
    path,
    totalDistance: `${Math.round(totalDistance * 10) / 10} km`,
    totalTime: `${totalTime} min`,
    algorithm: "Dijkstra's",
    directions
  };
}

// Search locations using OpenStreetMap Nominatim API
export async function searchLocations(query: string): Promise<Location[]> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1`
    );
    
    if (!response.ok) {
      throw new Error('Search failed');
    }
    
    const data = await response.json();
    
    return data.map((item: any) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      name: item.display_name,
      category: item.type || 'location'
    }));
  } catch (error) {
    console.error('Search error:', error);
    
    // Fallback to sample locations if API fails
    const sampleLocations = [
      { lat: 40.7128, lng: -74.0060, name: "New York City, USA", category: "city" },
      { lat: 51.5074, lng: -0.1278, name: "London, UK", category: "city" },
      { lat: 35.6762, lng: 139.6503, name: "Tokyo, Japan", category: "city" },
      { lat: 48.8566, lng: 2.3522, name: "Paris, France", category: "city" },
      { lat: -33.8688, lng: 151.2093, name: "Sydney, Australia", category: "city" }
    ].filter(location => 
      location.name.toLowerCase().includes(query.toLowerCase())
    );
    
    return sampleLocations;
  }
}

// Search nearby places (restaurants, hotels, etc.)
export async function searchNearbyPlaces(location: Location, type: string): Promise<Location[]> {
  try {
    // This would typically use Overpass API or similar for real POI data
    // For demo purposes, generating sample nearby places
    const placeTypes = {
      restaurant: ['Pizza Palace', 'Burger Haven', 'Sushi Express', 'Coffee Corner'],
      hotel: ['Grand Hotel', 'Budget Inn', 'Luxury Resort', 'Business Lodge'],
      police: ['Police Station Central', 'Security Post', 'Emergency Services'],
      train: ['Central Station', 'Metro Hub', 'Railway Terminal'],
      airport: ['International Airport', 'Regional Airfield', 'Heliport'],
      all: ['Shopping Mall', 'Bank', 'Hospital', 'School', 'Park']
    };
    
    const names = placeTypes[type as keyof typeof placeTypes] || placeTypes.all;
    
    return names.map((name, index) => ({
      lat: location.lat + (Math.random() - 0.5) * 0.02,
      lng: location.lng + (Math.random() - 0.5) * 0.02,
      name: `${name} Near ${location.name.split(',')[0]}`,
      category: type === 'all' ? 'place' : type
    }));
  } catch (error) {
    console.error('Nearby search error:', error);
    return [];
  }
}
