import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;

import 'package:flutter_map/flutter_map.dart';

import 'package:latlong2/latlong.dart';

import 'package:geolocator/geolocator.dart';

import '../services/api_service.dart';
import '../services/s2r_routing_service.dart';
import '../services/offline_storage_service.dart';

import '../widgets/theme_constants.dart';

class SafariMapScreen extends StatefulWidget {
  const SafariMapScreen({super.key});

  @override
  State<SafariMapScreen> createState() => _SafariMapScreenState();
}

class _SafariMapScreenState extends State<SafariMapScreen> with SingleTickerProviderStateMixin {

  static const LatLng _defaultLocation = LatLng(6.540324565195912, 81.30531824100515);

  LatLng? _currentLocation = _defaultLocation;

  final MapController _mapController = MapController();

  bool _isOutOfZoneAlertSent = false;

  bool _isMapReady = false;

  List<dynamic> _recentSightings = [];

  Timer? _sightingsTimer;

  bool _isSatelliteView = true;
  List<Polyline>? _roadPolylines;

  Map<String, dynamic>? _selectedSighting;
  final S2RRoutingService _s2rService = S2RRoutingService();
  S2RRouteResult? _activeS2RRoute;

  bool _isPickingLocation = false;
  LatLng? _selectedLogLocation;

  int _pendingOfflineCount = 0;

  AnimationController? _pulseController;
  Animation<double>? _pulseAnimation;

  @override
  void initState() {
    super.initState();

    _initPulseAnimation();

    _loadRoadsFromGeoJson();

    _startLiveTracking();

    _fetchSightings();

    _sightingsTimer = Timer.periodic(const Duration(seconds: 15), (timer) {
      _fetchSightings();
    });
  }

  void _initPulseAnimation() {
    if (_pulseController == null) {
      _pulseController = AnimationController(
        vsync: this,
        duration: const Duration(seconds: 2),
      )..repeat(reverse: true);

      _pulseAnimation = Tween<double>(begin: 0.85, end: 1.25).animate(
        CurvedAnimation(parent: _pulseController!, curve: Curves.easeInOut),
      );
    }
  }

  @override
  void dispose() {
    _sightingsTimer?.cancel();
    _pulseController?.dispose();
    _mapController.dispose();
    super.dispose();
  }

  Future<void> _checkPendingOfflineCount() async {
    final offline = await OfflineStorageService.getOfflineSightings();
    final emergencies = await OfflineStorageService.getOfflineEmergencyAlerts();
    if (mounted) {
      setState(() {
        _pendingOfflineCount = offline.length + emergencies.length;
      });
    }
  }

