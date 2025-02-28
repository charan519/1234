/**
 * Route Service
 * Provides functions to calculate routes between multiple points
 */

import * as turf from '@turf/turf';

/**
 * Calculates a route between multiple points
 * @param points Array of points with lat/lon coordinates
 * @param transportMode Transport mode (driving-car, cycling-regular, foot-walking)
 * @returns Route object with coordinates, duration, distance, and steps
 */
export async function calculateRoute(points: any[], transportMode: string = 'driving-car') {
  if (points.length < 2) {
    throw new Error('At least two points are required to calculate a route');
  }

  try {
    // In a real app, we would call a routing API like OpenRouteService
    // For now, we'll simulate a route
    return simulateRoute(points, transportMode);
  } catch (error) {
    console.error('Error calculating route:', error);
    throw error;
  }
}

/**
 * Simulates a route between multiple points
 * @param points Array of points with lat/lon coordinates
 * @param transportMode Transport mode (driving-car, cycling-regular, foot-walking)
 * @returns Simulated route object
 */
function simulateRoute(points: any[], transportMode: string) {
  const coordinates: [number, number][] = [];
  const steps: any[] = [];
  let totalDistance = 0;
  let totalDuration = 0;

  // Generate route segments between each point
  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i];
    const to = points[i + 1];
    
    // Create a straight line between points
    const fromCoord: [number, number] = [from.location.lon, from.location.lat];
    const toCoord: [number, number] = [to.location.lon, to.location.lat];
    
    // Calculate distance in kilometers
    const distance = calculateDistance(
      from.location.lat, from.location.lon,
      to.location.lat, to.location.lon
    );
    
    // Estimate duration based on transport mode (minutes)
    let speed = 40; // km/h for driving
    if (transportMode === 'cycling-regular') speed = 15;
    if (transportMode === 'foot-walking') speed = 5;
    
    const duration = (distance / speed) * 60; // Convert to minutes
    
    totalDistance += distance;
    totalDuration += duration;
    
    // Generate some intermediate points for a more realistic route
    const line = turf.lineString([fromCoord, toCoord]);
    const lineDistance = turf.length(line, {units: 'kilometers'});
    const numSteps = Math.max(5, Math.floor(lineDistance / 0.5)); // One point every 500m
    
    const segmentCoordinates: [number, number][] = [];
    for (let j = 0; j <= numSteps; j++) {
      const segment = j / numSteps;
      const point = turf.along(line, lineDistance * segment, {units: 'kilometers'});
      segmentCoordinates.push(point.geometry.coordinates as [number, number]);
    }
    
    // Add all coordinates to the route
    if (i === 0) {
      coordinates.push(...segmentCoordinates);
    } else {
      // Skip the first point as it's the same as the last point of the previous segment
      coordinates.push(...segmentCoordinates.slice(1));
    }
    
    // Add step information
    steps.push({
      instruction: `Head to ${to.name}`,
      distance: Math.round(distance * 1000), // Convert to meters
      duration: Math.round(duration),
      startLocation: [from.location.lat, from.location.lon],
      endLocation: [to.location.lat, to.location.lon],
      fromPlace: from.name,
      toPlace: to.name
    });
  }
  
  return {
    distance: parseFloat(totalDistance.toFixed(1)),
    duration: Math.round(totalDuration),
    steps,
    coordinates
  };
}

/**
 * Calculates the distance between two points in kilometers
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Optimizes the order of waypoints to minimize total distance
 * Uses a simple greedy algorithm (nearest neighbor)
 * @param startPoint Starting point coordinates
 * @param waypoints Array of waypoints to visit
 * @returns Optimized array of waypoints
 */
export function optimizeWaypoints(startPoint: {lat: number, lon: number}, waypoints: any[]) {
  if (waypoints.length <= 1) return [...waypoints];
  
  let remainingPoints = [...waypoints];
  const orderedPoints = [];
  let currentPoint = startPoint;
  
  while (remainingPoints.length > 0) {
    // Find closest point to current point
    let closestIdx = 0;
    let closestDistance = calculateDistance(
      currentPoint.lat, currentPoint.lon, 
      remainingPoints[0].location.lat, remainingPoints[0].location.lon
    );
    
    for (let i = 1; i < remainingPoints.length; i++) {
      const distance = calculateDistance(
        currentPoint.lat, currentPoint.lon,
        remainingPoints[i].location.lat, remainingPoints[i].location.lon
      );
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIdx = i;
      }
    }
    
    // Add closest point to ordered list
    const nextPoint = remainingPoints[closestIdx];
    orderedPoints.push(nextPoint);
    currentPoint = { lat: nextPoint.location.lat, lon: nextPoint.location.lon };
    remainingPoints = remainingPoints.filter((_, idx) => idx !== closestIdx);
  }
  
  return orderedPoints;
}

/**
 * Formats a distance in meters to a human-readable string
 * @param meters Distance in meters
 * @returns Formatted distance string
 */
export function formatDistance(meters: number) {
  return meters >= 1000 
    ? `${(meters / 1000).toFixed(1)} km`
    : `${Math.round(meters)} m`;
}

/**
 * Formats a duration in minutes to a human-readable string
 * @param minutes Duration in minutes
 * @returns Formatted duration string
 */
export function formatDuration(minutes: number) {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours} h ${mins} min`;
  }
}