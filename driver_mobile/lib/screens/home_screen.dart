import 'package:flutter/material.dart';

import 'package:shared_preferences/shared_preferences.dart';

import '../services/api_service.dart';

import 'profile_screen.dart';
import 'chat_screen.dart';
import 'safari_map_screen.dart';
import 'emergency_screen.dart';
import 'history_screen.dart';

import '../widgets/theme_constants.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {

  int _selectedIndex = 0;

  bool _isOnline = true;

  String _driverName = 'Driver';

  List<dynamic> _bookings = [];

  bool _isLoading = true;

  String? _errorMessage;

  String _revenue = '0';

  String _totalSafaris = '0';

  String _formatCurrency(String amount) {
    try {
      final value = int.parse(amount);
      final RegExp reg = RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))');
      return value.toString().replaceAllMapped(reg, (Match m) => '${m[1]},');
    } catch (e) {
      return amount;
    }
  }

  @override
  void initState() {
    super.initState();

    _loadDriverName();

    _fetchBookings();
  }

  Future<void> _loadDriverName() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _driverName = prefs.getString('user_name') ?? prefs.getString('full_name') ?? 'Driver';
      _revenue = prefs.getString('user_revenue') ?? '0';
      _totalSafaris = prefs.getString('user_total_trips') ?? '0';
      _isOnline = prefs.getBool('user_is_online') ?? true;
    });
  }

  Future<void> _fetchBookings() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final bookingsResult = await ApiService.getDriverBookings();
    final profileResult = await ApiService.getDriverProfile();

    if (!mounted) return;

    setState(() {

      if (bookingsResult['success']) {
        final List<dynamic> allBookings = bookingsResult['data'] ?? [];
        _bookings = allBookings.where((b) {
          final status = b['status']?.toString().toUpperCase();
          return status == 'PENDING' || status == 'CONFIRMED';
        }).toList();
      } else {
        _errorMessage = bookingsResult['error'];
      }

      if (profileResult['success'] == true) {
        final profile = profileResult['data'];
        _revenue = (profile['revenue'] ?? 0).toString();
        _totalSafaris = (profile['totalSafaris'] ?? 0).toString();
        _driverName = profile['name'] ?? _driverName;
        _isOnline = profile['isActive'] ?? true;

        SharedPreferences.getInstance().then((prefs) {
          prefs.setString('user_name', _driverName);
          prefs.setString('user_revenue', _revenue);
          prefs.setString('user_total_trips', _totalSafaris);
          prefs.setBool('user_is_online', _isOnline);
        });
      }
      _isLoading = false;
    });
  }

  Future<void> _changeStatus(String bookingId, String newStatus) async {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Updating status...'), duration: Duration(seconds: 1)),
    );

    final result = await ApiService.updateBookingStatus(bookingId, newStatus);

    if (!mounted) return;

    if (result['success']) {

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['data']['message'] ?? 'Updated!'),
          backgroundColor: AppColors.online,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );

      _fetchBookings();
    } else {

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['error'] ?? 'Status update failed'),
          backgroundColor: AppColors.offline,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    }
  }

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  Widget _buildQuickActionItem(IconData icon, String title, Color color, VoidCallback onTap) {
    return Expanded(
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          boxShadow: AppShadows.softCardShadow,
        ),
        child: Material(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(20),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.black.withValues(alpha: 0.04)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(icon, color: color, size: 24),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    title,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                      color: AppColors.textDark,
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDashboard() {

    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    }

    return Column(
      children: [

        Container(
          width: double.infinity,
          color: AppColors.primary,
          child: SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [

                  Row(
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(10),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.15),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(6),
                          child: Image.asset(
                            'assets/logo.png',
                            fit: BoxFit.contain,
                            errorBuilder: (context, error, stackTrace) => const Icon(
                              Icons.directions_car_rounded,
                              color: AppColors.primary,
                              size: 20,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      const Text(
                        'GuideLanka',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),

                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(30),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [

                        Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: _isOnline ? AppColors.online : Colors.red.shade300,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: (_isOnline ? AppColors.online : Colors.red).withValues(alpha: 0.6),
                                blurRadius: 6,
                                spreadRadius: 1,
                              )
                            ],
                          ),
                        ),
                        const SizedBox(width: 6),

                        Text(
                          _isOnline ? 'ONLINE' : 'OFFLINE',
                          style: TextStyle(
                            color: _isOnline ? Colors.white : Colors.red.shade200,
                            fontWeight: FontWeight.bold,
                            fontSize: 11,
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(width: 4),

                        SizedBox(
                          height: 28,
                          child: FittedBox(
                            child: Switch(
                              value: _isOnline,
                              activeThumbColor: Colors.white,
                              activeTrackColor: AppColors.online,
                              inactiveThumbColor: Colors.white,
                              inactiveTrackColor: Colors.grey.shade600,
                              onChanged: (value) async {
                                setState(() {
                                  _isOnline = value;
                                });

                                final prefs = await SharedPreferences.getInstance();
                                await prefs.setBool('user_is_online', value);

                                final result = await ApiService.updateDriverStatus(value);
                                if (!result['success']) {
                                  if (!mounted) return;
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(result['error'] ?? 'Failed to update status'),
                                      backgroundColor: Colors.red,
                                    ),
                                  );

                                  setState(() {
                                    _isOnline = !value;
                                  });
                                  await prefs.setBool('user_is_online', !value);
                                }
                              },
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),

        Expanded(
          child: RefreshIndicator(
            onRefresh: _fetchBookings,
            color: AppColors.primary,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [

                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.only(top: 16, left: 24, right: 24, bottom: 28),
                    decoration: const BoxDecoration(
                      color: AppColors.primary,
                      boxShadow: [
                        BoxShadow(
                          color: Color(0x1F0F4C3A),
                          blurRadius: 20,
                          offset: Offset(0, 10),
                        )
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [

                        Row(
                          children: [
                            CircleAvatar(
                              radius: 22,
                              backgroundColor: Colors.white.withValues(alpha: 0.2),
                              child: Text(
                                _driverName.isNotEmpty ? _driverName[0].toUpperCase() : 'D',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 18,
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Welcome back,',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.white.withValues(alpha: 0.8),
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                Text(
                                  _driverName,
                                  style: const TextStyle(
                                    fontSize: 22,
                                    fontWeight: FontWeight.w900,
                                    color: Colors.white,
                                    letterSpacing: 0.2,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),

                        Row(
                          children: [

                            Expanded(
                              child: Container(
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: const [
                                        Icon(Icons.account_balance_wallet_outlined, size: 14, color: AppColors.accent),
                                        SizedBox(width: 4),
                                        Text(
                                          'TOTAL REVENUE',
                                          style: TextStyle(
                                            color: AppColors.accentLight,
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                            letterSpacing: 0.5,
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 6),
                                    FittedBox(
                                      fit: BoxFit.scaleDown,
                                      child: Text(
                                        'LKR ${_formatCurrency(_revenue)}',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 18,
                                          fontWeight: FontWeight.w900,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),

                            Expanded(
                              child: InkWell(
                                onTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(builder: (context) => const HistoryScreen()),
                                  ).then((_) => _fetchBookings());
                                },
                                borderRadius: BorderRadius.circular(20),
                                child: Container(
                                  padding: const EdgeInsets.all(14),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.12),
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Row(
                                            children: const [
                                              Icon(Icons.task_alt_rounded, size: 14, color: AppColors.accentLight),
                                              SizedBox(width: 4),
                                              Text(
                                                'COMPLETED',
                                                style: TextStyle(
                                                  color: AppColors.accentLight,
                                                  fontSize: 10,
                                                  fontWeight: FontWeight.bold,
                                                  letterSpacing: 0.5,
                                                ),
                                              ),
                                            ],
                                          ),
                                          Icon(
                                            Icons.arrow_forward_ios_rounded,
                                            size: 10,
                                            color: Colors.white.withValues(alpha: 0.7),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        '$_totalSafaris Safaris',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 18,
                                          fontWeight: FontWeight.w900,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 20.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [

                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Scheduled Safaris',
                              style: TextStyle(
                                fontSize: 17,
                                fontWeight: FontWeight.w900,
                                color: AppColors.textDark,
                                letterSpacing: 0.2,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.primaryExtraLight,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                '${_bookings.length} Active',
                                style: const TextStyle(
                                  color: AppColors.primary,
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),

                        if (_errorMessage != null)
                          Container(
                            margin: const EdgeInsets.only(bottom: 16),
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: Colors.red.shade50,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: Colors.red.shade200),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.error_outline_rounded, color: Colors.red, size: 20),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    _errorMessage!,
                                    style: const TextStyle(color: Colors.red, fontSize: 13),
                                  ),
                                ),
                              ],
                            ),
                          ),

                        if (_bookings.isEmpty && _errorMessage == null)
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 20),
                            decoration: AppDecorations.premiumCard,
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(20),
                                  decoration: const BoxDecoration(
                                    color: AppColors.primaryExtraLight,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.terrain_rounded,
                                    size: 48,
                                    color: AppColors.primary,
                                  ),
                                ),
                                const SizedBox(height: 16),
                                const Text(
                                  "No active safaris scheduled",
                                  style: TextStyle(
                                    color: AppColors.textDark,
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                const Text(
                                  "Newly assigned tourist safari bookings will appear here.",
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    color: AppColors.textMuted,
                                    fontSize: 13,
                                  ),
                                ),
                              ],
                            ),
                          ),

                        ..._bookings.map((booking) {

                          Color statusColor = AppColors.info;
                          Color statusBg = Colors.blue.shade50;
                          if (booking['status'] == 'CONFIRMED') {
                            statusColor = AppColors.online;
                            statusBg = Colors.green.shade50;
                          } else if (booking['status'] == 'REJECTED' || booking['status'] == 'CANCELLED') {
                            statusColor = AppColors.offline;
                            statusBg = Colors.red.shade50;
                          }

                          String dateStr = booking['booking_date'] ?? 'Today';

                          return Padding(
                            padding: const EdgeInsets.only(bottom: 16.0),
                            child: Container(
                              decoration: AppDecorations.premiumCard,
                              child: Padding(
                                padding: const EdgeInsets.all(18.0),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [

                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                          decoration: BoxDecoration(
                                            color: statusBg,
                                            borderRadius: BorderRadius.circular(20),
                                          ),
                                          child: Row(
                                            children: [
                                              Container(
                                                width: 6,
                                                height: 6,
                                                decoration: BoxDecoration(
                                                  color: statusColor,
                                                  shape: BoxShape.circle,
                                                ),
                                              ),
                                              const SizedBox(width: 6),
                                              Text(
                                                booking['status'] ?? 'PENDING',
                                                style: TextStyle(
                                                  color: statusColor,
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 11,
                                                  letterSpacing: 0.5,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        Row(
                                          children: [
                                            const Icon(Icons.calendar_today_rounded, size: 13, color: AppColors.textMuted),
                                            const SizedBox(width: 4),
                                            Text(
                                              dateStr,
                                              style: const TextStyle(
                                                fontWeight: FontWeight.bold,
                                                fontSize: 12,
                                                color: AppColors.textDark,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                    const Divider(height: 24, thickness: 0.8),

                                    Row(
                                      children: [
                                        const CircleAvatar(
                                          radius: 22,
                                          backgroundColor: AppColors.primaryExtraLight,
                                          child: Icon(Icons.person_rounded, color: AppColors.primary, size: 24),
                                        ),
                                        const SizedBox(width: 14),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              const Text(
                                                'Tourist Safari Booking',
                                                style: TextStyle(
                                                  fontSize: 15,
                                                  fontWeight: FontWeight.bold,
                                                  color: AppColors.textDark,
                                                ),
                                              ),
                                              const SizedBox(height: 4),
                                              Row(
                                                children: const [
                                                  Icon(Icons.location_on_outlined, size: 14, color: AppColors.primaryLight),
                                                  SizedBox(width: 4),
                                                  Text(
                                                    'Pickup: Park Entrance Gate 1',
                                                    style: TextStyle(
                                                      color: AppColors.textMuted,
                                                      fontSize: 12,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 18),

                                    if (booking['status'] == 'PENDING')
                                      Row(
                                        children: [
                                          Expanded(
                                            child: OutlinedButton(
                                              onPressed: () => _changeStatus(booking['id'].toString(), 'REJECTED'),
                                              style: OutlinedButton.styleFrom(
                                                foregroundColor: AppColors.offline,
                                                side: const BorderSide(color: AppColors.offline),
                                                padding: const EdgeInsets.symmetric(vertical: 12),
                                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                              ),
                                              child: const Text('Reject', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                                            ),
                                          ),
                                          const SizedBox(width: 12),
                                          Expanded(
                                            child: Container(
                                              decoration: BoxDecoration(
                                                gradient: AppGradients.primaryGradient,
                                                borderRadius: BorderRadius.circular(12),
                                              ),
                                              child: ElevatedButton(
                                                onPressed: () => _changeStatus(booking['id'].toString(), 'CONFIRMED'),
                                                style: ElevatedButton.styleFrom(
                                                  backgroundColor: Colors.transparent,
                                                  shadowColor: Colors.transparent,
                                                  foregroundColor: Colors.white,
                                                  padding: const EdgeInsets.symmetric(vertical: 12),
                                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                                ),
                                                child: const Text('Accept', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                                              ),
                                            ),
                                          ),
                                        ],
                                      )

                                    else if (booking['status'] == 'CONFIRMED')
                                      Row(
                                        children: [

                                          Expanded(
                                            child: Container(
                                              decoration: BoxDecoration(
                                                gradient: const LinearGradient(
                                                  colors: [AppColors.info, Color(0xFF1E3C72)],
                                                ),
                                                borderRadius: BorderRadius.circular(12),
                                              ),
                                              child: ElevatedButton.icon(
                                                onPressed: () {
                                                  setState(() {
                                                    _selectedIndex = 1;
                                                  });
                                                },
                                                icon: const Icon(Icons.directions_car_rounded, color: Colors.white, size: 18),
                                                label: const Text('Start Safari', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white)),
                                                style: ElevatedButton.styleFrom(
                                                  backgroundColor: Colors.transparent,
                                                  shadowColor: Colors.transparent,
                                                  padding: const EdgeInsets.symmetric(vertical: 12),
                                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                                ),
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 10),

                                          Expanded(
                                            child: OutlinedButton.icon(
                                              onPressed: () => _changeStatus(booking['id'].toString(), 'COMPLETED'),
                                              style: OutlinedButton.styleFrom(
                                                foregroundColor: AppColors.online,
                                                side: const BorderSide(color: AppColors.online),
                                                padding: const EdgeInsets.symmetric(vertical: 12),
                                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                              ),
                                              icon: const Icon(Icons.check_circle_outline_rounded, color: AppColors.online, size: 18),
                                              label: const Text('Finish Safari', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.online)),
                                            ),
                                          ),
                                        ],
                                      ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        }),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgSand,

      body: IndexedStack(
        index: _selectedIndex,
        children: [
          _buildDashboard(),
          const SafariMapScreen(),
          const ChatScreen(),
          const EmergencyScreen(),
          const ProfileScreen(),
        ],
      ),

      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 16,
              offset: const Offset(0, -4),
            )
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _selectedIndex,
          onTap: _onItemTapped,
          selectedItemColor: AppColors.primary,
          unselectedItemColor: AppColors.textLight,
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
          unselectedLabelStyle: const TextStyle(fontSize: 11),
          showUnselectedLabels: true,
          type: BottomNavigationBarType.fixed,
          backgroundColor: Colors.white,
          elevation: 0,
          items: [

            const BottomNavigationBarItem(
              icon: Icon(Icons.dashboard_outlined),
              activeIcon: Icon(Icons.dashboard_rounded),
              label: 'Home'
            ),

            const BottomNavigationBarItem(
              icon: Icon(Icons.map_outlined),
              activeIcon: Icon(Icons.map_rounded),
              label: 'Map'
            ),

            const BottomNavigationBarItem(
              icon: Icon(Icons.chat_bubble_outline_rounded),
              activeIcon: Icon(Icons.chat_bubble_rounded),
              label: 'Chat'
            ),

            BottomNavigationBarItem(
              icon: Icon(
                Icons.campaign_outlined,
                color: _selectedIndex == 3 ? AppColors.primary : AppColors.offline
              ),
              activeIcon: const Icon(Icons.campaign_rounded, color: AppColors.primary),
              label: 'SOS'
            ),

            const BottomNavigationBarItem(
              icon: Icon(Icons.person_outline_rounded),
              activeIcon: Icon(Icons.person_rounded),
              label: 'Profile'
            ),
          ],
        ),
      ),
    );
  }
}