  Future<void> _manualSyncOfflineData() async {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Row(
          children: [
            SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
            ),
            SizedBox(width: 12),
            Text('Syncing offline data with cloud...'),
          ],
        ),
        duration: Duration(seconds: 1),
      ),
    );

    final res = await OfflineStorageService.syncPendingData();
    final synced = (res['syncedSightings'] ?? 0) + (res['syncedEmergencies'] ?? 0);
    await _fetchSightings();

    if (mounted) {
      if (synced > 0) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✅ Successfully synced $synced items to cloud!'),
            backgroundColor: AppColors.online,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('No cellular connection yet. Queued safely on device.'),
            backgroundColor: Colors.orange,
          ),
        );
      }
    }
  }

  Future<void> _fetchSightings() async {
    try {
      final sightings = await ApiService.getRecentSightings();
      if (sightings.isNotEmpty) {
        // Cache server sightings locally for zero-signal zones
        await OfflineStorageService.cacheServerSightings(sightings);

        // Opportunistic Sync: Upload any pending sightings now that connection is alive
        await OfflineStorageService.syncPendingData();
      }
    } catch (e) {
      debugPrint("Offline or network error fetching sightings: $e");
    }

    // Always load combined data (Server Cache + Local Unsynced Offline Sightings)
    final allCombined = await OfflineStorageService.getAllCombinedSightings();
    await _checkPendingOfflineCount();

    if (mounted) {
      setState(() {
        _recentSightings = allCombined;
      });
    }
  }

  String _getAnimalEmoji(String animalType) {
    switch (animalType.toLowerCase()) {
      case 'elephant':
        return '🐘';
      case 'leopard':
        return '🐆';
      case 'bear':
        return '🐻';
      case 'deer':
        return '🦌';
      case 'peacock':
        return '🦚';
      default:
        return '🐾';
    }
  }

  Future<void> _loadRoadsFromGeoJson() async {
    try {
      final List<dynamic> allFeatures = [];
      final List<Polyline> polylines = [];
      LatLng? firstPoint;

      void parseFeatures(List<dynamic> features, {Color roadColor = const Color(0xFFFFB74D), Color borderColor = const Color(0xFFFB8C00)}) {
        for (final feature in features) {
          final geometry = feature['geometry'];
          if (geometry == null) continue;
          final type = geometry['type'];
          final coordinates = geometry['coordinates'];

          if (type == 'LineString' && coordinates is List) {
            final List<LatLng> points = [];
            for (final coord in coordinates) {
              if (coord is List && coord.length >= 2) {
                final double lng = (coord[0] as num).toDouble();
                final double lat = (coord[1] as num).toDouble();
                final p = LatLng(lat, lng);
                points.add(p);
                firstPoint ??= p;
              }
            }
            if (points.isNotEmpty) {
              polylines.add(
                Polyline(
                  points: points,
                  color: roadColor,
                  strokeWidth: 3.5,
                  borderColor: borderColor.withValues(alpha: 0.5),
                  borderStrokeWidth: 0.8,
                  strokeCap: StrokeCap.round,
                  strokeJoin: StrokeJoin.round,
                ),
              );
            }
          } else if (type == 'MultiLineString' && coordinates is List) {
            for (final line in coordinates) {
              if (line is List) {
                final List<LatLng> points = [];
                for (final coord in line) {
                  if (coord is List && coord.length >= 2) {
                    final double lng = (coord[0] as num).toDouble();
                    final double lat = (coord[1] as num).toDouble();
                    final p = LatLng(lat, lng);
                    points.add(p);
                    firstPoint ??= p;
                  }
                }
                if (points.isNotEmpty) {
                  polylines.add(
                    Polyline(
                      points: points,
                      color: roadColor,
                      strokeWidth: 3.5,
                      borderColor: borderColor.withValues(alpha: 0.5),
                      borderStrokeWidth: 0.8,
                      strokeCap: StrokeCap.round,
                      strokeJoin: StrokeJoin.round,
                    ),
                  );
                }
              }
            }
          }
        }
      }

      // 1. Load Yala Block 5 & 6 road GeoJSON
      try {
        final String yalaJsonString = await rootBundle.loadString('assets/yala_block_5_and_6.geojson');
        final Map<String, dynamic> yalaData = jsonDecode(yalaJsonString);
        final List<dynamic> yalaFeatures = yalaData['features'] ?? [];
        allFeatures.addAll(yalaFeatures);
        parseFeatures(yalaFeatures, roadColor: const Color(0xFFFFB74D), borderColor: const Color(0xFFFB8C00));
      } catch (e) {
        debugPrint('yala_block_5_and_6.geojson load exception: $e');
      }

      // 2. Load map.geojson
      try {
        final String mapJsonString = await rootBundle.loadString('assets/map.geojson');
        final Map<String, dynamic> mapData = jsonDecode(mapJsonString);
        final List<dynamic> mapFeatures = mapData['features'] ?? [];
        allFeatures.addAll(mapFeatures);
        parseFeatures(mapFeatures, roadColor: const Color(0xFFFFB74D), borderColor: const Color(0xFFFB8C00));
      } catch (e) {
        debugPrint('map.geojson load exception: $e');
      }

      // Build S2R routing graph from combined features
      if (allFeatures.isNotEmpty) {
        _s2rService.buildGraphFromGeoJson({
          'type': 'FeatureCollection',
          'features': allFeatures,
        });
      }

      if (mounted) {
        setState(() {
          _roadPolylines = polylines;
          _currentLocation ??= _defaultLocation;
        });
        if (_isMapReady && _currentLocation != null) {
          _mapController.move(_currentLocation!, 16.0);
        }
      }
    } catch (e) {
      debugPrint('Error loading roads GeoJSON: $e');
    }
  }

  Future<void> _startLiveTracking() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (mounted && _currentLocation == null) {
          setState(() {
            _currentLocation = _defaultLocation;
          });
        }
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          if (mounted && _currentLocation == null) {
            setState(() {
              _currentLocation = _defaultLocation;
            });
          }
          return;
        }
      }

      Position position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
      );
      if (mounted) {
        setState(() {
          _currentLocation = LatLng(position.latitude, position.longitude);
        });
      }

      ApiService.updateLiveLocation(position.latitude, position.longitude);

      Geolocator.getPositionStream(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 10,
        ),
      ).listen((Position position) {
        if (mounted) {
          setState(() {
            _currentLocation = LatLng(position.latitude, position.longitude);
          });

          if (_isMapReady) {
            _mapController.move(_currentLocation!, _mapController.camera.zoom);
          }

          ApiService.updateLiveLocation(position.latitude, position.longitude);

          _checkGeofenceBounds(position.latitude, position.longitude);
        }
      });
    } catch (e) {
      debugPrint('Live tracking error: $e');
      if (mounted && _currentLocation == null) {
        setState(() {
          _currentLocation = _defaultLocation;
        });
      }
    }
  }

  void _checkGeofenceBounds(double lat, double lng) {
    bool isInZone = (lat >= 6.8000 && lat <= 6.8200 && lng >= 79.9800 && lng <= 80.0050) ||
                    (lat >= 8.1200 && lat <= 8.1500 && lng >= 80.9500 && lng <= 80.9800) ||
                    (lat >= 6.2500 && lat <= 6.5500 && lng >= 81.1500 && lng <= 81.6000);
    bool isOutside = !isInZone;

    if (isOutside && !_isOutOfZoneAlertSent) {
      _isOutOfZoneAlertSent = true;
      ApiService.sendEmergencyAlert('Route Deviation', lat, lng);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: const [
              Icon(Icons.warning_amber_rounded, color: Colors.white),
              SizedBox(width: 10),
              Expanded(
                child: Text('⚠️ WARNING: You have left authorized park zone! Emergency alert sent.'),
              ),
            ],
          ),
          backgroundColor: AppColors.offline,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          duration: const Duration(seconds: 5),
        ),
      );
    }

    else if (!isOutside && _isOutOfZoneAlertSent) {
      _isOutOfZoneAlertSent = false;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: const [
              Icon(Icons.check_circle_rounded, color: Colors.white),
              SizedBox(width: 10),
              Text('✅ Back inside authorized park zone.'),
            ],
          ),
          backgroundColor: AppColors.online,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          duration: const Duration(seconds: 3),
        ),
      );
    }
  }

  double _calculateDistanceInKm(double lat1, double lon1, double lat2, double lon2) {
    double distanceInMeters = Geolocator.distanceBetween(lat1, lon1, lat2, lon2);
    return distanceInMeters / 1000.0;
  }

  void _showSightingBottomSheet({LatLng? customLocation}) {
    final LatLng targetLocation = customLocation ??
        _selectedLogLocation ??
        _currentLocation ??
        _defaultLocation;
    final bool isCustom = customLocation != null ||
        (_selectedLogLocation != null && _currentLocation != null && _selectedLogLocation != _currentLocation);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
            boxShadow: [
              BoxShadow(color: Colors.black26, blurRadius: 20, spreadRadius: 5),
            ],
          ),
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 16,
            bottom: MediaQuery.of(context).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Center(
                child: Container(
                  width: 44,
                  height: 5,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: const BoxDecoration(
                      color: AppColors.primaryExtraLight,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.add_location_alt_rounded, color: AppColors.primary, size: 24),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text(
                          'Log Wildlife Spotting',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.textDark),
                        ),
                        Text(
                          'Select animal & choose position on map',
                          style: TextStyle(fontSize: 12, color: AppColors.textMuted, fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Location Selector Card
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isCustom ? const Color(0xFFFFF3E0) : const Color(0xFFE8F5E9),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isCustom ? Colors.orange.shade300 : Colors.green.shade300,
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: isCustom ? Colors.orange.shade100 : Colors.green.shade100,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        isCustom ? Icons.edit_location_alt_rounded : Icons.my_location_rounded,
                        color: isCustom ? Colors.deepOrange : Colors.green.shade800,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            isCustom ? '🎯 Selected on Map' : '📍 Current GPS Location',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 12.5,
                              color: isCustom ? Colors.deepOrange.shade900 : Colors.green.shade900,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${targetLocation.latitude.toStringAsFixed(4)}, ${targetLocation.longitude.toStringAsFixed(4)}',
                            style: TextStyle(
                              fontSize: 11,
                              color: isCustom ? Colors.deepOrange.shade700 : Colors.green.shade700,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    OutlinedButton.icon(
                      icon: const Icon(Icons.touch_app_rounded, size: 14),
                      label: Text(
                        isCustom ? 'Change' : 'Pick on Map',
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: isCustom ? Colors.deepOrange : AppColors.primary,
                        side: BorderSide(color: isCustom ? Colors.deepOrange : AppColors.primary),
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: () {
                        Navigator.pop(context);
                        setState(() {
                          _isPickingLocation = true;
                          _selectedLogLocation = targetLocation;
                        });
                        if (_isMapReady) {
                          _mapController.move(targetLocation, _mapController.camera.zoom);
                        }
                      },
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 3,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 0.95,
                children: [
                  _buildAnimalButton('Elephant', '🐘', targetLocation),
                  _buildAnimalButton('Leopard', '🐆', targetLocation),
                  _buildAnimalButton('Bear', '🐻', targetLocation),
                  _buildAnimalButton('Deer', '🦌', targetLocation),
                  _buildAnimalButton('Peacock', '🦚', targetLocation),
                  _buildAnimalButton('Other', '🐾', targetLocation),
                ],
              ),
              const SizedBox(height: 12),
            ],
          ),
        );
      },
    );
  }

  Widget _buildAnimalButton(String name, String emoji, LatLng targetLocation) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          Navigator.pop(context);
          _saveSighting(name, targetLocation: targetLocation);
        },
        borderRadius: BorderRadius.circular(20),
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.bgSand,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.primary.withValues(alpha: 0.08)),
            boxShadow: AppShadows.softCardShadow,
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(emoji, style: const TextStyle(fontSize: 34)),
              const SizedBox(height: 6),
              Text(
                name,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                  color: AppColors.textDark,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _saveSighting(String animalName, {LatLng? targetLocation}) async {
    final loc = targetLocation ?? _selectedLogLocation ?? _currentLocation ?? _defaultLocation;
    final lat = loc.latitude;
    final lng = loc.longitude;

    setState(() {
      _isPickingLocation = false;
      _selectedLogLocation = null;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: const [
            SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
            ),
            SizedBox(width: 12),
            Text('Logging wildlife sighting...'),
          ],
        ),
        duration: const Duration(seconds: 1),
        behavior: SnackBarBehavior.floating,
      ),
    );

    try {
      final result = await ApiService.logWildlifeSighting(animalName, lat, lng);
      if (result['success']) {
        _fetchSightings();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('🎉 $animalName sighting logged live on map!'),
              backgroundColor: AppColors.online,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          );
        }
        return;
      }
    } catch (_) {
      // Network timeout / dead signal in Yala Block 5
    }

    // 🐾 OFFLINE FALLBACK: Save locally & immediately display on driver's map!
    final offlineRes = await OfflineStorageService.saveOfflineSighting(animalName, lat, lng);
    if (!mounted) return;

    if (offlineRes['success'] == true) {
      await _checkPendingOfflineCount();
      final all = await OfflineStorageService.getAllCombinedSightings();
      if (mounted) {
        setState(() {
          _recentSightings = all;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.cloud_off_rounded, color: Colors.white),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    '📶 Offline: $animalName saved locally on map! Will auto-sync when connection returns.',
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
            backgroundColor: Colors.amber.shade900,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            duration: const Duration(seconds: 4),
          ),
        );
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to save sighting: ${offlineRes['error']}'),
          backgroundColor: AppColors.offline,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
    }
  }

  List<dynamic> get _filteredSightings {
    final now = DateTime.now();
    return _recentSightings.where((sighting) {
      if (sighting['created_at'] == null) return true;
      final createdAt = DateTime.tryParse(sighting['created_at'].toString());
      if (createdAt == null) return true;
      final ageMinutes = now.difference(createdAt).inMinutes;
      final animalType = sighting['animal_type']?.toString() ?? 'other';
      final maxLifespan = S2RRoutingService.getAnimalMaxLifespan(animalType);
      return ageMinutes <= maxLifespan;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    _initPulseAnimation();
    if (_roadPolylines == null) {
      _loadRoadsFromGeoJson();
    }
    return Scaffold(
      backgroundColor: AppColors.bgSand,

      body: _currentLocation == null
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(color: AppColors.primary),
                  SizedBox(height: 16),
                  Text(
                    'Initializing GPS & Park Radar...',
                    style: TextStyle(color: AppColors.textMuted, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            )

          : Stack(
              children: [

                FlutterMap(
                  mapController: _mapController,
                  options: MapOptions(
                    initialCenter: _currentLocation ?? _defaultLocation,
                    initialZoom: 16.0,
                    onMapReady: () {
                      setState(() {
                        _isMapReady = true;
                      });
                      _mapController.move(_currentLocation ?? _defaultLocation, 16.0);
                    },
                    onPositionChanged: (camera, hasGesture) {
                      if (_isPickingLocation && hasGesture) {
                        setState(() {
                          _selectedLogLocation = camera.center;
                        });
                      }
                    },
                    onTap: (tapPosition, point) {
                      if (_isPickingLocation) {
                        setState(() {
                          _selectedLogLocation = point;
                        });
                        _mapController.move(point, _mapController.camera.zoom);
                        return;
                      }
                      if (_selectedSighting != null || _activeS2RRoute != null) {
                        _clearS2RRoute();
                      }
                    },
                    onLongPress: (tapPosition, point) {
                      setState(() {
                        _selectedLogLocation = point;
                      });
                      _showSightingBottomSheet(customLocation: point);
                    },
                  ),
                  children: [

                    if (!_isSatelliteView)
                      TileLayer(
                        urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                        userAgentPackageName: 'com.guidelanka.driver',
                      )
                    else ...[

                      TileLayer(
                        urlTemplate: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                        userAgentPackageName: 'com.guidelanka.driver',
                        maxZoom: 19,
                      ),

                      TileLayer(
                        urlTemplate: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
                        userAgentPackageName: 'com.guidelanka.driver',
                        maxZoom: 19,
                      ),

                      TileLayer(
                        urlTemplate: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
                        userAgentPackageName: 'com.guidelanka.driver',
                        maxZoom: 19,
                      ),
                    ],

                    if (_roadPolylines != null && _roadPolylines!.isNotEmpty)
                      PolylineLayer(
                        polylines: _roadPolylines!,
                      ),

                    if (_activeS2RRoute != null)
                      PolylineLayer(
                        polylines: _buildS2RRoutePolylines(),
                      ),

                    MarkerLayer(
                      markers: [

                        Marker(
                          width: 60.0,
                          height: 60.0,
                          point: _currentLocation!,
                          child: ScaleTransition(
                            scale: _pulseAnimation!,
                            child: Container(
                              decoration: BoxDecoration(
                                color: Colors.blue.withValues(alpha: 0.25),
                                shape: BoxShape.circle,
                              ),
                              child: Center(
                                child: Container(
                                  width: 42,
                                  height: 42,
                                  decoration: BoxDecoration(
                                    gradient: const LinearGradient(
                                      colors: [Color(0xFF2980B9), Color(0xFF3498DB)],
                                    ),
                                    shape: BoxShape.circle,
                                    border: Border.all(color: Colors.white, width: 3),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.blue.withValues(alpha: 0.4),
                                        blurRadius: 10,
                                        spreadRadius: 2,
                                      )
                                    ],
                                  ),
                                  child: const Icon(Icons.directions_car_rounded, color: Colors.white, size: 22),
                                ),
                              ),
                            ),
                          ),
                        ),

                        ..._filteredSightings.map((sighting) {
                          final lat = double.tryParse(sighting['location_lat'].toString()) ?? 0.0;
                          final lng = double.tryParse(sighting['location_lng'].toString()) ?? 0.0;
                          final animalType = sighting['animal_type'] ?? 'Unknown';
                          final isImportant = animalType.toLowerCase() == 'leopard' || animalType.toLowerCase() == 'elephant';
                          final isSelected = _selectedSighting != null && _selectedSighting!['id'] == sighting['id'];
                          final isOffline = sighting['is_offline'] == true;

                          return Marker(
                            width: 54.0,
                            height: 54.0,
                            point: LatLng(lat, lng),
                            child: GestureDetector(
                              onTap: () {
                                _onSightingSelected(sighting);
                              },
                              child: Stack(
                                clipBehavior: Clip.none,
                                children: [
                                  AnimatedContainer(
                                    duration: const Duration(milliseconds: 200),
                                    decoration: BoxDecoration(
                                      color: isSelected ? AppColors.accentLight : Colors.white,
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                        color: isSelected
                                            ? AppColors.accent
                                            : (isImportant ? AppColors.accent : AppColors.primary),
                                        width: isSelected ? 3.5 : 2.5,
                                      ),
                                      boxShadow: [
                                        BoxShadow(
                                          color: (isImportant ? AppColors.accent : AppColors.primary).withValues(alpha: 0.35),
                                          blurRadius: isSelected ? 14 : 8,
                                          spreadRadius: isSelected ? 3 : 1,
                                        )
                                      ],
                                    ),
                                    child: Center(
                                      child: Text(
                                        _getAnimalEmoji(animalType),
                                        style: TextStyle(fontSize: isSelected ? 28 : 24),
                                      ),
                                    ),
                                  ),
                                  if (isOffline)
                                    Positioned(
                                      top: -2,
                                      right: -2,
                                      child: Container(
                                        padding: const EdgeInsets.all(3),
                                        decoration: BoxDecoration(
                                          color: Colors.amber.shade900,
                                          shape: BoxShape.circle,
                                          border: Border.all(color: Colors.white, width: 1.5),
                                        ),
                                        child: const Icon(Icons.cloud_off_rounded, color: Colors.white, size: 10),
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          );
                        }),

                        if (!_isPickingLocation && _selectedLogLocation != null)
                          Marker(
                            width: 70.0,
                            height: 68.0,
                            alignment: Alignment.topCenter,
                            point: _selectedLogLocation!,
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: Colors.deepOrange,
                                    borderRadius: BorderRadius.circular(8),
                                    boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 4)],
                                  ),
                                  child: const Text(
                                    'New Spot 🎯',
                                    style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                                  ),
                                ),
                                const Icon(Icons.location_on_rounded, color: Colors.deepOrange, size: 30),
                              ],
                            ),
                          ),

                        if (_activeS2RRoute != null)
                          Marker(
                            width: 44.0,
                            height: 44.0,
                            point: _activeS2RRoute!.nearestRoadToSighting,
                            child: _buildNearestRoadAccessMarker(),
                          ),
                      ],
                    ),
                  ],
                ),

                Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  child: Container(
                    padding: const EdgeInsets.only(top: 10, left: 16, right: 16, bottom: 14),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          AppColors.primary.withValues(alpha: 0.95),
                          AppColors.primary.withValues(alpha: 0.85),
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                      boxShadow: [
                        BoxShadow(color: Colors.black.withValues(alpha: 0.15), blurRadius: 10, offset: const Offset(0, 4)),
                      ],
                    ),
                    child: SafeArea(
                      bottom: false,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [

                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: const Icon(Icons.explore_rounded, color: AppColors.accent, size: 20),
                                  ),
                                  const SizedBox(width: 10),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'Live Safari Radar',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 17,
                                          fontWeight: FontWeight.w900,
                                          letterSpacing: 0.3,
                                        ),
                                      ),
                                      Row(
                                        children: [
                                          Container(
                                            width: 7,
                                            height: 7,
                                            decoration: const BoxDecoration(
                                              color: AppColors.online,
                                              shape: BoxShape.circle,
                                            ),
                                          ),
                                          const SizedBox(width: 5),
                                          Text(
                                            _isOutOfZoneAlertSent ? 'OUT OF ZONE ⚠️' : 'Safari Navigation Zone 🌲',
                                            style: TextStyle(
                                              color: _isOutOfZoneAlertSent ? Colors.red.shade200 : Colors.white70,
                                              fontSize: 11,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ],
                              ),

                              Row(
                                children: [
                                  if (_pendingOfflineCount > 0)
                                    GestureDetector(
                                      onTap: _manualSyncOfflineData,
                                      child: Container(
                                        margin: const EdgeInsets.only(right: 8),
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                        decoration: BoxDecoration(
                                          color: Colors.amber.shade900,
                                          borderRadius: BorderRadius.circular(20),
                                          boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 4)],
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            const Icon(Icons.sync_rounded, color: Colors.white, size: 14),
                                            const SizedBox(width: 4),
                                            Text(
                                              '$_pendingOfflineCount Queued',
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontWeight: FontWeight.bold,
                                                fontSize: 11,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(20),
                                      border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
                                    ),
                                    child: Row(
                                      children: [
                                        const Icon(Icons.radar_rounded, color: AppColors.accent, size: 14),
                                        const SizedBox(width: 5),
                                        Text(
                                          '${_recentSightings.length} Spotted',
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 11,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                Positioned(
                  top: 100.0,
                  right: 16.0,
                  child: Column(
                    children: [

                      _buildMapControlButton(
                        icon: _isSatelliteView ? Icons.map_rounded : Icons.satellite_alt_rounded,
                        tooltip: _isSatelliteView ? 'Standard View' : 'Satellite HD',
                        isActive: _isSatelliteView,
                        onPressed: () {
                          setState(() {
                            _isSatelliteView = !_isSatelliteView;
                          });
                        },
                      ),
                      const SizedBox(height: 8),

                      _buildMapControlButton(
                        icon: Icons.explore_rounded,
                        tooltip: 'Align North',
                        isActive: false,
                        onPressed: () {
                          if (_isMapReady) {
                            _mapController.rotate(0.0);
                          }
                        },
                      ),
                      const SizedBox(height: 8),

                      _buildMapControlButton(
                        icon: Icons.add_rounded,
                        tooltip: 'Zoom In',
                        isActive: false,
                        onPressed: () {
                          if (_isMapReady) {
                            _mapController.move(
                              _mapController.camera.center,
                              _mapController.camera.zoom + 1.0,
                            );
                          }
                        },
                      ),
                      const SizedBox(height: 8),

                      _buildMapControlButton(
                        icon: Icons.remove_rounded,
                        tooltip: 'Zoom Out',
                        isActive: false,
                        onPressed: () {
                          if (_isMapReady) {
                            _mapController.move(
                              _mapController.camera.center,
                              _mapController.camera.zoom - 1.0,
                            );
                          }
                        },
                      ),
                      const SizedBox(height: 8),

                      _buildMapControlButton(
                        icon: Icons.my_location_rounded,
                        tooltip: 'My Location',
                        isActive: true,
                        activeColor: Colors.blue.shade700,
                        onPressed: () {
                          if (_isMapReady && _currentLocation != null) {
                            final targetZoom = _mapController.camera.zoom >= 17.0
                                ? _mapController.camera.zoom
                                : 17.5;
                            _mapController.move(_currentLocation!, targetZoom);
                          }
                        },
                      ),
                    ],
                  ),
                ),

                _buildS2RRouteCard(),

                if (!_isPickingLocation)
                  Positioned(
                    bottom: 24,
                    left: 30,
                    right: 30,
                    child: Container(
                      height: 54,
                      decoration: BoxDecoration(
                        gradient: AppGradients.primaryGradient,
                        borderRadius: BorderRadius.circular(30),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.35),
                            blurRadius: 18,
                            spreadRadius: 2,
                            offset: const Offset(0, 6),
                          )
                        ],
                      ),
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          onTap: () => _showSightingBottomSheet(),
                          borderRadius: BorderRadius.circular(30),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: const [
                              Icon(Icons.add_location_alt_rounded, color: AppColors.accent, size: 22),
                              SizedBox(width: 10),
                              Text(
                                'LOG WILDLIFE SIGHTING',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 14,
                                  letterSpacing: 0.8,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),

                if (_isPickingLocation) ...[
                  // Floating Center Pin (Uber/Google Maps style drag-and-drop indicator)
                  IgnorePointer(
                    child: Center(
                      child: FractionalTranslation(
                        translation: const Offset(0.0, -0.5),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: const Color(0xFF1E293B),
                                borderRadius: BorderRadius.circular(16),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.35),
                                    blurRadius: 10,
                                    offset: const Offset(0, 3),
                                  ),
                                ],
                                border: Border.all(color: Colors.orangeAccent, width: 1.2),
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.open_with_rounded, color: Colors.orangeAccent, size: 14),
                                  SizedBox(width: 5),
                                  Text(
                                    'Drag Map to Move Location 🎯',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 4),
                            const Icon(
                              Icons.location_on_rounded,
                              color: Colors.deepOrange,
                              size: 52,
                              shadows: [
                                Shadow(
                                  color: Colors.black45,
                                  blurRadius: 10,
                                  offset: Offset(0, 4),
                                ),
                              ],
                            ),
                            Container(
                              width: 14,
                              height: 6,
                              decoration: BoxDecoration(
                                color: Colors.black.withValues(alpha: 0.35),
                                borderRadius: const BorderRadius.all(Radius.elliptical(14, 6)),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                  // Top Drag & Drop Guidance Banner
                  Positioned(
                    top: 80,
                    left: 16,
                    right: 16,
                    child: SafeArea(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1E293B),
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.35),
                              blurRadius: 15,
                              offset: const Offset(0, 4),
                            ),
                          ],
                          border: Border.all(color: AppColors.accent, width: 1.5),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: AppColors.accent,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Icon(Icons.touch_app_rounded, color: Colors.white, size: 20),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: const [
                                  Text(
                                    'Drag & Drop Location Mode',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                    ),
                                  ),
                                  SizedBox(height: 2),
                                  Text(
                                    'Drag map or tap to place pin where animal was spotted',
                                    style: TextStyle(
                                      color: Colors.white70,
                                      fontSize: 11,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.close_rounded, color: Colors.white),
                              onPressed: () {
                                setState(() {
                                  _isPickingLocation = false;
                                  _selectedLogLocation = null;
                                });
                              },
                              tooltip: 'Cancel',
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                  // Bottom Location Confirm Bar
                  Positioned(
                    bottom: 24,
                    left: 16,
                    right: 16,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.25),
                            blurRadius: 18,
                            offset: const Offset(0, 6),
                          ),
                        ],
                        border: Border.all(color: Colors.deepOrange.withValues(alpha: 0.4), width: 1.5),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: Colors.deepOrange.withValues(alpha: 0.12),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.location_on_rounded, color: Colors.deepOrange, size: 26),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Text(
                                  'Selected Location 🎯',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w900,
                                    fontSize: 13,
                                    color: AppColors.textDark,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '${(_selectedLogLocation ?? _mapController.camera.center).latitude.toStringAsFixed(4)}, ${(_selectedLogLocation ?? _mapController.camera.center).longitude.toStringAsFixed(4)}',
                                  style: const TextStyle(
                                    fontSize: 11,
                                    color: AppColors.textMuted,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          ElevatedButton.icon(
                            icon: const Icon(Icons.check_circle_rounded, size: 18),
                            label: const Text('Confirm Here', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12.5)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.deepOrange,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              elevation: 2,
                            ),
                            onPressed: () {
                              final target = _selectedLogLocation ?? _mapController.camera.center;
                              setState(() {
                                _isPickingLocation = false;
                              });
                              _showSightingBottomSheet(customLocation: target);
                            },
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ],
            ),
    );
  }



  Widget _buildMapControlButton({
    required IconData icon,
    required String tooltip,
    required VoidCallback onPressed,
    bool isActive = false,
    Color? activeColor,
  }) {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: isActive ? (activeColor ?? AppColors.primary) : Colors.white,
        shape: BoxShape.circle,
        boxShadow: AppShadows.softCardShadow,
        border: Border.all(color: Colors.black.withValues(alpha: 0.05)),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onPressed,
          customBorder: const CircleBorder(),
          child: Tooltip(
            message: tooltip,
            child: Icon(
              icon,
              color: isActive ? Colors.white : AppColors.primary,
              size: 22,
            ),
          ),
        ),
      ),
    );
  }

  void _onSightingSelected(Map<String, dynamic> sighting) {
    final lat = double.tryParse(sighting['location_lat'].toString()) ?? 0.0;
    final lng = double.tryParse(sighting['location_lng'].toString()) ?? 0.0;
    final sightingPos = LatLng(lat, lng);
    final driverPos = _currentLocation ?? _defaultLocation;
    final animalType = sighting['animal_type']?.toString() ?? 'Wildlife';

    DateTime? sightingTime;
    if (sighting['created_at'] != null) {
      sightingTime = DateTime.tryParse(sighting['created_at'].toString());
    }

    final route = _s2rService.calculateRoute(
      driverLocation: driverPos,
      sightingLocation: sightingPos,
      animalType: animalType,
      sightingTime: sightingTime,
    );

    setState(() {
      _selectedSighting = sighting;
      _activeS2RRoute = route;
    });

    if (_isMapReady && route.fullRoute.isNotEmpty) {
      _fitMapToRoute(route.fullRoute);
    }
  }

  void _clearS2RRoute() {
    setState(() {
      _selectedSighting = null;
      _activeS2RRoute = null;
    });
  }

  void _fitMapToRoute(List<LatLng> points) {
    if (points.isEmpty) return;
    try {
      final bounds = LatLngBounds.fromPoints(points);
      _mapController.fitCamera(
        CameraFit.bounds(
          bounds: bounds,
          padding: const EdgeInsets.only(top: 80, bottom: 240, left: 50, right: 50),
          maxZoom: 18.0,
        ),
      );
    } catch (e) {
      if (points.isNotEmpty) {
        _mapController.move(points.first, 17.5);
      }
    }
  }

  List<Polyline> _buildS2RRoutePolylines() {
    if (_activeS2RRoute == null) return [];
    final List<Polyline> lines = [];

    // 1. High-visibility illuminated road segment on the safari road network
    if (_activeS2RRoute!.roadSegment.length >= 2) {
      // Outer neon-blue ambient glow
      lines.add(
        Polyline(
          points: _activeS2RRoute!.roadSegment,
          color: const Color(0xFF00E5FF).withValues(alpha: 0.35),
          strokeWidth: 9.0,
          strokeCap: StrokeCap.round,
          strokeJoin: StrokeJoin.round,
        ),
      );
      // Core electric blue road path
      lines.add(
        Polyline(
          points: _activeS2RRoute!.roadSegment,
          color: const Color(0xFF0091EA),
          strokeWidth: 5.0,
          borderColor: Colors.white.withValues(alpha: 0.8),
          borderStrokeWidth: 1.0,
          strokeCap: StrokeCap.round,
          strokeJoin: StrokeJoin.round,
        ),
      );
    }

    // 2. Approach from Driver position to nearest road access entrance
    final driverPos = _currentLocation ?? _defaultLocation;
    if (S2RRoutingService.distanceMeters(driverPos, _activeS2RRoute!.nearestRoadToDriver) > 3.0) {
      lines.add(
        Polyline(
          points: [driverPos, _activeS2RRoute!.nearestRoadToDriver],
          color: const Color(0xFF1E88E5),
          strokeWidth: 3.5,
          borderColor: Colors.white,
          borderStrokeWidth: 1.0,
          strokeCap: StrokeCap.round,
        ),
      );
    }

    // 3. Sighting link: from nearest road point to actual animal sighting
    if (_selectedSighting != null) {
      final sLat = double.tryParse(_selectedSighting!['location_lat'].toString()) ?? 0.0;
      final sLng = double.tryParse(_selectedSighting!['location_lng'].toString()) ?? 0.0;
      final sightingPos = LatLng(sLat, sLng);
      if (S2RRoutingService.distanceMeters(_activeS2RRoute!.nearestRoadToSighting, sightingPos) > 3.0) {
        lines.add(
          Polyline(
            points: [_activeS2RRoute!.nearestRoadToSighting, sightingPos],
            color: const Color(0xFFFF6D00),
            strokeWidth: 3.5,
            borderColor: Colors.white,
            borderStrokeWidth: 1.0,
            strokeCap: StrokeCap.round,
          ),
        );
      }
    }

    return lines;
  }

  Widget _buildNearestRoadAccessMarker() {
    return Tooltip(
      message: 'Nearest Safari Road Access Point (S2R)',
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF0091EA),
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white, width: 2.5),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF0091EA).withValues(alpha: 0.6),
              blurRadius: 10,
              spreadRadius: 2,
            ),
          ],
        ),
        child: const Center(
          child: Icon(
            Icons.alt_route_rounded,
            color: Colors.white,
            size: 22,
          ),
        ),
      ),
    );
  }

  Widget _buildS2RRouteCard() {
    if (_selectedSighting == null || _activeS2RRoute == null) {
      return const SizedBox.shrink();
    }

    final route = _activeS2RRoute!;
    final animalType = route.animalType;
    final emoji = _getAnimalEmoji(animalType);
    final scorePercent = (route.s2rScore * 100).toInt();
    final freshnessPercent = (route.timeDecay * 100).toInt();
    final distanceM = route.distanceMeters.toStringAsFixed(0);
    final straightKm = _currentLocation != null
        ? _calculateDistanceInKm(
            _currentLocation!.latitude,
            _currentLocation!.longitude,
            double.tryParse(_selectedSighting!['location_lat'].toString()) ?? 0.0,
            double.tryParse(_selectedSighting!['location_lng'].toString()) ?? 0.0,
          ).toStringAsFixed(1)
        : '0.0';

    return Positioned(
      bottom: 88,
      left: 16,
      right: 16,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.18),
              blurRadius: 20,
              offset: const Offset(0, 6),
            ),
          ],
          border: Border.all(color: const Color(0xFF0091EA).withValues(alpha: 0.35), width: 1.5),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Row 1: Emoji, Animal Title, S2R Badge, Close Button
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0091EA).withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: Text(emoji, style: const TextStyle(fontSize: 28)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              '$animalType Sighting',
                              style: const TextStyle(
                                fontWeight: FontWeight.w900,
                                fontSize: 16,
                                color: AppColors.textDark,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFF00C853).withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: const Color(0xFF00C853)),
                            ),
                            child: Text(
                              'S2R $scorePercent%',
                              style: const TextStyle(
                                color: Color(0xFF007E33),
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(width: 2),
                      Text(
                        '🛣️ Road: $distanceM m • Direct: $straightKm km • Active for ${route.remainingMinutes}m',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textMuted,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded, color: AppColors.textLight),
                  onPressed: _clearS2RRoute,
                  tooltip: 'Clear Route',
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Row 2: S2R Formula Metrics Pill Container
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFFF5F7FA),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildMetricItem(
                    label: 'Road Dist L(P)',
                    value: '$distanceM m',
                    icon: Icons.alt_route_rounded,
                    color: const Color(0xFF0288D1),
                  ),
                  Container(height: 24, width: 1, color: Colors.grey.shade300),
                  _buildMetricItem(
                    label: 'Freshness TD',
                    value: '$freshnessPercent% (${route.remainingMinutes}m)',
                    icon: Icons.timer_outlined,
                    color: const Color(0xFFE65100),
                  ),
                  Container(height: 24, width: 1, color: Colors.grey.shade300),
                  _buildMetricItem(
                    label: 'Weight (AW)',
                    value: route.animalWeight.toStringAsFixed(1),
                    icon: Icons.pets_rounded,
                    color: const Color(0xFF2E7D32),
                  ),
                  Container(height: 24, width: 1, color: Colors.grey.shade300),
                  _buildMetricItem(
                    label: 'Utility (Si)',
                    value: route.sightingUtility.toStringAsFixed(2),
                    icon: Icons.auto_awesome_rounded,
                    color: const Color(0xFF6A1B9A),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),

            // Row 3: Action Buttons (Focus on Route / Nearest Road Point)
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.center_focus_strong_rounded, size: 16),
                    label: const Text('View Full Route', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF0091EA),
                      side: const BorderSide(color: Color(0xFF0091EA)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                    onPressed: () {
                      if (_isMapReady && _activeS2RRoute != null) {
                        _fitMapToRoute(_activeS2RRoute!.fullRoute);
                      }
                    },
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton.icon(
                    icon: const Icon(Icons.alt_route_rounded, size: 16),
                    label: const Text('Go to Road Access', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0091EA),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      elevation: 0,
                    ),
                    onPressed: () {
                      if (_isMapReady && _activeS2RRoute != null) {
                        _mapController.move(_activeS2RRoute!.nearestRoadToSighting, 18.0);
                      }
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricItem({
    required String label,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 13, color: color),
            const SizedBox(width: 3),
            Text(
              value,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                color: color,
              ),
            ),
          ],
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: TextStyle(
            fontSize: 9.5,
            color: Colors.grey.shade600,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}
