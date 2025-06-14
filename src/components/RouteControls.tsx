
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Navigation, Search, Clock, Route, Zap } from 'lucide-react';
import { Location, RouteResult, searchLocations } from '@/lib/pathfinding';
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
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
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

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Location Search
          </CardTitle>
          <CardDescription>
            Search for cities, countries, districts, villages, and landmarks worldwide
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Input
              placeholder="Search for locations (e.g., New York, London, Tokyo)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
            <Search className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
          </div>

          {isSearching && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              Searching locations...
            </div>
          )}

          {showResults && searchResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Search Results:</p>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {searchResults.map((location, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-2">
                    <p className="text-sm font-medium line-clamp-2">{location.name}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSearchResultClick(location, 'source')}
                        className="flex-1"
                      >
                        Set as Source
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSearchResultClick(location, 'destination')}
                        className="flex-1"
                      >
                        Set as Destination
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showResults && searchResults.length === 0 && !isSearching && (
            <p className="text-sm text-muted-foreground">No locations found. Try a different search term.</p>
          )}
        </CardContent>
      </Card>

      {/* Location Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Locations
          </CardTitle>
          <CardDescription>
            Select your source and destination points
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Button
                variant={selectionMode === 'source' ? 'default' : 'outline'}
                onClick={() => onSelectionModeChange(selectionMode === 'source' ? null : 'source')}
                className="w-full justify-start"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Select Source
              </Button>
              {source && (
                <div className="text-xs p-2 bg-muted rounded border-l-4 border-l-green-500">
                  <p className="font-medium text-green-600">Source Location</p>
                  <p className="truncate">{source.name}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Button
                variant={selectionMode === 'destination' ? 'default' : 'outline'}
                onClick={() => onSelectionModeChange(selectionMode === 'destination' ? null : 'destination')}
                className="w-full justify-start"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Select Destination
              </Button>
              {destination && (
                <div className="text-xs p-2 bg-muted rounded border-l-4 border-l-red-500">
                  <p className="font-medium text-red-600">Destination Location</p>
                  <p className="truncate">{destination.name}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Route Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            Route Options
          </CardTitle>
          <CardDescription>
            Choose your preferred route calculation method
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={routeType === 'shortest' ? 'default' : 'outline'}
              onClick={() => onRouteTypeChange('shortest')}
              className="justify-start"
            >
              <Zap className="h-4 w-4 mr-2" />
              Shortest
            </Button>
            <Button
              variant={routeType === 'safest' ? 'default' : 'outline'}
              onClick={() => onRouteTypeChange('safest')}
              className="justify-start"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Safest
            </Button>
          </div>

          <Button
            onClick={onCalculateRoute}
            disabled={!canCalculateRoute}
            className="w-full"
            size="lg"
          >
            {isCalculating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Calculating Route...
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4 mr-2" />
                Calculate Route
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Route Information */}
      {route && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              Route Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{route.totalDistance} km</p>
                <p className="text-xs text-muted-foreground">Distance</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{route.totalTime} min</p>
                <p className="text-xs text-muted-foreground">Est. Time</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{route.path.length}</p>
                <p className="text-xs text-muted-foreground">Waypoints</p>
              </div>
            </div>

            <Separator />

            <div>
              <Badge variant="secondary" className="mb-2">
                {route.algorithm}
              </Badge>
            </div>

            {/* Turn-by-turn directions */}
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Turn-by-Turn Directions
              </h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {route.directions.map((direction, index) => (
                  <div key={index} className="flex items-start gap-3 p-2 rounded border">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{direction.instruction}</p>
                      {direction.distance > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {direction.distance} km • {direction.direction}
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
