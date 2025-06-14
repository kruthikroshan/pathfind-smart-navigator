
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-green-500 p-3 rounded-2xl">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                Smart Route Planner
              </h1>
            </div>
            
            <p className="text-lg text-gray-600 max-w-2xl">
              Advanced pathfinding using Dijkstra's algorithm • Find the optimal route between any two locations worldwide
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-blue-700 font-medium">Global Search</span>
              </div>
              <div className="flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-700 font-medium">Graph Algorithms</span>
              </div>
              <div className="flex items-center space-x-2 bg-purple-50 px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-purple-700 font-medium">Real-time Calculation</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-280px)]">
          {/* Enhanced Controls Panel */}
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

          {/* Enhanced Map Panel */}
          <div className="lg:col-span-3">
            <div className="h-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200/50">
              <div className="bg-gradient-to-r from-blue-500 to-green-500 p-4">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <span className="font-semibold">Interactive World Map</span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    {source && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-300 rounded-full"></div>
                        <span>Source: {source.name}</span>
                      </div>
                    )}
                    {destination && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-red-300 rounded-full"></div>
                        <span>Destination: {destination.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="h-[calc(100%-80px)]">
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
        </div>
      </main>
    </div>
  );
}
