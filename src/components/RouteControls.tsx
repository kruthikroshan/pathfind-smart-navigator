
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Navigation, Search, Clock, Route, Zap, Hotel, TrainFront, Airport, Restaurant, Police } from 'lucide-react';
import { Location, RouteResult, searchLocations, searchNearbyPlaces } from '@/lib/pathfinding';
import { useToast } from '@/hooks/use-toast';

interface RouteControlsProps {
  source: Location | null;
  destination: Location | null;
  route: RouteResult | null;
  isCalculating: boolean;
  routeType: 'shortest' | 'safest';
  onSourceSelect: (location: Location) => void;
  onDestinationSelect: (location: Location) => void;
  onCalculateRoute: () => void;
  onRouteTypeChange: (type: 'shortest' | 'safest') => void;
  onSelectionModeChange: (mode: 'source' | 'destination' | null) => void;
  selectionMode: 'source' | 'destination' | null;
}

export default function RouteControls({
  source,
  destination,
  route,
  isCalculating,
  routeType,
  onSourceSelect,
  onDestinationSelect,
  onCalculateRoute,
  onRouteTypeChange,
  onSelectionModeChange,
  selectionMode
}: RouteControlsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const { toast } = useToast();

  // Search locations
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.trim().length > 2) {
        setIsSearching(true);
        try {
          const results = await searchLocations(searchQuery);
          setSearchResults(results);
          setShowResults(true);
        } catch (error) {
          toast({
            title: "Search Error",
            description: "Failed to search locations. Please try again.",
            variant: "destructive"
          });
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 500);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery, toast]);

  // Search nearby places when locations are set
  useEffect(() => {
    const searchNearby = async () => {
      if (source || destination) {
        const location = destination || source;
        if (location) {
          try {
            const places = await searchNearbyPlaces(location, activeFilter);
            setNearbyPlaces(places);
          } catch (error) {
            console.error('Failed to search nearby places:', error);
          }
        }
      }
    };

    searchNearby();
  }, [source, destination, activeFilter]);

  const handleSearchResultClick = (location: Location, type: 'source' | 'destination') => {
    if (type === 'source') {
      onSourceSelect(location);
    } else {
      onDestinationSelect(location);
    }
    setShowResults(false);
    setSearchQuery('');
    onSelectionModeChange(null);
    
    toast({
      title: `${type === 'source' ? 'Source' : 'Destination'} Selected`,
      description: location.name,
    });
  };

  const canCalculateRoute = source && destination && !isCalculating;

  const placeFilters = [
    { id: 'all', label: 'All Places', icon: MapPin },
    { id: 'restaurant', label: 'Restaurants', icon: Restaurant },
    { id: 'hotel', label: 'Hotels', icon: Hotel },
    { id: 'police', label: 'Police', icon: Police },
    { id: 'train', label: 'Train Stations', icon: TrainFront },
    { id: 'airport', label: 'Airports', icon: Airport },
  ];

  return (
    <div className="space-y-6">
      {/* Enhanced Search Section */}
      <Card className="border-2 border-blue-100">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50">
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Search className="h-5 w-5" />
            Global Location Search
          </CardTitle>
          <CardDescription className="text-blue-600">
            Search cities, countries, districts, villages, and landmarks worldwide
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="relative">
            <Input
              placeholder="Search for any location worldwide..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-12 h-12 text-lg border-2 border-blue-200 focus:border-blue-400"
            />
            <Button 
              size="sm" 
              className="absolute right-1 top-1 bg-blue-500 hover:bg-blue-600"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
            🌍 Search for any location worldwide • Click map to select coordinates
          </div>

          {isSearching && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              Searching locations...
            </div>
          )}

          {showResults && searchResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Search Results:</p>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {searchResults.map((location, index) => (
                  <div key={index} className="border-2 border-gray-100 rounded-xl p-4 hover:border-blue-300 transition-colors">
                    <p className="text-sm font-medium line-clamp-2 mb-2">{location.name}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSearchResultClick(location, 'source')}
                        className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                      >
                        Set as Source
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSearchResultClick(location, 'destination')}
                        className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Set as Destination
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location Selection */}
      <Card className="border-2 border-green-100">
        <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
          <CardTitle className="flex items-center gap-2 text-green-700">
            <MapPin className="h-5 w-5" />
            Source & Destination
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Button
                variant={selectionMode === 'source' ? 'default' : 'outline'}
                onClick={() => onSelectionModeChange(selectionMode === 'source' ? null : 'source')}
                className="w-full justify-start h-12 text-left"
              >
                <MapPin className="h-4 w-4 mr-2 text-green-500" />
                Select Source Location
              </Button>
              {source && (
                <div className="text-xs p-3 bg-green-50 rounded-lg border-l-4 border-l-green-500">
                  <p className="font-medium text-green-700">📍 Source Location</p>
                  <p className="text-green-600 font-medium">{source.name}</p>
                  <p className="text-green-500 text-xs">{source.lat.toFixed(4)}, {source.lng.toFixed(4)}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Button
                variant={selectionMode === 'destination' ? 'default' : 'outline'}
                onClick={() => onSelectionModeChange(selectionMode === 'destination' ? null : 'destination')}
                className="w-full justify-start h-12 text-left"
              >
                <Navigation className="h-4 w-4 mr-2 text-red-500" />
                Select Destination Location
              </Button>
              {destination && (
                <div className="text-xs p-3 bg-red-50 rounded-lg border-l-4 border-l-red-500">
                  <p className="font-medium text-red-700">🎯 Destination Location</p>
                  <p className="text-red-600 font-medium">{destination.name}</p>
                  <p className="text-red-500 text-xs">{destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Algorithm Selection */}
      <Card className="border-2 border-purple-100">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <Route className="h-5 w-5" />
            Algorithm Type
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={routeType === 'shortest' ? 'default' : 'outline'}
              onClick={() => onRouteTypeChange('shortest')}
              className="h-16 flex-col space-y-1"
            >
              <Zap className="h-5 w-5" />
              <div className="text-center">
                <div className="font-medium">Shortest</div>
                <div className="text-xs opacity-75">Distance</div>
              </div>
            </Button>
            <Button
              variant={routeType === 'safest' ? 'default' : 'outline'}
              onClick={() => onRouteTypeChange('safest')}
              className="h-16 flex-col space-y-1"
            >
              <MapPin className="h-5 w-5" />
              <div className="text-center">
                <div className="font-medium">Safest</div>
                <div className="text-xs opacity-75">Security</div>
              </div>
            </Button>
          </div>

          <Button
            onClick={onCalculateRoute}
            disabled={!canCalculateRoute}
            className="w-full h-14 text-lg bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
            size="lg"
          >
            {isCalculating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Calculating Route...
              </>
            ) : (
              <>
                <Navigation className="h-5 w-5 mr-2" />
                Find Optimal Route
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Nearby Places */}
      {(source || destination) && (
        <Card className="border-2 border-orange-100">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50">
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <MapPin className="h-5 w-5" />
              Nearby Places
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-wrap gap-2">
              {placeFilters.map((filter) => {
                const IconComponent = filter.icon;
                return (
                  <Button
                    key={filter.id}
                    variant={activeFilter === filter.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveFilter(filter.id)}
                    className="text-xs"
                  >
                    <IconComponent className="h-3 w-3 mr-1" />
                    {filter.label}
                  </Button>
                );
              })}
            </div>

            {nearbyPlaces.length > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-2">
                {nearbyPlaces.slice(0, 5).map((place, index) => (
                  <div key={index} className="text-xs p-2 bg-orange-50 rounded border">
                    <p className="font-medium text-orange-800">{place.name}</p>
                    <p className="text-orange-600">{place.category || 'Location'}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Enhanced Route Information */}
      {route && (
        <Card className="border-2 border-blue-100">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50">
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Route className="h-5 w-5" />
              Route Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-blue-50 p-4 rounded-xl">
                <p className="text-2xl font-bold text-blue-600">{route.totalDistance}</p>
                <p className="text-xs text-blue-500 font-medium">Kilometers</p>
              </div>
              <div className="bg-green-50 p-4 rounded-xl">
                <p className="text-2xl font-bold text-green-600">{route.totalTime}</p>
                <p className="text-xs text-green-500 font-medium">Minutes</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-xl">
                <p className="text-2xl font-bold text-purple-600">{route.path.length}</p>
                <p className="text-xs text-purple-500 font-medium">Waypoints</p>
              </div>
            </div>

            <Separator />

            <div>
              <Badge variant="secondary" className="mb-2 bg-blue-100 text-blue-700">
                {route.algorithm} Algorithm
              </Badge>
            </div>

            {/* Enhanced Turn-by-turn directions */}
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2 text-gray-700">
                <Clock className="h-4 w-4" />
                Turn-by-Turn Directions
              </h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {route.directions.map((direction, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-xl border bg-gray-50">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{direction.instruction}</p>
                      {direction.distance > 0 && (
                        <p className="text-xs text-gray-600 mt-1">
                          📏 {direction.distance} km • 🧭 {direction.direction}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
