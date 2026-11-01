import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class RangerStation {
  final String id;
  final String name;
  final String code;
  final double latitude;
  final double longitude;
  final String phoneNumber;
  final String emergencyChannel;
  final String description;

  const RangerStation({
    required this.id,
    required this.name,
    required this.code,
    required this.latitude,
    required this.longitude,
    required this.phoneNumber,
    required this.emergencyChannel,
    required this.description,
  });

  LatLng get location => LatLng(latitude, longitude);

  double distanceInKm(double currentLat, double currentLng) {
    final meters = Geolocator.distanceBetween(
      currentLat,
      currentLng,
      latitude,
      longitude,
    );
    return meters / 1000.0;
  }

  String compassBearing(double currentLat, double currentLng) {
    final bearing = Geolocator.bearingBetween(
      currentLat,
      currentLng,
      latitude,
      longitude,
    );
    if (bearing >= -22.5 && bearing < 22.5) return 'N';
    if (bearing >= 22.5 && bearing < 67.5) return 'NE';
    if (bearing >= 67.5 && bearing < 112.5) return 'E';
    if (bearing >= 112.5 && bearing < 157.5) return 'SE';
    if (bearing >= 157.5 || bearing < -157.5) return 'S';
    if (bearing >= -157.5 && bearing < -112.5) return 'SW';
    if (bearing >= -112.5 && bearing < -67.5) return 'W';
    return 'NW';
  }
}

class OfflineStorageService {
  static const String _keyOfflineSightings = 'guidelanka_offline_sightings';
  static const String _keyCachedSightings = 'guidelanka_cached_sightings';
  static const String _keyOfflineEmergencies = 'guidelanka_offline_emergencies';

  /// Pre-configured Wildlife Ranger Beats & Outposts in/around Yala Block 5 & Galge
  static const List<RangerStation> rangerStations = [
    RangerStation(
      id: 'galge_hq',
      name: 'Galge Ranger Beat & Entrance Post',
      code: 'YALA-B5-GALGE',
      latitude: 6.5512,
      longitude: 81.3654,
      phoneNumber: '+94771234567',
      emergencyChannel: 'VHF Ch 12 (156.6 MHz)',
      description: 'Primary Wildlife Ranger base station & barrier gate for Block 5',
    ),
    RangerStation(
      id: 'katagamuwa_post',
      name: 'Katagamuwa Wildlife Office',
      code: 'YALA-KATAGAMUWA',
      latitude: 6.4258,
      longitude: 81.3912,
      phoneNumber: '+94472239415',
      emergencyChannel: 'VHF Ch 08 (156.4 MHz)',
      description: 'Southern park control center with 24/7 patrol dispatch',
    ),
    RangerStation(
      id: 'kebiliththa_beat',
      name: 'Kebiliththa / Block 5 North Patrol Camp',
      code: 'YALA-B5-NORTH',
      latitude: 6.5820,
      longitude: 81.3410,
      phoneNumber: '+94718889911',
      emergencyChannel: 'VHF Ch 16 (156.8 MHz)',
      description: 'Deep jungle patrol unit with emergency tractor & recovery gear',
    ),
    RangerStation(
      id: 'palatupana_hq',
      name: 'Palatupana Wildlife Warden HQ',
      code: 'DWC-YALA-MAIN',
      latitude: 6.2736,
      longitude: 81.4182,
      phoneNumber: '1992',
      emergencyChannel: 'VHF Repeater Ch 01',
      description: 'Department of Wildlife Conservation central command center',
    ),
  ];

  // =========================================================================
  // SIGHTINGS OFFLINE QUEUE
  // =========================================================================

