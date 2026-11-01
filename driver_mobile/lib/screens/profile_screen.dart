import 'dart:convert';

import 'package:flutter/material.dart';

import 'package:flutter/services.dart';

import 'package:shared_preferences/shared_preferences.dart';

import 'package:image_picker/image_picker.dart';

import 'login_screen.dart';

import '../services/api_service.dart';

import 'help_support_screen.dart';
import 'history_screen.dart';

import '../widgets/theme_constants.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {

  String _driverName = "Loading...";

  String _driverEmail = "Loading...";

  String _vehicleId = "Loading...";

  String _mobileNumber = "Loading...";

  String _licenseNo = "Loading...";

  int _pricePerSafari = 9500;

  int _experienceYears = 5;

  String _experienceDesc = "";

  String? _profileImageBase64;

  String? _avatarUrl;

  String _rating = "4.8";

  String _totalTrips = "0";

  String _revenue = "0";

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

    _loadProfileData();
  }

  Future<void> _loadProfileData() async {

    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _driverName = prefs.getString('user_name') ?? "Unknown Driver";
      _driverEmail = prefs.getString('user_email') ?? "No Email";
      _profileImageBase64 = prefs.getString('profile_image_base64');
      _totalTrips = prefs.getString('user_total_trips') ?? "0";
      _rating = prefs.getString('user_rating') ?? "4.8";
      _revenue = prefs.getString('user_revenue') ?? "0";
      _experienceYears = prefs.getInt('user_experience_years') ?? 5;
      _experienceDesc = prefs.getString('user_experience_desc') ?? "";
    });

    final result = await ApiService.getDriverProfile();
    if (result['success'] == true) {
      final profile = result['data'];
      setState(() {
        _driverName = profile['name'] ?? _driverName;
        _mobileNumber = profile['mobile'] ?? "Not Updated";
        _licenseNo = profile['licenseNo'] ?? "Not Updated";
        _vehicleId = profile['vehicleNo'] ?? "Not Updated";
        try {
          _pricePerSafari = int.parse(profile['pricePerSafari'].toString());
        } catch (e) {
          _pricePerSafari = 9500;
        }
        try {
          _experienceYears = int.parse(profile['experienceYears'].toString());
        } catch (e) {
          _experienceYears = 5;
        }
        _experienceDesc = profile['experience'] ?? "";
        _avatarUrl = profile['avatarUrl'];
        _totalTrips = (profile['totalSafaris'] ?? 0).toString();
        _rating = (profile['rating'] ?? 4.8).toString();
        _revenue = (profile['revenue'] ?? 0).toString();
      });

      await prefs.setString('user_name', _driverName);
      await prefs.setString('user_total_trips', _totalTrips);
      await prefs.setString('user_rating', _rating);
      await prefs.setString('user_revenue', _revenue);
      await prefs.setInt('user_experience_years', _experienceYears);
      await prefs.setString('user_experience_desc', _experienceDesc);
    }
  }

  Future<void> _pickProfileImage() async {
    try {
      final ImagePicker picker = ImagePicker();

      final XFile? image = await picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 512,
        maxHeight: 512,
        imageQuality: 80,
      );

      if (image == null) return;

      final bytes = await image.readAsBytes();
      final base64String = base64Encode(bytes);

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('profile_image_base64', base64String);

      setState(() {
        _profileImageBase64 = base64String;
      });

      if (!mounted) return;

      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );

      final uploadResult = await ApiService.uploadProfilePicture(base64String);

      if (!mounted) return;
      Navigator.pop(context);

      if (uploadResult['success'] == true) {
        setState(() {
          _avatarUrl = uploadResult['url'];
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Row(
              children: [
                Icon(Icons.check_circle_rounded, color: Colors.white),
                SizedBox(width: 10),
                Text('Profile picture updated successfully!'),
              ],
            ),
            backgroundColor: AppColors.online,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(uploadResult['error'] ?? 'Failed to upload profile picture.'),
            backgroundColor: AppColors.offline,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to pick image: $e'),
          backgroundColor: AppColors.offline,
        ),
      );
    }
  }

  void _showChangePasswordDialog() {
    final oldPasswordController = TextEditingController();
    final newPasswordController = TextEditingController();
    final confirmPasswordController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          title: const Row(
            children: [
              Icon(Icons.lock_reset_rounded, color: AppColors.primary),
              SizedBox(width: 10),
              Text('Change Password', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [

                TextField(
                  controller: oldPasswordController,
                  obscureText: true,
                  decoration: InputDecoration(
                    labelText: 'Current Password',
                    prefixIcon: const Icon(Icons.lock_outline_rounded),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
                const SizedBox(height: 16),

                TextField(
                  controller: newPasswordController,
                  obscureText: true,
                  decoration: InputDecoration(
                    labelText: 'New Password',
                    prefixIcon: const Icon(Icons.lock_rounded),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
                const SizedBox(height: 16),

                TextField(
                  controller: confirmPasswordController,
                  obscureText: true,
                  decoration: InputDecoration(
                    labelText: 'Confirm New Password',
                    prefixIcon: const Icon(Icons.lock_clock_rounded),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel', style: TextStyle(color: AppColors.textMuted)),
            ),
            ElevatedButton(
              onPressed: () async {

                if (newPasswordController.text.isEmpty || oldPasswordController.text.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Please fill all fields')),
                  );
                  return;
                }

                if (newPasswordController.text != confirmPasswordController.text) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('New passwords do not match!'), backgroundColor: AppColors.offline),
                  );
                  return;
                }

                final newPwd = newPasswordController.text;
                final hasMinLen = newPwd.length >= 8;
                final hasUpper = newPwd.contains(RegExp(r'[A-Z]'));
                final hasLower = newPwd.contains(RegExp(r'[a-z]'));
                final hasDigit = newPwd.contains(RegExp(r'[0-9]'));
                final hasSpecial = newPwd.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\/~`]'));

                if (!hasMinLen || !hasUpper || !hasLower || !hasDigit || !hasSpecial) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Password must be at least 8 characters with uppercase, lowercase, numbers, and symbols (!@#).'),
                      backgroundColor: AppColors.offline,
                    ),
                  );
                  return;
                }

                final navigator = Navigator.of(context);
                final scaffoldMessenger = ScaffoldMessenger.of(context);

                showDialog(
                  context: context,
                  barrierDismissible: false,
                  builder: (context) => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
                );

                final result = await ApiService.changePassword(
                  oldPasswordController.text,
                  newPasswordController.text,
                );

                if (!mounted) return;
                navigator.pop();

                if (result['success']) {
                  navigator.pop();
                  scaffoldMessenger.showSnackBar(
                    SnackBar(
                      content: const Text('Password changed successfully!'),
                      backgroundColor: AppColors.online,
                      behavior: SnackBarBehavior.floating,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                  );
                } else {
                  scaffoldMessenger.showSnackBar(
                    SnackBar(
                      content: Text(result['error'] ?? 'Failed to change password'),
                      backgroundColor: AppColors.offline,
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Save Password', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        );
      },
    );
  }

  void _showEditProfileBottomSheet() {
    final nameController = TextEditingController(text: _driverName);
    final mobileController = TextEditingController(text: _mobileNumber == "Loading..." || _mobileNumber == "Not Updated" ? "" : _mobileNumber);
    final licenseController = TextEditingController(text: _licenseNo == "Loading..." || _licenseNo == "Not Updated" ? "" : _licenseNo);
    final vehicleController = TextEditingController(text: _vehicleId == "Loading..." || _vehicleId == "Not Updated" ? "" : _vehicleId);
    final priceController = TextEditingController(text: _pricePerSafari.toString());
    final experienceYearsController = TextEditingController(text: _experienceYears.toString());
    final experienceDescController = TextEditingController(text: _experienceDesc);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
          ),
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: Container(
                      width: 44,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.edit_note_rounded, color: AppColors.primary, size: 26),
                      SizedBox(width: 8),
                      Text(
                        'Edit Profile Information',
                        style: TextStyle(
                          fontSize: 19,
                          fontWeight: FontWeight.w900,
                          color: AppColors.textDark,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  TextField(
                    controller: nameController,
                    decoration: InputDecoration(
                      labelText: 'Full Name',
                      prefixIcon: const Icon(Icons.person_outline_rounded),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                  ),
                  const SizedBox(height: 16),

                  TextField(
                    controller: mobileController,
                    keyboardType: TextInputType.phone,
                    decoration: InputDecoration(
                      labelText: 'Mobile Phone Number',
                      prefixIcon: const Icon(Icons.phone_outlined),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                  ),
                  const SizedBox(height: 16),

                  TextField(
                    controller: licenseController,
                    decoration: InputDecoration(
                      labelText: 'Driving License Number',
                      prefixIcon: const Icon(Icons.badge_outlined),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                  ),
                  const SizedBox(height: 16),

                  TextField(
                    controller: vehicleController,
                    decoration: InputDecoration(
                      labelText: 'Vehicle Plate Number',
                      prefixIcon: const Icon(Icons.directions_car_outlined),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                  ),
                  const SizedBox(height: 16),

                  TextField(
                    controller: priceController,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: 'Safari Rate per Tour (LKR)',
                      prefixIcon: const Icon(Icons.payments_outlined),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                  ),
                  const SizedBox(height: 16),

                  TextField(
                    controller: experienceYearsController,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: 'Experience (Years)',
                      prefixIcon: const Icon(Icons.history_outlined),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                  ),
                  const SizedBox(height: 16),

                  TextField(
                    controller: experienceDescController,
                    keyboardType: TextInputType.multiline,
                    maxLines: 3,
                    decoration: InputDecoration(
                      labelText: 'Bio & Safari Experience Notes',
                      prefixIcon: const Icon(Icons.notes_rounded),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                  ),
                  const SizedBox(height: 24),

                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    icon: const Icon(Icons.check_circle_rounded),
                    label: const Text('Save Changes', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    onPressed: () async {
                      if (nameController.text.trim().isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Name cannot be empty')),
                        );
                        return;
                      }

                      final navigator = Navigator.of(context);
                      final scaffoldMessenger = ScaffoldMessenger.of(context);

                      showDialog(
                        context: context,
                        barrierDismissible: false,
                        builder: (context) => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
                      );

                      final priceVal = int.tryParse(priceController.text.trim()) ?? 9500;
                      final expYearsVal = int.tryParse(experienceYearsController.text.trim()) ?? 5;

                      final result = await ApiService.updateDriverProfile(
                        nameController.text.trim(),
                        mobileController.text.trim(),
                        licenseController.text.trim(),
                        vehicleController.text.trim(),
                        priceVal,
                        expYearsVal,
                        experienceDescController.text.trim(),
                      );

                      if (!mounted) return;
                      navigator.pop();

                      if (result['success'] == true) {
                        navigator.pop();
                        scaffoldMessenger.showSnackBar(
                          SnackBar(
                            content: const Text('Profile updated successfully!'),
                            backgroundColor: AppColors.online,
                            behavior: SnackBarBehavior.floating,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                        );

                        _loadProfileData();
                      } else {
                        scaffoldMessenger.showSnackBar(
                          SnackBar(
                            content: Text(result['error'] ?? 'Failed to update profile'),
                            backgroundColor: AppColors.offline,
                            behavior: SnackBarBehavior.floating,
                          ),
                        );
                      }
                    },
                  ),
                  const SizedBox(height: 12),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  void _confirmLogout() {
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
              decoration: BoxDecoration(color: Colors.red.shade50, shape: BoxShape.circle),
              child: const Icon(Icons.logout_rounded, color: AppColors.offline, size: 36),
            ),
            const SizedBox(height: 16),
            const Text(
              'Log Out of Account?',
              style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: AppColors.textDark),
            ),
            const SizedBox(height: 8),
            const Text(
              'Are you sure you want to end your current active driver session?',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: AppColors.textMuted),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Cancel', style: TextStyle(color: AppColors.textDark, fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      backgroundColor: AppColors.offline,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    onPressed: () {
                      Navigator.pop(context);
                      _handleLogout();
                    },
                    child: const Text('Yes, Log Out', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handleLogout() async {

    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();

    if (!mounted) return;

    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (context) => const LoginScreen()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgSand,

      appBar: AppBar(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        title: const Text('Driver Profile', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
        elevation: 0,
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_rounded),
            tooltip: 'Edit Profile',
            onPressed: _showEditProfileBottomSheet,
          ),
        ],
      ),

      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        child: Column(
          children: [

            Container(
              width: double.infinity,
              padding: const EdgeInsets.only(bottom: 32, top: 16),
              decoration: const BoxDecoration(gradient: AppGradients.primaryGradient),
              child: Column(
                children: [

                  Stack(
                    children: [
                      Container(
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: AppColors.accent, width: 3),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.accent.withValues(alpha: 0.3),
                              blurRadius: 18,
                              spreadRadius: 2,
                            )
                          ],
                        ),
                        child: CircleAvatar(
                          radius: 52,
                          backgroundColor: Colors.white,

                          backgroundImage: _profileImageBase64 != null && _profileImageBase64!.isNotEmpty
                              ? MemoryImage(base64Decode(_profileImageBase64!))
                              : (_avatarUrl != null && _avatarUrl!.isNotEmpty)
                                  ? NetworkImage(_avatarUrl!) as ImageProvider
                                  : null,
                          child: (_profileImageBase64 == null || _profileImageBase64!.isEmpty) &&
                                  (_avatarUrl == null || _avatarUrl!.isEmpty)
                              ? const Icon(Icons.person_rounded, size: 64, color: AppColors.textLight)
                              : null,
                        ),
                      ),

                      Positioned(
                        bottom: 2,
                        right: 2,
                        child: GestureDetector(
                          onTap: _pickProfileImage,
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: const BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(color: Colors.black26, blurRadius: 6, offset: Offset(0, 2)),
                              ],
                            ),
                            child: const Icon(Icons.camera_alt_rounded, color: AppColors.primary, size: 18),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        _driverName,
                        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 0.3),
                      ),
                      const SizedBox(width: 6),
                      const Icon(Icons.verified_rounded, color: AppColors.accent, size: 20),
                    ],
                  ),
                  const SizedBox(height: 4),

                  Text(
                    _driverEmail,
                    style: const TextStyle(fontSize: 13, color: AppColors.accentLight),
                  ),

                  const SizedBox(height: 12),

                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.directions_car_rounded, color: Colors.white, size: 14),
                        const SizedBox(width: 6),
                        Text(
                          'Vehicle: $_vehicleId',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [

                  Expanded(child: _buildStatCard(Icons.tour_rounded, _totalTrips, 'Total Safaris', subtext: 'Completed')),
                  const SizedBox(width: 10),

                  Expanded(child: _buildStatCard(Icons.account_balance_wallet_rounded, "LKR ${_formatCurrency(_revenue)}", 'Earnings', iconColor: AppColors.accent, subtext: 'Gross')),
                  const SizedBox(width: 10),

                  Expanded(child: _buildStatCard(Icons.star_rounded, "$_rating ★", 'Rating', iconColor: Colors.amber.shade700, subtext: '5-Star Avg')),
                ],
              ),
            ),

            const SizedBox(height: 20),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: AppDecorations.premiumCard,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.badge_rounded, color: AppColors.primary, size: 20),
                        SizedBox(width: 8),
                        Text(
                          'DRIVER CREDENTIALS',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: AppColors.textLight, letterSpacing: 1.0),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    _buildInfoRow(Icons.payments_rounded, 'Safari Rate', "LKR ${_formatCurrency(_pricePerSafari.toString())}"),
                    const Divider(height: 20, thickness: 0.8),

                    _buildInfoRow(Icons.phone_rounded, 'Mobile Phone', _mobileNumber, isCopyable: true),
                    const Divider(height: 20, thickness: 0.8),

                    _buildInfoRow(Icons.card_membership_rounded, 'Driving License', _licenseNo),
                    const Divider(height: 20, thickness: 0.8),

                    _buildInfoRow(Icons.directions_car_filled_rounded, 'Jeep / Vehicle', _vehicleId),
                    const Divider(height: 20, thickness: 0.8),

                    _buildInfoRow(Icons.workspace_premium_rounded, 'Experience', '$_experienceYears Years Active'),

                    if (_experienceDesc.isNotEmpty) ...[
                      const Divider(height: 20, thickness: 0.8),
                      _buildBioRow(Icons.format_quote_rounded, 'Bio & Highlights', _experienceDesc),
                    ],
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Padding(
                    padding: EdgeInsets.only(left: 4, bottom: 10),
                    child: Text(
                      'ACCOUNT & PREFERENCES',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: AppColors.textLight, letterSpacing: 1.0),
                    ),
                  ),

                  _buildMenuOption(Icons.history_rounded, 'Safari Trip History', 'View past safari logs and details', () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const HistoryScreen()),
                    );
                  }),

                  _buildMenuOption(Icons.edit_square, 'Edit Driver Profile', 'Update rates, mobile & experience', _showEditProfileBottomSheet),

                  _buildMenuOption(Icons.lock_rounded, 'Change Account Password', 'Update current login password', _showChangePasswordDialog),

                  _buildMenuOption(Icons.help_center_rounded, 'Help & Support Center', 'Contact admin or view FAQs', () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const HelpSupportScreen()),
                    );
                  }),
                  const SizedBox(height: 12),

                  Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(18),
                      boxShadow: AppShadows.softCardShadow,
                    ),
                    child: Material(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(18),
                      clipBehavior: Clip.antiAlias,
                      child: Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: Colors.red.withValues(alpha: 0.15)),
                        ),
                        child: ListTile(
                          onTap: _confirmLogout,
                          leading: Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(12)),
                            child: Icon(Icons.logout_rounded, color: Colors.red.shade700, size: 20),
                          ),
                          title: const Text('Log Out', style: TextStyle(fontWeight: FontWeight.w900, color: AppColors.offline, fontSize: 15)),
                          subtitle: const Text('End driver session safely', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                          trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppColors.offline),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 36),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(IconData icon, String value, String label, {Color iconColor = AppColors.primary, String? subtext}) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 10),
      decoration: AppDecorations.premiumCard,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: iconColor, size: 22),
          ),
          const SizedBox(height: 10),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              value,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.textDark),
            ),
          ),
          const SizedBox(height: 2),
          Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textMuted, fontWeight: FontWeight.bold)),
          if (subtext != null)
            Text(subtext, style: const TextStyle(fontSize: 9, color: AppColors.textLight)),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value, {bool isCopyable = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: const BoxDecoration(
              color: AppColors.primaryExtraLight,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: AppColors.primary, size: 16),
          ),
          const SizedBox(width: 12),
          Text(
            label,
            style: const TextStyle(fontSize: 13, color: AppColors.textMuted, fontWeight: FontWeight.w600),
          ),
          const Spacer(),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.end,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 13, color: AppColors.textDark, fontWeight: FontWeight.w800),
            ),
          ),

          if (isCopyable)
            GestureDetector(
              onTap: () {
                Clipboard.setData(ClipboardData(text: value));
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('$label copied to clipboard!'),
                    duration: const Duration(seconds: 2),
                    behavior: SnackBarBehavior.floating,
                  ),
                );
              },
              child: const Padding(
                padding: EdgeInsets.only(left: 6.0),
                child: Icon(Icons.copy_rounded, size: 14, color: AppColors.primary),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildBioRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: const BoxDecoration(
                  color: AppColors.primaryExtraLight,
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: AppColors.primary, size: 16),
              ),
              const SizedBox(width: 12),
              Text(
                label,
                style: const TextStyle(fontSize: 13, color: AppColors.textMuted, fontWeight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.bgSand,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.black.withValues(alpha: 0.04)),
            ),
            child: Text(
              value,
              style: const TextStyle(fontSize: 12, color: AppColors.textDark, height: 1.4, fontStyle: FontStyle.italic),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuOption(IconData icon, String title, String subtitle, VoidCallback onTap) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        boxShadow: AppShadows.softCardShadow,
      ),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        clipBehavior: Clip.antiAlias,
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: Colors.black.withValues(alpha: 0.04)),
          ),
          child: ListTile(
            onTap: onTap,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            leading: Container(
              padding: const EdgeInsets.all(10),
              decoration: const BoxDecoration(color: AppColors.primaryExtraLight, shape: BoxShape.circle),
              child: Icon(icon, color: AppColors.primary, size: 20),
            ),
            title: Text(title, style: const TextStyle(fontWeight: FontWeight.w900, color: AppColors.textDark, fontSize: 14)),
            subtitle: Text(subtitle, style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
            trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppColors.textLight),
          ),
        ),
      ),
    );
  }
}
