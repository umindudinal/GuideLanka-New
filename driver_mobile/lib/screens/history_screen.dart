import 'package:flutter/material.dart';

import '../services/api_service.dart';

import '../widgets/theme_constants.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {

  List<dynamic> _historyBookings = [];

  bool _isLoading = true;

  String? _errorMessage;

  int _completedCount = 0;

  int _totalRevenue = 0;

  @override
  void initState() {
    super.initState();

    _fetchHistory();
  }

  String _formatCurrency(int amount) {
    try {
      final RegExp reg = RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))');
      return amount.toString().replaceAllMapped(reg, (Match m) => '${m[1]},');
    } catch (e) {
      return amount.toString();
    }
  }

  Future<void> _fetchHistory() async {
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

        _historyBookings = allBookings.where((b) {
          final status = b['status']?.toString().toUpperCase();
          return status == 'COMPLETED' || status == 'CANCELLED' || status == 'REJECTED';
        }).toList();
      } else {
        _errorMessage = bookingsResult['error'];
      }

      if (profileResult['success'] == true) {
        final profile = profileResult['data'];
        _totalRevenue = profile['revenue'] ?? 0;
        _completedCount = profile['totalSafaris'] ?? 0;
      } else {

        _completedCount = _historyBookings.where((b) => b['status']?.toString().toUpperCase() == 'COMPLETED').length;
        _totalRevenue = _completedCount * 12500;
      }

      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgSand,

      appBar: AppBar(
        title: const Text('Safari Trip History'),
        backgroundColor: AppColors.primary,
        elevation: 0,
      ),

      body: _isLoading

          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))

          : RefreshIndicator(
              onRefresh: _fetchHistory,
              color: AppColors.primary,
              child: CustomScrollView(
                slivers: [

                  SliverToBoxAdapter(
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(24),
                      decoration: const BoxDecoration(
                        gradient: AppGradients.primaryGradient,
                        borderRadius: BorderRadius.only(
                          bottomLeft: Radius.circular(28),
                          bottomRight: Radius.circular(28),
                        ),
                      ),
                      child: Column(
                        children: [
                          const Text(
                            'Your Lifetime Earnings',
                            style: TextStyle(
                              color: AppColors.accentLight,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.8,
                            ),
                          ),
                          const SizedBox(height: 8),

                          Text(
                            'LKR ${_formatCurrency(_totalRevenue)}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 28,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          const SizedBox(height: 16),

                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  '$_completedCount Completed Trips',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),

                  SliverPadding(
                    padding: const EdgeInsets.all(20),
                    sliver: _errorMessage != null

                        ? SliverToBoxAdapter(
                            child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.red.shade50,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: Colors.red.shade200),
                              ),
                              child: Text(_errorMessage!, style: const TextStyle(color: Colors.red)),
                            ),
                          )

                        : _historyBookings.isEmpty
                            ? SliverFillRemaining(
                                hasScrollBody: false,
                                child: Center(
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.history_toggle_off_outlined, size: 64, color: Colors.grey.shade400),
                                      const SizedBox(height: 16),
                                      Text(
                                        "No past trips found.",
                                        style: TextStyle(
                                          color: Colors.grey.shade600,
                                          fontSize: 16,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              )

                            : SliverList(
                                delegate: SliverChildBuilderDelegate(
                                  (context, index) {
                                    final booking = _historyBookings[index];
                                    final status = booking['status']?.toString().toUpperCase() ?? 'UNKNOWN';

                                    Color statusColor = AppColors.info;
                                    Color statusBg = Colors.blue.shade50;
                                    if (status == 'COMPLETED') {
                                      statusColor = AppColors.online;
                                      statusBg = Colors.green.shade50;
                                    } else if (status == 'REJECTED' || status == 'CANCELLED') {
                                      statusColor = AppColors.offline;
                                      statusBg = Colors.red.shade50;
                                    }

                                    final dateStr = booking['booking_date'] ?? 'No Date';

                                    return Padding(
                                      padding: const EdgeInsets.only(bottom: 16.0),
                                      child: Container(
                                        decoration: AppDecorations.premiumCard,
                                        child: Padding(
                                          padding: const EdgeInsets.all(20.0),
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [

                                              Row(
                                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                children: [
                                                  Container(
                                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                                    decoration: BoxDecoration(
                                                      color: statusBg,
                                                      borderRadius: BorderRadius.circular(20),
                                                    ),
                                                    child: Text(
                                                      status,
                                                      style: TextStyle(
                                                        color: statusColor,
                                                        fontWeight: FontWeight.bold,
                                                        fontSize: 10,
                                                      ),
                                                    ),
                                                  ),
                                                  Text(
                                                    dateStr,
                                                    style: const TextStyle(
                                                      fontWeight: FontWeight.bold,
                                                      color: AppColors.textDark,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                              const Divider(height: 24, thickness: 0.8),

                                              Row(
                                                children: [
                                                  CircleAvatar(
                                                    radius: 20,
                                                    backgroundColor: AppColors.primaryExtraLight,
                                                    child: const Icon(Icons.person_outline, color: AppColors.primary, size: 18),
                                                  ),
                                                  const SizedBox(width: 12),
                                                  Expanded(
                                                    child: Column(
                                                      crossAxisAlignment: CrossAxisAlignment.start,
                                                      children: [

                                                        Text(
                                                          booking['tourist'] != null && booking['tourist']['full_name'] != null
                                                              ? booking['tourist']['full_name'].toString()
                                                              : 'Tourist Safari Group',
                                                          style: const TextStyle(
                                                            fontSize: 15,
                                                            fontWeight: FontWeight.bold,
                                                            color: AppColors.textDark,
                                                          ),
                                                        ),
                                                        const SizedBox(height: 2),

                                                        Text(
                                                          'Slot: ${booking['time_slot']?.toString().split('|')[0] ?? 'N/A'}',
                                                          style: const TextStyle(
                                                            color: AppColors.textMuted,
                                                            fontSize: 12,
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
                                    );
                                  },
                                  childCount: _historyBookings.length,
                                ),
                              ),
                  ),
                ],
              ),
            ),
    );
  }
}
