import 'dart:async';

import 'package:flutter/material.dart';

import 'package:onesignal_flutter/onesignal_flutter.dart';

import '../services/api_service.dart';

import 'chat_detail_screen.dart';

import '../widgets/theme_constants.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {

  List<dynamic> _activeBookings = [];

  List<dynamic> _filteredBookings = [];

  bool _isLoading = true;

  Timer? _pollingTimer;

  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();

    _loadChats();

    OneSignal.Notifications.addForegroundWillDisplayListener((event) {
      _loadChats();
    });

    _pollingTimer = Timer.periodic(const Duration(seconds: 5), (timer) {
      _loadChats();
    });
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadChats() async {

    final result = await ApiService.getDriverBookings();

    if (result['success']) {
      if (mounted) {
        setState(() {

          _activeBookings = (result['data'] as List)
              .where((b) => b['status'] != 'REJECTED' && b['status'] != 'CANCELLED')
              .toList();

          _filterChats(_searchController.text);
          _isLoading = false;
        });
      }
    }
  }

  void _filterChats(String query) {
    if (query.trim().isEmpty) {
      _filteredBookings = _activeBookings;
    } else {
      _filteredBookings = _activeBookings.where((b) {
        final name = (b['tourist_name'] ?? '').toString().toLowerCase();
        final status = (b['status'] ?? '').toString().toLowerCase();
        final q = query.toLowerCase();

        return name.contains(q) || status.contains(q);
      }).toList();
    }
  }

  int get _totalUnreadCount {
    int count = 0;
    for (var b in _activeBookings) {
      if (b['unread_count'] != null) {
        count += (b['unread_count'] as num).toInt();
      }
    }
    return count;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgSand,
      body: Column(
        children: [

          Container(
            width: double.infinity,
            color: AppColors.primary,
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                child: Column(
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
                              child: const Icon(
                                Icons.chat_bubble_rounded,
                                color: AppColors.accent,
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 10),
                            const Text(
                              'Messages',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 20,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ],
                        ),

                        if (_totalUnreadCount > 0)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.accent,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.mark_chat_unread_rounded, size: 12, color: AppColors.textDark),
                                const SizedBox(width: 4),
                                Text(
                                  '$_totalUnreadCount New',
                                  style: const TextStyle(
                                    color: AppColors.textDark,
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),

          Expanded(
            child: _isLoading

                ? const Center(child: CircularProgressIndicator(color: AppColors.primary))

                : _filteredBookings.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(20),
                              decoration: const BoxDecoration(
                                color: AppColors.primaryExtraLight,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.forum_outlined, size: 48, color: AppColors.primary),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              _searchController.text.isNotEmpty ? 'No conversations found' : 'No active tourist messages',
                              style: const TextStyle(color: AppColors.textDark, fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 6),
                            const Text(
                              'Direct messages from confirmed tourists will appear here.',
                              style: TextStyle(color: AppColors.textMuted, fontSize: 13),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      )

                    : RefreshIndicator(
                        onRefresh: _loadChats,
                        color: AppColors.primary,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _filteredBookings.length,
                          itemBuilder: (context, index) {
                            final booking = _filteredBookings[index];
                            final touristName = booking['tourist_name'] ?? 'Tourist Booking';

                            final hasUnread = booking['unread_count'] != null && booking['unread_count'] > 0;

                            return Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(20),
                                boxShadow: AppShadows.softCardShadow,
                              ),
                              child: Material(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(20),
                                clipBehavior: Clip.antiAlias,
                                child: Container(
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(

                                      color: hasUnread ? AppColors.primary.withValues(alpha: 0.3) : Colors.black.withValues(alpha: 0.03),
                                      width: hasUnread ? 1.5 : 1.0,
                                    ),
                                  ),
                                  child: ListTile(
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),

                                    onTap: () async {

                                      await ApiService.markMessagesAsRead(booking['id'].toString());

                                      if (!context.mounted) return;

                                      await Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (context) => ChatDetailScreen(
                                            bookingId: booking['id'].toString(),
                                            touristName: touristName,
                                          ),
                                        ),
                                      ).then((_) => _loadChats());
                                    },

                                    leading: Stack(
                                      children: [
                                        CircleAvatar(
                                          radius: 26,
                                          backgroundColor: AppColors.primaryExtraLight,
                                          child: Text(
                                            touristName.isNotEmpty ? touristName[0].toUpperCase() : 'T',
                                            style: const TextStyle(
                                              color: AppColors.primary,
                                              fontWeight: FontWeight.w900,
                                              fontSize: 18,
                                            ),
                                          ),
                                        ),

                                        Positioned(
                                          right: 0,
                                          bottom: 0,
                                          child: Container(
                                            width: 12,
                                            height: 12,
                                            decoration: BoxDecoration(
                                              color: AppColors.online,
                                              shape: BoxShape.circle,
                                              border: Border.all(color: Colors.white, width: 2),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),

                                    title: Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Expanded(
                                          child: Text(
                                            touristName,
                                            style: const TextStyle(
                                              fontWeight: FontWeight.w900,
                                              fontSize: 15,
                                              color: AppColors.textDark,
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),

                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: booking['status'] == 'CONFIRMED' ? Colors.green.shade50 : Colors.orange.shade50,
                                            borderRadius: BorderRadius.circular(12),
                                          ),
                                          child: Text(
                                            booking['status'] ?? 'ACTIVE',
                                            style: TextStyle(
                                              fontSize: 10,
                                              fontWeight: FontWeight.bold,
                                              color: booking['status'] == 'CONFIRMED' ? AppColors.online : AppColors.warning,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),

                                    subtitle: Padding(
                                      padding: const EdgeInsets.only(top: 6.0),
                                      child: Row(
                                        children: [
                                          const Icon(Icons.calendar_today_rounded, size: 12, color: AppColors.textMuted),
                                          const SizedBox(width: 4),
                                          Text(
                                            'Safari: ${booking['booking_date'] ?? 'Upcoming'}',
                                            style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                                          ),
                                        ],
                                      ),
                                    ),

                                    trailing: Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      crossAxisAlignment: CrossAxisAlignment.end,
                                      children: [
                                        if (hasUnread)

                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                            decoration: BoxDecoration(
                                              gradient: AppGradients.primaryGradient,
                                              borderRadius: BorderRadius.circular(12),
                                              boxShadow: [
                                                BoxShadow(
                                                  color: AppColors.primary.withValues(alpha: 0.3),
                                                  blurRadius: 6,
                                                )
                                              ],
                                            ),
                                            child: Text(
                                              '${booking['unread_count']} New',
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontSize: 11,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          )
                                        else

                                          const Icon(
                                            Icons.arrow_forward_ios_rounded,
                                            size: 14,
                                            color: AppColors.textLight,
                                          ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}
