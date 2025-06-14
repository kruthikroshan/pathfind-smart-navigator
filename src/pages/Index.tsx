
import React, { useState } from 'react';
import RouteMap from '@/components/RouteMap';
import RouteControls from '@/components/RouteControls';
import { Location, RouteResult, findShortestPath } from '@/lib/pathfinding';
import { useToast } from '@/hooks/use-toast';

export default function Index() {
  const [source, setSource] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routeType, setRouteType] = useState<'shortest' | 'safest'>('shortest');
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'source' | 'destination' | null>(null);
  const { toast } = useToast();

  const handleLocationSelect = (location: Location, type: 'source' | 'destination') => {
    if (type === 'source') {
      setSource(location);
      toast({
        title: "Source Location Set",
        description: location.name || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`,
      });
    } else {
      setDestination(location);
      toast({
        title: "Destination Location Set",
        description: location.name || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`,
      });
    }
    setSelectionMode(null);
  };

  const handleCalculateRoute = async () => {
    if (!source || !destination) {
      toast({
        title: "Missing Locations",
        description: "Please select both source and destination locations.",
        variant: "destructive"
      });
      return;
    }

    setIsCalculating(true);
    
    try {
      // Add a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const result = findShortestPath(source, destination, routeType);
      setRoute(result);
      
      toast({
        title: "Route Calculated",
        description: `${routeType === 'shortest' ? 'Shortest' : 'Safest'} route found: ${result.totalDistance} km, ${result.totalTime} minutes`,
      });
    } catch (error) {
      console.error('Route calculation error:', error);
      toast({
        title: "Route Calculation Failed",
        description: "Unable to calculate route. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleMapCenter = (location: Location) => {
    console.log('Centering map on:', location);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Smart Route Planner</h1>
              <p className="text-gray-600 mt-1">Navigate the world with intelligent pathfinding algorithms</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                Dijkstra's Algorithm
              </div>
              <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Global Coverage
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-200px)]">
          {/* Controls Panel */}
          <div className="lg:col-span-1 overflow-y-auto">
            <RouteControls
              source={source}
              destination={destination}
              route={route}
              isCalculating={isCalculating}
              routeType={routeType}
              selectionMode={selectionMode}
              onSourceSelect={setSource}
              onDestinationSelect={setDestination}
              onCalculateRoute={handleCalculateRoute}
              onRouteTypeChange={setRouteType}
              onSelectionModeChange={setSelectionMode}
            />
          </div>

          {/* Map Panel */}
          <div className="lg:col-span-2">
            <div className="h-full bg-white rounded-lg shadow-lg overflow-hidden">
              <RouteMap
                source={source}
                destination={destination}
                route={route}
                selectionMode={selectionMode}
                onLocationSelect={handleLocationSelect}
                onMapCenter={handleMapCenter}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600">
            <p className="text-sm">
              Powered by advanced graph algorithms • Real-time pathfinding • Global coverage
            </p>
            <p className="text-xs mt-2">
              Using Dijkstra's algorithm for optimal route calculation with OpenStreetMap data
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