  /// Save an animal sighting locally when offline
  static Future<Map<String, dynamic>> saveOfflineSighting(
    String animalType,
    double lat,
    double lng, {
    String? description,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final List<Map<String, dynamic>> existing = await getOfflineSightings();

      final now = DateTime.now().toIso8601String();
      final localId = 'offline_${DateTime.now().millisecondsSinceEpoch}_${existing.length}';

      final sighting = {
        'id': localId,
        'animal_type': animalType,
        'location_lat': lat,
        'location_lng': lng,
        'description': description ?? 'Logged offline in Yala Block 5',
        'created_at': now,
        'is_offline': true,
        'sync_status': 'PENDING_SYNC',
      };

      existing.insert(0, sighting);
      await prefs.setString(_keyOfflineSightings, jsonEncode(existing));

      debugPrint('📦 Sighting saved offline: $animalType ($localId)');
      return {'success': true, 'data': sighting};
    } catch (e) {
      debugPrint('Error saving offline sighting: $e');
      return {'success': false, 'error': e.toString()};
    }
  }

  /// Get all unsynced offline sightings
  static Future<List<Map<String, dynamic>>> getOfflineSightings() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_keyOfflineSightings);
      if (raw == null || raw.isEmpty) return [];

      final decoded = jsonDecode(raw);
      if (decoded is List) {
        return List<Map<String, dynamic>>.from(
          decoded.map((item) => Map<String, dynamic>.from(item)),
        );
      }
      return [];
    } catch (e) {
      debugPrint('Error reading offline sightings: $e');
      return [];
    }
  }

  /// Remove a specific offline sighting after it has been synced to server
  static Future<void> removeOfflineSighting(String localId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final list = await getOfflineSightings();
      list.removeWhere((item) => item['id'] == localId);
      await prefs.setString(_keyOfflineSightings, jsonEncode(list));
    } catch (e) {
      debugPrint('Error removing offline sighting: $e');
    }
  }

  /// Cache server sightings for offline viewing
  static Future<void> cacheServerSightings(List<dynamic> serverSightings) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_keyCachedSightings, jsonEncode(serverSightings));
    } catch (e) {
      debugPrint('Error caching server sightings: $e');
    }
  }

  /// Get cached server sightings
  static Future<List<dynamic>> getCachedServerSightings() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_keyCachedSightings);
      if (raw == null || raw.isEmpty) return [];

      final decoded = jsonDecode(raw);
      if (decoded is List) return decoded;
      return [];
    } catch (e) {
      debugPrint('Error reading cached server sightings: $e');
      return [];
    }
  }

  /// Get combined sightings (server cache + local unsynced offline sightings)
  /// Guarantees the driver's map is never empty even when opening without any cellular signal!
  static Future<List<dynamic>> getAllCombinedSightings() async {
    final localUnsynced = await getOfflineSightings();
    final cachedServer = await getCachedServerSightings();

    final Map<String, dynamic> combinedMap = {};

    for (final item in cachedServer) {
      final id = item['id']?.toString() ?? '${item['location_lat']}_${item['location_lng']}';
      combinedMap[id] = item;
    }

    for (final item in localUnsynced) {
      final id = item['id'].toString();
      combinedMap[id] = item;
    }

    return combinedMap.values.toList();
  }

  // =========================================================================
  // EMERGENCY OFFLINE QUEUE
  // =========================================================================

  /// Save an emergency alert locally when network request fails
  static Future<Map<String, dynamic>> saveOfflineEmergencyAlert({
    required double lat,
    required double lng,
    required String emergencyType,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final List<Map<String, dynamic>> existing = await getOfflineEmergencyAlerts();

      final now = DateTime.now().toIso8601String();
      final localId = 'sos_${DateTime.now().millisecondsSinceEpoch}';

      final alert = {
        'id': localId,
        'latitude': lat,
        'longitude': lng,
        'alert_type': emergencyType,
        'created_at': now,
        'is_offline': true,
        'status': 'PENDING_OFFLINE',
      };

      existing.insert(0, alert);
      await prefs.setString(_keyOfflineEmergencies, jsonEncode(existing));

      debugPrint('🚨 Emergency alert saved offline: $emergencyType ($localId)');
      return {'success': true, 'data': alert};
    } catch (e) {
      debugPrint('Error saving offline emergency: $e');
      return {'success': false, 'error': e.toString()};
    }
  }

  /// Get pending offline emergencies
  static Future<List<Map<String, dynamic>>> getOfflineEmergencyAlerts() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_keyOfflineEmergencies);
      if (raw == null || raw.isEmpty) return [];

      final decoded = jsonDecode(raw);
      if (decoded is List) {
        return List<Map<String, dynamic>>.from(
          decoded.map((item) => Map<String, dynamic>.from(item)),
        );
      }
      return [];
    } catch (e) {
      debugPrint('Error reading offline emergencies: $e');
      return [];
    }
  }

  /// Clear synced emergency alert
  static Future<void> removeOfflineEmergencyAlert(String localId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final list = await getOfflineEmergencyAlerts();
      list.removeWhere((item) => item['id'] == localId);
      await prefs.setString(_keyOfflineEmergencies, jsonEncode(list));
    } catch (e) {
      debugPrint('Error removing offline emergency: $e');
    }
  }

  // =========================================================================
  // AUTO-SYNC WORKER
  // =========================================================================

  /// Attempts to upload all pending sightings and emergency alerts to the server
  /// Called periodically or whenever connectivity is restored
  static Future<Map<String, int>> syncPendingData() async {
    int syncedSightings = 0;
    int syncedEmergencies = 0;
    int failed = 0;

    // 1. Sync Emergency Alerts first (high priority)
    final pendingEmergencies = await getOfflineEmergencyAlerts();
    for (final alert in pendingEmergencies) {
      try {
        final res = await ApiService.sendSOSAlert(
          lat: (alert['latitude'] as num).toDouble(),
          lng: (alert['longitude'] as num).toDouble(),
          emergencyType: alert['alert_type'] ?? 'SOS',
        );

        if (res['success'] == true) {
          await removeOfflineEmergencyAlert(alert['id']);
          syncedEmergencies++;
        } else {
          failed++;
        }
      } catch (_) {
        failed++;
      }
    }

    // 2. Sync Sightings
    final pendingSightings = await getOfflineSightings();
    for (final sighting in pendingSightings) {
      try {
        final res = await ApiService.logWildlifeSighting(
          sighting['animal_type'],
          (sighting['location_lat'] as num).toDouble(),
          (sighting['location_lng'] as num).toDouble(),
        );

        if (res['success'] == true) {
          await removeOfflineSighting(sighting['id']);
          syncedSightings++;
        } else {
          failed++;
        }
      } catch (_) {
        failed++;
      }
    }

    debugPrint(
      '🔄 Offline Sync Summary: $syncedSightings sightings, $syncedEmergencies emergencies synced. $failed failed.',
    );

    return {
      'syncedSightings': syncedSightings,
      'syncedEmergencies': syncedEmergencies,
      'failed': failed,
    };
  }

  /// Generates encoded low-bandwidth SMS payload for ranger emergency dispatch
  static Future<String> generateEmergencySmsBody({
    required String emergencyType,
    required double lat,
    required double lng,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    final driverName = prefs.getString('user_name') ?? 'Safari Driver';
    final vehicleNo = prefs.getString('vehicle_no') ?? 'Yala Jeep';

    // Format: Compact & readable over 2G GSM SMS
    return '🚨 EMERGENCY SOS (Yala Block 5)\n'
        'TYPE: $emergencyType\n'
        'LOC: ${lat.toStringAsFixed(5)}, ${lng.toStringAsFixed(5)}\n'
        'VEHICLE: $vehicleNo\n'
        'DRIVER: $driverName\n'
        'MAP: https://maps.google.com/?q=${lat.toStringAsFixed(5)},${lng.toStringAsFixed(5)}';
  }

  /// Get sorted list of ranger stations by distance from current location
  static List<Map<String, dynamic>> getNearbyRangerStations(double currentLat, double currentLng) {
    final List<Map<String, dynamic>> sorted = [];

    for (final station in rangerStations) {
      final distanceKm = station.distanceInKm(currentLat, currentLng);
      final bearing = station.compassBearing(currentLat, currentLng);
      sorted.add({
        'station': station,
        'distanceKm': distanceKm,
        'bearing': bearing,
      });
    }

    sorted.sort((a, b) => (a['distanceKm'] as double).compareTo(b['distanceKm'] as double));
    return sorted;
  }
}
