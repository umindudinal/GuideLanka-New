import 'dart:async';

import 'package:flutter/material.dart';

import 'package:flutter/services.dart';

import 'package:geolocator/geolocator.dart';

import 'package:url_launcher/url_launcher.dart';

import '../services/api_service.dart';
import '../services/offline_storage_service.dart';

import '../widgets/theme_constants.dart';

class EmergencyScreen extends StatefulWidget {
  const EmergencyScreen({super.key});

  @override
  State<EmergencyScreen> createState() => _EmergencyScreenState();
}

class _EmergencyScreenState extends State<EmergencyScreen> with SingleTickerProviderStateMixin {

  String _selectedAlertType = 'SOS';

  double? _currentLat;

  double? _currentLng;

  bool _isLoadingLocation = false;

  double _locationAccuracy = 0.0;

  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  Timer? _holdTimer;
  double _holdProgress = 0.0;
  bool _isHolding = false;
  static const int _requiredHoldMs = 1500;

  @override
  void initState() {
    super.initState();

    _getCurrentLocation();

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.12).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _holdTimer?.cancel();
    super.dispose();
  }

  Future<void> _getCurrentLocation() async {
    setState(() => _isLoadingLocation = true);
    try {

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {

        permission = await Geolocator.requestPermission();
      }

      if (permission == LocationPermission.whileInUse || permission == LocationPermission.always) {
        Position position = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
        );
        if (mounted) {
          setState(() {
            _currentLat = position.latitude;
            _currentLng = position.longitude;
            _locationAccuracy = position.accuracy;
          });
        }
      }
    } catch (e) {
      debugPrint("Error getting location: $e");
    } finally {
      if (mounted) {
        setState(() => _isLoadingLocation = false);
      }
    }
  }

  void _startHold() {

    HapticFeedback.mediumImpact();
    setState(() {
      _isHolding = true;
      _holdProgress = 0.0;
    });

    const stepMs = 50;
    int elapsed = 0;

    _holdTimer?.cancel();
    _holdTimer = Timer.periodic(const Duration(milliseconds: stepMs), (timer) {
      elapsed += stepMs;
      if (mounted) {
        setState(() {

          _holdProgress = (elapsed / _requiredHoldMs).clamp(0.0, 1.0);
        });
      }

      if (elapsed >= _requiredHoldMs) {
        timer.cancel();
        HapticFeedback.heavyImpact();
        _triggerSOS();
        if (mounted) {
          setState(() {
            _isHolding = false;
            _holdProgress = 0.0;
          });
        }
      }
    });
  }

  void _cancelHold() {
    _holdTimer?.cancel();
    if (_isHolding && mounted) {
      setState(() {
        _isHolding = false;
        _holdProgress = 0.0;
      });
    }
  }

  Future<void> _triggerSOS() async {

    if (_currentLat == null || _currentLng == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          content: const Row(
            children: [
              Icon(Icons.location_off_rounded, color: Colors.white),
              SizedBox(width: 12),
              Expanded(child: Text('GPS Signal required! Fetching location...')),
            ],
          ),
          backgroundColor: AppColors.warning,
        ),
      );
      _getCurrentLocation();
      return;
    }

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        child: Padding(
          padding: const EdgeInsets.all(28.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  shape: BoxShape.circle,
                ),
                child: const CircularProgressIndicator(color: AppColors.offline, strokeWidth: 3),
              ),
              const SizedBox(height: 20),
              const Text(
                'TRANSMITTING SOS',
                style: TextStyle(
                  fontWeight: FontWeight.w900,
                  fontSize: 16,
                  letterSpacing: 1.5,
                  color: AppColors.offline,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Connecting to Park Rangers & Emergency HQ...',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.textMuted, fontSize: 13),
              ),
            ],
          ),
        ),
      ),
    );

    final result = await ApiService.sendSOSAlert(
      lat: _currentLat!,
      lng: _currentLng!,
      emergencyType: _selectedAlertType,
    );

    if (!mounted) return;
    Navigator.pop(context);

    if (result['success']) {
      _showSuccessDialog();
      setState(() => _selectedAlertType = 'SOS');
    } else {
      // 🚨 Zero-signal Offline Handling: Save locally & open Off-Grid protocol
      await OfflineStorageService.saveOfflineEmergencyAlert(
        lat: _currentLat!,
        lng: _currentLng!,
        emergencyType: _selectedAlertType,
      );

      if (mounted) {
        _showOfflineSOSDialog();
      }
    }
  }

  Future<void> _sendDirectEmergencySms(String targetPhone) async {
    try {
      final smsBody = await OfflineStorageService.generateEmergencySmsBody(
        emergencyType: _selectedAlertType,
        lat: _currentLat ?? 6.5512,
        lng: _currentLng ?? 81.3654,
      );

      final cleanPhone = targetPhone.replaceAll(RegExp(r'[^\d+]'), '');
      final Uri smsUri = Uri(
        scheme: 'sms',
        path: cleanPhone,
        queryParameters: <String, String>{
          'body': smsBody,
        },
      );

      if (await canLaunchUrl(smsUri)) {
        await launchUrl(smsUri);
      } else {
        await launchUrl(smsUri, mode: LaunchMode.externalApplication);
      }
    } catch (e) {
      debugPrint('Error launching emergency SMS: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Could not open SMS app: $e'),
            backgroundColor: Colors.red.shade800,
          ),
        );
      }
    }
  }

  void _showOfflineSOSDialog() {
    final nearbyStations = _currentLat != null && _currentLng != null
        ? OfflineStorageService.getNearbyRangerStations(_currentLat!, _currentLng!)
        : <Map<String, dynamic>>[];

    final nearest = nearbyStations.isNotEmpty ? nearbyStations.first : null;
    final nearestStation = nearest != null ? nearest['station'] as RangerStation : null;
    final nearestDist = nearest != null ? (nearest['distanceKm'] as double).toStringAsFixed(1) : null;
    final nearestBearing = nearest != null ? nearest['bearing'] as String : null;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24.0),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 48,
                height: 5,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
            const SizedBox(height: 20),

            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.orange.shade50,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.orange.shade200),
                  ),
                  child: const Icon(
                    Icons.signal_cellular_connected_no_internet_4_bar_rounded,
                    color: Colors.deepOrange,
                    size: 28,
                  ),
                ),
                const SizedBox(width: 14),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'OFF-GRID EMERGENCY PROTOCOL',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.5,
                          color: AppColors.textDark,
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'No cellular internet in Yala Block 5. Alert saved locally on device!',
                        style: TextStyle(fontSize: 12, color: AppColors.textMuted),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 20),

            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.amber.shade50,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: Colors.amber.shade300),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.sms_failed_rounded, color: Colors.amber.shade900, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        'Instant 2G Low-Bandwidth SMS',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                          color: Colors.amber.shade900,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Even with 0 data bars, 2G SMS can punch through jungle canopy to Wildlife Ranger HQ with your satellite coordinates.',
                    style: TextStyle(fontSize: 12, color: AppColors.textDark, height: 1.3),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.deepOrange,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                elevation: 3,
              ),
              icon: const Icon(Icons.send_rounded, size: 20),
              label: const Text(
                'DISPATCH SOS VIA 2G SMS',
                style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14, letterSpacing: 0.5),
              ),
              onPressed: () {
                Navigator.pop(context);
                final targetNumber = nearestStation?.phoneNumber ?? '+94771234567';
                _sendDirectEmergencySms(targetNumber);
              },
            ),

            const SizedBox(height: 14),

            if (nearestStation != null) ...[
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.bgSand,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: AppColors.primary.withValues(alpha: 0.1)),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: const BoxDecoration(
                        color: AppColors.primary,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.shield_rounded, color: Colors.white, size: 20),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            nearestStation.name,
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '📍 $nearestDist km away (Heading $nearestBearing)',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.primary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.phone_in_talk_rounded, color: AppColors.online),
                      tooltip: 'Call Station',
                      onPressed: () {
                        Navigator.pop(context);
                        _makePhoneCall(nearestStation.phoneNumber);
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
            ],

            OutlinedButton(
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              onPressed: () => Navigator.pop(context),
              child: const Text('KEEP ALERT QUEUED IN DEVICE', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
            const SizedBox(height: 10),
          ],
        ),
      ),
    );
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: AppColors.offline,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.shield_rounded, color: Colors.white, size: 40),
            ),
            const SizedBox(height: 16),
            const Text(
              '🚨 ALERT DISPATCHED',
              style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: AppColors.offline),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Your $_selectedAlertType emergency signal has been broadcast with exact satellite coordinates to Park Rangers & HQ.',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 14, color: AppColors.textDark, height: 1.4),
            ),
            const SizedBox(height: 16),

            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.red.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.red.shade200),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.radar_rounded, color: AppColors.offline, size: 18),
                  const SizedBox(width: 8),
                  Text(
                    '${_currentLat!.toStringAsFixed(4)}° N, ${_currentLng!.toStringAsFixed(4)}° E',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.offline),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              minimumSize: const Size(double.infinity, 46),
            ),
            onPressed: () => Navigator.pop(context),
            child: const Text('OK, UNDERSTOOD', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Future<void> _makePhoneCall(String phoneNumber) async {

    final cleanNumber = phoneNumber.replaceAll(RegExp(r'[^\d+]'), '');
    final Uri launchUri = Uri(scheme: 'tel', path: cleanNumber);
    try {
      if (await canLaunchUrl(launchUri)) {
        await launchUrl(launchUri);
      } else {
        await launchUrl(launchUri, mode: LaunchMode.externalApplication);
      }
    } catch (e) {
      debugPrint("Error making phone call: $e");
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Could not open phone dialer for $phoneNumber'),
            backgroundColor: Colors.red.shade800,
          ),
        );
      }
    }
  }

  void _showHotlineDialog(String name, String number) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)),
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(color: AppColors.primaryExtraLight, shape: BoxShape.circle),
              child: const Icon(Icons.phone_in_talk_rounded, color: AppColors.primary, size: 36),
            ),
            const SizedBox(height: 16),
            Text(name, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: AppColors.textDark)),
            const SizedBox(height: 6),
            Text(number, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.primary)),
            const SizedBox(height: 24),
            Row(
              children: [

                Expanded(
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    icon: const Icon(Icons.copy_rounded, size: 18),
                    label: const Text('Copy Number'),
                    onPressed: () {
                      Clipboard.setData(ClipboardData(text: number));
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Phone number copied to clipboard!'), duration: Duration(seconds: 2)),
                      );
                    },
                  ),
                ),
                const SizedBox(width: 12),

                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      backgroundColor: AppColors.online,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    icon: const Icon(Icons.call_rounded, size: 18),
                    label: const Text('Call Now', style: TextStyle(fontWeight: FontWeight.bold)),
                    onPressed: () {
                      Navigator.pop(context);
                      _makePhoneCall(number);
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

  String _getCategoryTitle(String dbValue) {
    switch (dbValue) {
      case 'VEHICLE_BREAKDOWN':
        return 'VEHICLE BREAKDOWN';
      case 'HEALTH_EMERGENCY':
        return 'MEDICAL EMERGENCY';
      case 'WILDLIFE_DANGER':
        return 'WILDLIFE DANGER';
      case 'LOST_ROUTE':
        return 'LOST ROUTE';
      default:
        return 'GENERAL SOS';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgSand,

      appBar: AppBar(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 8,
              height: 8,
              decoration: const BoxDecoration(
                color: Colors.redAccent,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 8),
            const Text(
              'Emergency Dispatch',
              style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, letterSpacing: 0.5),
            ),
          ],
        ),
        actions: [

          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Refresh Location',
            onPressed: _getCurrentLocation,
          ),
        ],
      ),

      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [

            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.red.shade900, const Color(0xFF8B0000)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.red.shade900.withValues(alpha: 0.3),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.shield_outlined, color: Colors.white, size: 26),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          '24/7 PARK RANGER DISPATCH',
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.2,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          _selectedAlertType == 'SOS'
                              ? 'Press & hold SOS button for 1.5s'
                              : 'Ready to send: ${_getCategoryTitle(_selectedAlertType)}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),

                  if (_selectedAlertType != 'SOS')
                    GestureDetector(
                      onTap: () => setState(() => _selectedAlertType = 'SOS'),
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.close_rounded, color: Colors.white, size: 18),
                      ),
                    ),
                ],
              ),
            ),

            const SizedBox(height: 28),

            Center(
              child: GestureDetector(

                onTapDown: (_) => _startHold(),
                onTapUp: (_) => _cancelHold(),
                onTapCancel: _cancelHold,
                child: AnimatedBuilder(
                  animation: _pulseAnimation,
                  builder: (context, child) {
                    final scale = _isHolding ? 0.95 : _pulseAnimation.value;
                    return Transform.scale(
                      scale: scale,
                      child: Stack(
                        alignment: Alignment.center,
                        children: [

                          Container(
                            width: 230,
                            height: 230,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: AppColors.offline.withValues(alpha: 0.08),
                            ),
                          ),

                          Container(
                            width: 195,
                            height: 195,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: AppColors.offline.withValues(alpha: 0.15),
                            ),
                          ),

                          if (_isHolding)
                            SizedBox(
                              width: 176,
                              height: 176,
                              child: CircularProgressIndicator(
                                value: _holdProgress,
                                strokeWidth: 6,
                                valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                                backgroundColor: Colors.white30,
                              ),
                            ),

                          Container(
                            width: 160,
                            height: 160,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: AppGradients.pulseRedGradient,
                              boxShadow: AppShadows.emergencyPulseShadow,
                              border: Border.all(color: Colors.white.withValues(alpha: 0.4), width: 3),
                            ),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  _isHolding ? Icons.touch_app_rounded : Icons.campaign_rounded,
                                  color: Colors.white,
                                  size: 48,
                                ),
                                const SizedBox(height: 4),
                                const Text(
                                  'SOS',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 28,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 4,
                                  ),
                                ),
                                Text(
                                  _isHolding ? 'HOLDING...' : 'HOLD 1.5s',
                                  style: TextStyle(
                                    color: Colors.white.withValues(alpha: 0.85),
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 1.2,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ),

            const SizedBox(height: 20),

            Center(
              child: Column(
                children: [
                  Text(
                    _isHolding ? 'Release to cancel • Keep holding for SOS' : 'Press & Hold button to send alarm',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: _isHolding ? AppColors.offline : AppColors.textDark,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Instantly notifies Park Rangers, HQ & nearby safaris',
                    style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 28),

            Container(
              padding: const EdgeInsets.all(18),
              decoration: AppDecorations.premiumCard,
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(Icons.satellite_alt_rounded, color: AppColors.offline, size: 24),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Flexible(
                              child: Text(
                                'CURRENT COORDINATES',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontSize: 9,
                                  fontWeight: FontWeight.w900,
                                  color: AppColors.textLight,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ),

                            if (_currentLat != null)
                              Container(
                                margin: const EdgeInsets.only(left: 4),
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppColors.online.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.check_circle_rounded, color: AppColors.online, size: 10),
                                    SizedBox(width: 3),
                                    Text(
                                      'GPS LOCKED',
                                      style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: AppColors.online),
                                    ),
                                  ],
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 6),

                        _isLoadingLocation
                            ? const Row(
                                children: [
                                  SizedBox(
                                    height: 14,
                                    width: 14,
                                    child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.offline),
                                  ),
                                  SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      'Acquiring satellite signal...',
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(fontSize: 12, color: AppColors.textMuted),
                                    ),
                                  ),
                                ],
                              )
                            : Text(
                                _currentLat != null
                                    ? '${_currentLat!.toStringAsFixed(5)}° N, ${_currentLng!.toStringAsFixed(5)}° E'
                                    : 'Satellite signal unavailable',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.textDark,
                                ),
                              ),
                        if (_locationAccuracy > 0)
                          Padding(
                            padding: const EdgeInsets.only(top: 2.0),
                            child: Text(
                              'Accuracy: ±${_locationAccuracy.toStringAsFixed(1)}m',
                              style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                            ),
                          ),
                      ],
                    ),
                  ),

                  IconButton(
                    icon: const Icon(Icons.my_location_rounded, color: AppColors.primary),
                    tooltip: 'Update Position',
                    onPressed: _getCurrentLocation,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            const Text(
              'Select Specific Emergency Category',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w900,
                color: AppColors.textDark,
                letterSpacing: 0.3,
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'Tap a category below to specify your emergency type before triggering SOS',
              style: TextStyle(fontSize: 12, color: AppColors.textMuted),
            ),
            const SizedBox(height: 16),

            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              crossAxisSpacing: 14,
              mainAxisSpacing: 14,
              childAspectRatio: 1.15,
              children: [
                _buildEmergencyOption(
                  icon: Icons.car_repair_rounded,
                  title: 'Vehicle Breakdown',
                  subtitle: 'Engine/Tire/Mud stuck',
                  dbValue: 'VEHICLE_BREAKDOWN',
                ),
                _buildEmergencyOption(
                  icon: Icons.medical_services_rounded,
                  title: 'Medical Emergency',
                  subtitle: 'First aid / Injury',
                  dbValue: 'HEALTH_EMERGENCY',
                ),
                _buildEmergencyOption(
                  icon: Icons.warning_rounded,
                  title: 'Wildlife Danger',
                  subtitle: 'Elephant / Animal threat',
                  dbValue: 'WILDLIFE_DANGER',
                ),
                _buildEmergencyOption(
                  icon: Icons.wrong_location_rounded,
                  title: 'Lost / Stuck Route',
                  subtitle: 'Off-track / Signal lost',
                  dbValue: 'LOST_ROUTE',
                ),
              ],
            ),

            const SizedBox(height: 28),

            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.black.withValues(alpha: 0.05)),
                boxShadow: AppShadows.softCardShadow,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.headset_mic_rounded, color: AppColors.primary, size: 20),
                      SizedBox(width: 8),
                      Text(
                        'Direct Emergency Hotlines',
                        style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: AppColors.textDark),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  _buildHotlineTile(
                    title: 'Wildlife Department HQ',
                    phone: '1992',
                    icon: Icons.forest_rounded,
                  ),
                  const Divider(height: 16),

                  _buildHotlineTile(
                    title: 'Park Ranger Dispatch Office',
                    phone: '+94 77 123 4567',
                    icon: Icons.security_rounded,
                  ),
                  const Divider(height: 16),

                  _buildHotlineTile(
                    title: 'Tourist Hotline & Police',
                    phone: '1912',
                    icon: Icons.local_police_rounded,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            _buildOfflineSafeHavensSection(),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildOfflineSafeHavensSection() {
    final lat = _currentLat ?? 6.5512;
    final lng = _currentLng ?? 81.3654;
    final nearby = OfflineStorageService.getNearbyRangerStations(lat, lng);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.black.withValues(alpha: 0.05)),
        boxShadow: AppShadows.softCardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: AppColors.primaryExtraLight,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.shield_outlined, color: AppColors.primary, size: 20),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Yala Block 5 Ranger Posts',
                      style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: AppColors.textDark),
                    ),
                    Text(
                      'Offline Safe Havens & Ranger Patrol Units',
                      style: TextStyle(fontSize: 11, color: AppColors.textMuted),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.green.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.green.shade200),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.satellite_alt_rounded, color: Colors.green.shade800, size: 12),
                    const SizedBox(width: 4),
                    Text(
                      'GPS Offline',
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.green.shade800),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          ...nearby.map((item) {
            final station = item['station'] as RangerStation;
            final dist = (item['distanceKm'] as double).toStringAsFixed(1);
            final bearing = item['bearing'] as String;

            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.bgSand,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.primary.withValues(alpha: 0.06)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Center(
                      child: Text(
                        bearing,
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          station.name,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textDark),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '📍 $dist km away • ${station.emergencyChannel}',
                          style: TextStyle(fontSize: 11, color: Colors.grey.shade700, fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.sms_outlined, color: Colors.deepOrange, size: 20),
                    tooltip: 'Send 2G SMS',
                    onPressed: () => _sendDirectEmergencySms(station.phoneNumber),
                  ),
                  IconButton(
                    icon: const Icon(Icons.phone_in_talk_rounded, color: AppColors.online, size: 20),
                    tooltip: 'Call Station',
                    onPressed: () => _makePhoneCall(station.phoneNumber),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildEmergencyOption({
    required IconData icon,
    required String title,
    required String subtitle,
    required String dbValue,
  }) {
    final isSelected = _selectedAlertType == dbValue;

    return InkWell(
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() {

          _selectedAlertType = isSelected ? 'SOS' : dbValue;
        });
      },
      borderRadius: BorderRadius.circular(20),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isSelected ? Colors.red.shade50.withValues(alpha: 0.7) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.offline : Colors.black.withValues(alpha: 0.06),
            width: isSelected ? 2.5 : 1,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: AppColors.offline.withValues(alpha: 0.2),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  )
                ]
              : AppShadows.softCardShadow,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.offline : Colors.red.shade50,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    icon,
                    color: isSelected ? Colors.white : AppColors.offline,
                    size: 22,
                  ),
                ),

                if (isSelected)
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: AppColors.offline,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.check, color: Colors.white, size: 12),
                  ),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 13,
                    color: isSelected ? Colors.red.shade900 : AppColors.textDark,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 10,
                    color: isSelected ? Colors.red.shade800 : AppColors.textMuted,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHotlineTile({
    required String title,
    required String phone,
    required IconData icon,
  }) {
    return InkWell(
      onTap: () => _showHotlineDialog(title, phone),
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4.0, horizontal: 2.0),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.primaryExtraLight,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: AppColors.primary, size: 18),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textDark),
                  ),
                  Text(
                    phone,
                    style: const TextStyle(fontSize: 12, color: AppColors.textMuted, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),

            InkWell(
              onTap: () => _makePhoneCall(phone),
              borderRadius: BorderRadius.circular(8),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.phone_rounded, color: AppColors.primary, size: 14),
                    SizedBox(width: 4),
                    Text(
                      'Call',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primary),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
