import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:latlong2/latlong.dart';

/// Result of S2R (Sighting-to-Route) algorithm calculation
class S2RRouteResult {
  final List<LatLng> fullRoute; // [driver, ...roadPoints, sighting]
  final List<LatLng> roadSegment; // Points strictly on the road network
  final LatLng nearestRoadToSighting; // Point on the road closest to animal
  final LatLng nearestRoadToDriver; // Point on the road closest to driver
  final double distanceMeters;
  final double s2rScore; // Final Utility U_i
  final double sightingUtility; // S_i = AW_i * TD_i * R_i
  final double timeDecay; // TD_i
  final double animalWeight; // AW_i
  final int ageMinutes;
  final double maxLifespanMinutes;
  final String animalType;

  int get remainingMinutes => max(0, (maxLifespanMinutes - ageMinutes).toInt());

  S2RRouteResult({
    required this.fullRoute,
    required this.roadSegment,
    required this.nearestRoadToSighting,
    required this.nearestRoadToDriver,
    required this.distanceMeters,
    required this.s2rScore,
    required this.sightingUtility,
    required this.timeDecay,
    required this.animalWeight,
    required this.ageMinutes,
    required this.maxLifespanMinutes,
    required this.animalType,
  });
}

class S2RRoutingService {
  final List<LatLng> _nodes = [];
  final List<List<_Edge>> _adjacency = [];
  bool _isGraphBuilt = false;

  bool get isReady => _isGraphBuilt && _nodes.isNotEmpty;

  /// Build graph G = (V, E) from map.geojson features
  void buildGraphFromGeoJson(Map<String, dynamic> geoJsonData) {
    _nodes.clear();
    _adjacency.clear();

    final List<dynamic> features = geoJsonData['features'] ?? [];

    for (final feature in features) {
      final geometry = feature['geometry'];
      if (geometry == null) continue;
      final type = geometry['type'];
      final coords = geometry['coordinates'];

      if (type == 'LineString' && coords is List) {
        _processLineString(coords);
      } else if (type == 'MultiLineString' && coords is List) {
        for (final line in coords) {
          if (line is List) {
            _processLineString(line);
          }
        }
      }
    }

    _isGraphBuilt = true;
    debugPrint('S2RRoutingService: Initial nodes added: ${_nodes.length}');

    // Connect junctions between adjacent road lines (within 15 meters)
    for (int i = 0; i < _nodes.length; i++) {
      for (int j = i + 1; j < _nodes.length; j++) {
        final double d = distanceMeters(_nodes[i], _nodes[j]);
        if (d <= 15.0) {
          if (!_adjacency[i].any((edge) => edge.targetNode == j)) {
            _adjacency[i].add(_Edge(targetNode: j, weight: d));
            _adjacency[j].add(_Edge(targetNode: i, weight: d));
          }
        }
      }
    }

    // Ensure entire safari road network is 100% connected
    _ensureFullyConnected();

    debugPrint('S2RRoutingService: Fully connected road graph built with ${_nodes.length} nodes.');
  }

  void _ensureFullyConnected() {
    if (_nodes.isEmpty) return;

    List<List<int>> getComponents() {
      final List<bool> visited = List.filled(_nodes.length, false);
      final List<List<int>> comps = [];
      for (int i = 0; i < _nodes.length; i++) {
        if (!visited[i]) {
          final List<int> comp = [i];
          final List<int> queue = [i];
          visited[i] = true;
          while (queue.isNotEmpty) {
            final curr = queue.removeAt(0);
            for (final edge in _adjacency[curr]) {
              if (!visited[edge.targetNode]) {
                visited[edge.targetNode] = true;
                queue.add(edge.targetNode);
                comp.add(edge.targetNode);
              }
            }
          }
          comps.add(comp);
        }
      }
      return comps;
    }

    var comps = getComponents();
    while (comps.length > 1) {
      final main = comps[0];
      final other = comps[1];
      int bestU = -1;
      int bestV = -1;
      double minD = double.infinity;
      for (final u in main) {
        for (final v in other) {
          final d = distanceMeters(_nodes[u], _nodes[v]);
          if (d < minD) {
            minD = d;
            bestU = u;
            bestV = v;
          }
        }
      }
      if (bestU != -1 && bestV != -1) {
        _adjacency[bestU].add(_Edge(targetNode: bestV, weight: minD));
        _adjacency[bestV].add(_Edge(targetNode: bestU, weight: minD));
      }
      comps = getComponents();
    }
  }

  void _processLineString(List<dynamic> coords) {
    if (coords.length < 2) return;

    for (int i = 0; i < coords.length - 1; i++) {
      final c1 = coords[i];
      final c2 = coords[i + 1];
      if (c1 is List && c2 is List && c1.length >= 2 && c2.length >= 2) {
        final p1 = LatLng((c1[1] as num).toDouble(), (c1[0] as num).toDouble());
        final p2 = LatLng((c2[1] as num).toDouble(), (c2[0] as num).toDouble());

        final int u = _getOrAddNode(p1);
        final int v = _getOrAddNode(p2);

        if (u != v) {
          final double d = distanceMeters(p1, p2);
          _adjacency[u].add(_Edge(targetNode: v, weight: d));
          _adjacency[v].add(_Edge(targetNode: u, weight: d));
        }
      }
    }
  }

  int _getOrAddNode(LatLng p) {
    // Merge close duplicate vertices within 2 meters
    for (int i = 0; i < _nodes.length; i++) {
      if (distanceMeters(_nodes[i], p) <= 2.0) {
        return i;
      }
    }
    _nodes.add(p);
    _adjacency.add([]);
    return _nodes.length - 1;
  }

  /// S2R Animal Importance Weights (from S2R paper Section 2.5)
  static double getAnimalWeight(String animalType) {
    switch (animalType.toLowerCase().trim()) {
      case 'leopard':
        return 1.0;
      case 'bear':
      case 'sloth bear':
        return 0.8;
      case 'elephant':
        return 0.7;
      case 'deer':
      case 'spotted deer':
      case 'sambar':
        return 0.3;
      case 'peacock':
      case 'bird':
        return 0.2;
      default:
        return 0.25;
    }
  }

  /// Lifespan (in minutes) an animal sighting remains active on the map based on behavior
  static double getAnimalMaxLifespan(String animalType) {
    switch (animalType.toLowerCase().trim()) {
      case 'elephant':
        return 60.0; // Elephant stays in an area ~60 mins
      case 'leopard':
        return 30.0; // Leopard moves quickly ~30 mins
      case 'bear':
      case 'sloth bear':
        return 30.0; // Sloth Bear ~30 mins
      case 'peacock':
      case 'bird':
        return 20.0; // Peacock / Birds ~20 mins
      case 'deer':
      case 'spotted deer':
      case 'sambar':
        return 15.0; // Deer flees quickly ~15 mins
      default:
        return 15.0;
    }
  }

  /// Distance between two LatLng in meters using Haversine
  static double distanceMeters(LatLng p1, LatLng p2) {
    const double r = 6371000;
    final double dLat = (p2.latitude - p1.latitude) * (pi / 180);
    final double dLon = (p2.longitude - p1.longitude) * (pi / 180);
    final double a = sin(dLat / 2) * sin(dLat / 2) +
        cos(p1.latitude * (pi / 180)) * cos(p2.latitude * (pi / 180)) *
        sin(dLon / 2) * sin(dLon / 2);
    final double c = 2 * atan2(sqrt(a), sqrt(1 - a));
    return r * c;
  }

  /// Find index of node in graph closest to a given coordinate
  int findNearestNodeIndex(LatLng point) {
    if (_nodes.isEmpty) return -1;
    int bestIdx = 0;
    double bestDist = distanceMeters(_nodes[0], point);

    for (int i = 1; i < _nodes.length; i++) {
      final d = distanceMeters(_nodes[i], point);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  /// Find LatLng on graph closest to given point
  LatLng findNearestRoadPoint(LatLng point) {
    final idx = findNearestNodeIndex(point);
    if (idx != -1) return _nodes[idx];
    return point;
  }

  /// Run Dijkstra's algorithm to compute shortest path along the road network
  List<LatLng> _shortestPath(int startIndex, int targetIndex) {
    if (startIndex < 0 || targetIndex < 0 || startIndex >= _nodes.length || targetIndex >= _nodes.length) {
      return [];
    }

    if (startIndex == targetIndex) {
      return [_nodes[startIndex]];
    }

    final int n = _nodes.length;
    final List<double> dist = List.filled(n, double.infinity);
    final List<int> prev = List.filled(n, -1);
    final List<bool> visited = List.filled(n, false);

    dist[startIndex] = 0.0;

    for (int i = 0; i < n; i++) {
      int u = -1;
      for (int j = 0; j < n; j++) {
        if (!visited[j] && (u == -1 || dist[j] < dist[u])) {
          u = j;
        }
      }

      if (u == -1 || dist[u] == double.infinity) break;
      visited[u] = true;
      if (u == targetIndex) break;

      for (final edge in _adjacency[u]) {
        final double alt = dist[u] + edge.weight;
        if (alt < dist[edge.targetNode]) {
          dist[edge.targetNode] = alt;
          prev[edge.targetNode] = u;
        }
      }
    }

    if (prev[targetIndex] == -1 && startIndex != targetIndex) {
      // If unconnected component, return direct endpoints
      return [_nodes[startIndex], _nodes[targetIndex]];
    }

    final List<LatLng> path = [];
    int curr = targetIndex;
    while (curr != -1) {
      path.insert(0, _nodes[curr]);
      curr = prev[curr];
    }
    return path;
  }

  /// Calculate S2R (Sighting-to-Route) candidate path and score
  S2RRouteResult calculateRoute({
    required LatLng driverLocation,
    required LatLng sightingLocation,
    required String animalType,
    DateTime? sightingTime,
    double reliability = 0.90,
    double congestion = 0.10,
  }) {
    final now = DateTime.now();
    final time = sightingTime ?? now.subtract(const Duration(minutes: 10));
    final int ageMinutes = max(0, now.difference(time).inMinutes);

    // Step 1: Species-specific Time Decay TD_i = max(0, 1 - t_i / T_max(species))
    final double tMax = getAnimalMaxLifespan(animalType);
    final double timeDecay = max(0.0, 1.0 - (ageMinutes / tMax));

    // Step 2: Animal Weight AW_i and Sighting Utility S_i
    final double animalWeight = getAnimalWeight(animalType);
    final double sightingUtility = animalWeight * timeDecay * reliability;

    // Step 3: Find road access points and compute Shortest Path
    int startNodeIdx = findNearestNodeIndex(driverLocation);
    int targetNodeIdx = findNearestNodeIndex(sightingLocation);

    List<LatLng> roadPath = [];
    if (_isGraphBuilt && startNodeIdx != -1 && targetNodeIdx != -1) {
      roadPath = _shortestPath(startNodeIdx, targetNodeIdx);
    }

    if (roadPath.isEmpty) {
      roadPath = [
        findNearestRoadPoint(driverLocation),
        findNearestRoadPoint(sightingLocation),
      ];
    }

    final LatLng nearestRoadToDriver = roadPath.first;
    final LatLng nearestRoadToSighting = roadPath.last;

    // Build complete route: driver -> road entry -> path along roads -> nearest road to animal -> sighting
    final List<LatLng> fullRoute = [
      driverLocation,
      if (distanceMeters(driverLocation, nearestRoadToDriver) > 8) nearestRoadToDriver,
      ...roadPath,
      if (distanceMeters(nearestRoadToSighting, sightingLocation) > 8) sightingLocation,
    ];

    // Step 4: Calculate total route distance L(P_i)
    double totalDistance = 0.0;
    for (int i = 0; i < fullRoute.length - 1; i++) {
      totalDistance += distanceMeters(fullRoute[i], fullRoute[i + 1]);
    }

    // Normalized distance D_i = min(1, L(P_i) / D_max)
    const double dMax = 2500.0; // Reference maximum for local zone
    final double normalizedDistance = min(1.0, totalDistance / dMax);

    // Step 5: Route Congestion C_i (0 - 1)
    final double normalizedCongestion = congestion.clamp(0.0, 1.0);

    // Step 7: Overall Route Utility U_i = w_s * S_i - w_c * C_i - w_d * D_i
    // Recommended weights: w_s = 0.5, w_c = 0.3, w_d = 0.2
    const double ws = 0.5;
    const double wc = 0.3;
    const double wd = 0.2;

    final double rawScore = (ws * sightingUtility) - (wc * normalizedCongestion) - (wd * normalizedDistance);
    final double s2rScore = rawScore.clamp(0.0, 1.0);

    return S2RRouteResult(
      fullRoute: fullRoute,
      roadSegment: roadPath,
      nearestRoadToSighting: nearestRoadToSighting,
      nearestRoadToDriver: nearestRoadToDriver,
      distanceMeters: totalDistance,
      s2rScore: s2rScore,
      sightingUtility: sightingUtility,
      timeDecay: timeDecay,
      animalWeight: animalWeight,
      ageMinutes: ageMinutes,
      maxLifespanMinutes: tMax,
      animalType: animalType,
    );
  }
}

class _Edge {
  final int targetNode;
  final double weight;
  _Edge({required this.targetNode, required this.weight});
}
