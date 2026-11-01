import 'package:flutter/material.dart';

import 'package:shared_preferences/shared_preferences.dart';

import '../services/api_service.dart';

import 'home_screen.dart';

import 'package:onesignal_flutter/onesignal_flutter.dart';

import '../widgets/theme_constants.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {

  final _emailController = TextEditingController();

  final _passwordController = TextEditingController();

  final _phoneController = TextEditingController();

  final _otpController = TextEditingController();

  bool _isLoading = false;

  bool _isSendingOtp = false;

  bool _obscurePassword = true;

  int _activeTab = 0;

  bool _otpSent = false;

  Future<void> _onLoginSuccess(Map<String, dynamic> result) async {
    debugPrint("👉 Login API Result: $result");

    String? driverIdToSave;
    String driverNameToSave = 'Driver';

    if (result['userId'] != null) {
      driverIdToSave = result['userId'].toString();
    }
    else if (result['id'] != null) {
      driverIdToSave = result['id'].toString();
    }
    else if (result['data'] != null && result['data']['id'] != null) {
      driverIdToSave = result['data']['id'].toString();
    }
    else if (result['data'] != null && result['data']['user'] != null) {
      driverIdToSave = result['data']['user']['id']?.toString();
      if (result['data']['user']['full_name'] != null) {
        driverNameToSave = result['data']['user']['full_name'];
      }
    }
    else if (result['user'] != null) {
      driverIdToSave = result['user']['id']?.toString();
      if (result['user']['full_name'] != null) {
        driverNameToSave = result['user']['full_name'];
      }
    }

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('full_name', driverNameToSave);

    if (driverIdToSave != null) {
      debugPrint("✅ Sending ID to OneSignal: $driverIdToSave");
      OneSignal.login(driverIdToSave);
    }
    else {
      debugPrint("❌ Warning: Could not find Driver ID to send to OneSignal!");
    }

    if (!mounted) return;

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (context) => const HomeScreen()),
    );
  }

  Future<void> _handleLogin() async {

    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    if (email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter both email and password')),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    final result = await ApiService.loginDriver(email, password);

    if (!mounted) return;

    setState(() {
      _isLoading = false;
    });

    if (result['success']) {
      _onLoginSuccess(result['data']);
    }
    else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['error']),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _handleSendOtp({bool isResend = false}) async {
    final phone = _phoneController.text.trim();

    if (phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your mobile number first')),
      );
      return;
    }

    setState(() {
      _isSendingOtp = true;
    });

    final fullPhone = '+94$phone';

    final result = await ApiService.sendOtp(fullPhone);

    if (!mounted) return;

    setState(() {
      _isSendingOtp = false;
    });

    if (result['success']) {
      setState(() {
        _otpSent = true;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(isResend
              ? 'OTP resent successfully! Please check your mobile messages.'
              : 'OTP sent successfully! Please check your mobile messages.'
          ),
          backgroundColor: AppColors.primary,
          duration: const Duration(seconds: 5),
        ),
      );
    }
    else {

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['error'] ?? 'Failed to send OTP'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _handlePhoneLogin() async {
    final phone = _phoneController.text.trim();
    final otp = _otpController.text.trim();

    if (phone.isEmpty || otp.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter both mobile number and OTP')),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    final fullPhone = '+94$phone';

    final result = await ApiService.verifyOtp(fullPhone, otp);

    if (!mounted) return;

    setState(() {
      _isLoading = false;
    });

    if (result['success']) {
      _onLoginSuccess(result['data']);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['error'] ?? 'Login failed'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _handleForgotPassword() {
    final email = _emailController.text.trim();

    if (email.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Please enter your email first to reset password.'),
          backgroundColor: Colors.orange.shade800,
        ),
      );
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('A password reset link has been sent to $email'),
        backgroundColor: Colors.blue.shade700,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(

      body: Container(
        decoration: const BoxDecoration(
          gradient: AppGradients.loginGradient,
        ),
        child: SafeArea(

          child: Center(

            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 36.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [

                  Center(
                    child: Container(
                      width: 96,
                      height: 96,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.25),
                            blurRadius: 24,
                            offset: const Offset(0, 8),
                          ),
                          BoxShadow(
                            color: AppColors.accent.withValues(alpha: 0.25),
                            blurRadius: 18,
                            spreadRadius: 2,
                          ),
                        ],
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.8),
                          width: 2.5,
                        ),
                      ),
                      child: ClipOval(
                        child: Image.asset(
                          'assets/logo.png',
                          fit: BoxFit.contain,
                          errorBuilder: (context, error, stackTrace) => const Icon(
                            Icons.explore_outlined,
                            size: 48,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  const Text(
                    'GuideLanka',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 36,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                      letterSpacing: 0.8,
                    ),
                  ),

                  const Text(
                    'DRIVER PORTAL',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 14,
                      color: AppColors.accent,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 2.0,
                    ),
                  ),
                  const SizedBox(height: 40),

                  Container(
                    padding: const EdgeInsets.all(28.0),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.95),
                      borderRadius: BorderRadius.circular(28),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.15),
                          blurRadius: 30,
                          offset: const Offset(0, 15),
                        )
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [

                        const Text(
                          'Welcome Back',
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textDark,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),

                        Row(
                          children: [

                            Expanded(
                              child: GestureDetector(
                                onTap: () {

                                  if (!_isLoading && !_isSendingOtp) {
                                    setState(() => _activeTab = 0);
                                  }
                                },
                                child: Container(
                                  padding: const EdgeInsets.symmetric(vertical: 12),
                                  decoration: BoxDecoration(
                                    border: Border(
                                      bottom: BorderSide(
                                        color: _activeTab == 0 ? AppColors.primary : Colors.transparent,
                                        width: 2,
                                      ),
                                    ),
                                  ),
                                  child: Text(
                                    'Phone',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: _activeTab == 0 ? FontWeight.bold : FontWeight.normal,
                                      color: _activeTab == 0 ? AppColors.primary : AppColors.textMuted,
                                    ),
                                  ),
                                ),
                              ),
                            ),

                            Expanded(
                              child: GestureDetector(
                                onTap: () {
                                  if (!_isLoading && !_isSendingOtp) {
                                    setState(() => _activeTab = 1);
                                  }
                                },
                                child: Container(
                                  padding: const EdgeInsets.symmetric(vertical: 12),
                                  decoration: BoxDecoration(
                                    border: Border(
                                      bottom: BorderSide(
                                        color: _activeTab == 1 ? AppColors.primary : Colors.transparent,
                                        width: 2,
                                      ),
                                    ),
                                  ),
                                  child: Text(
                                    'Email',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: _activeTab == 1 ? FontWeight.bold : FontWeight.normal,
                                      color: _activeTab == 1 ? AppColors.primary : AppColors.textMuted,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),

                        if (_activeTab == 0) ...[

                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Mobile Number',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textDark,
                                ),
                              ),
                              const SizedBox(height: 8),
                              TextField(
                                controller: _phoneController,
                                keyboardType: TextInputType.phone,

                                enabled: !_isLoading && !_isSendingOtp && !_otpSent,
                                style: TextStyle(
                                  color: _otpSent ? AppColors.textMuted : AppColors.textDark,
                                  fontWeight: _otpSent ? FontWeight.normal : FontWeight.bold,
                                ),
                                decoration: InputDecoration(

                                  prefixIcon: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const SizedBox(width: 16),
                                      Text(
                                        '+94',
                                        style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                          color: _otpSent ? AppColors.textMuted : AppColors.textDark,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Container(
                                        height: 24,
                                        width: 1,
                                        color: Colors.grey.shade400,
                                      ),
                                      const SizedBox(width: 12),
                                    ],
                                  ),
                                  hintText: '77 123 4567',
                                  hintStyle: TextStyle(color: Colors.grey.shade400),
                                  filled: true,
                                  fillColor: _otpSent ? Colors.grey.shade100 : Colors.grey.shade50,
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(16),
                                    borderSide: BorderSide(color: Colors.grey.shade300),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(16),
                                    borderSide: const BorderSide(color: AppColors.primary, width: 2),
                                  ),
                                  disabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(16),
                                    borderSide: BorderSide(color: Colors.grey.shade200),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 20),

                          if (!_otpSent) ...[
                            Container(
                              height: 56,
                              decoration: BoxDecoration(
                                gradient: AppGradients.primaryGradient,
                                borderRadius: BorderRadius.circular(16),
                                boxShadow: AppShadows.intenseShadow,
                              ),
                              child: ElevatedButton(
                                onPressed: _isSendingOtp ? null : () => _handleSendOtp(isResend: false),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.transparent,
                                  shadowColor: Colors.transparent,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                ),
                                child: _isSendingOtp
                                    ? const SizedBox(
                                        height: 24,
                                        width: 24,
                                        child: CircularProgressIndicator(
                                          color: Colors.white,
                                          strokeWidth: 2.5,
                                        ),
                                      )
                                    : const Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Text(
                                            'Send OTP',
                                            style: TextStyle(
                                              fontSize: 18,
                                              fontWeight: FontWeight.bold,
                                              color: Colors.white,
                                            ),
                                          ),
                                          SizedBox(width: 8),
                                          Icon(Icons.arrow_forward, color: Colors.white),
                                        ],
                                      ),
                              ),
                            ),
                          ]

                          else ...[
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'One Time Password',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.textDark,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                TextField(
                                  controller: _otpController,
                                  keyboardType: TextInputType.number,
                                  style: const TextStyle(color: AppColors.textDark),
                                  decoration: InputDecoration(
                                    hintText: 'Enter 6-digit code',
                                    hintStyle: TextStyle(color: Colors.grey.shade400),
                                    filled: true,
                                    fillColor: Colors.grey.shade50,
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(16),
                                      borderSide: BorderSide(color: Colors.grey.shade300),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(16),
                                      borderSide: const BorderSide(color: AppColors.primary, width: 2),
                                    ),
                                  ),
                                ),
                              ],
                            ),

                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                TextButton(
                                  onPressed: () {
                                    setState(() {
                                      _otpSent = false;
                                      _otpController.clear();
                                    });
                                  },
                                  child: const Text(
                                    'Change Number',
                                    style: TextStyle(
                                      color: Colors.grey,
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                TextButton(
                                  onPressed: _isSendingOtp ? null : () => _handleSendOtp(isResend: true),
                                  child: _isSendingOtp
                                      ? const SizedBox(
                                          width: 14,
                                          height: 14,
                                          child: CircularProgressIndicator(strokeWidth: 2),
                                        )
                                      : const Text(
                                          'Resend Code',
                                          style: TextStyle(
                                            color: AppColors.primaryLight,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 12,
                                          ),
                                        ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),

                            Container(
                              height: 56,
                              decoration: BoxDecoration(
                                gradient: AppGradients.primaryGradient,
                                borderRadius: BorderRadius.circular(16),
                                boxShadow: AppShadows.intenseShadow,
                              ),
                              child: ElevatedButton(
                                onPressed: _isLoading ? null : _handlePhoneLogin,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.transparent,
                                  shadowColor: Colors.transparent,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                ),
                                child: _isLoading
                                    ? const SizedBox(
                                        height: 24,
                                        width: 24,
                                        child: CircularProgressIndicator(
                                          color: Colors.white,
                                          strokeWidth: 2.5,
                                        ),
                                      )
                                    : const Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Text(
                                            'Sign In',
                                            style: TextStyle(
                                              fontSize: 18,
                                              fontWeight: FontWeight.bold,
                                              color: Colors.white,
                                            ),
                                          ),
                                          SizedBox(width: 8),
                                          Icon(Icons.arrow_forward, color: Colors.white),
                                        ],
                                      ),
                              ),
                            ),
                          ],
                        ]

                        else ...[

                          TextField(
                            controller: _emailController,
                            keyboardType: TextInputType.emailAddress,
                            style: const TextStyle(color: AppColors.textDark),
                            decoration: InputDecoration(
                              labelText: 'Email Address',
                              labelStyle: const TextStyle(color: AppColors.textMuted),
                              prefixIcon: const Icon(Icons.email_outlined, color: AppColors.primary),
                              filled: true,
                              fillColor: Colors.grey.shade50,
                              enabledBorder: OutlineInputBorder(
                                borderSide: BorderSide(color: Colors.grey.shade300),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderSide: const BorderSide(color: AppColors.primary, width: 2),
                                borderRadius: BorderRadius.circular(16),
                              ),
                            ),
                          ),
                          const SizedBox(height: 20),

                          TextField(
                            controller: _passwordController,
                            obscureText: _obscurePassword,
                            style: const TextStyle(color: AppColors.textDark),
                            decoration: InputDecoration(
                              labelText: 'Password',
                              labelStyle: const TextStyle(color: AppColors.textMuted),
                              prefixIcon: const Icon(Icons.lock_outline, color: AppColors.primary),
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                                  color: AppColors.textMuted,
                                ),
                                onPressed: () {

                                  setState(() {
                                    _obscurePassword = !_obscurePassword;
                                  });
                                },
                              ),
                              filled: true,
                              fillColor: Colors.grey.shade50,
                              enabledBorder: OutlineInputBorder(
                                borderSide: BorderSide(color: Colors.grey.shade300),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderSide: const BorderSide(color: AppColors.primary, width: 2),
                                borderRadius: BorderRadius.circular(16),
                              ),
                            ),
                          ),
                          const SizedBox(height: 8),

                          Align(
                            alignment: Alignment.centerRight,
                            child: TextButton(
                              onPressed: _handleForgotPassword,
                              child: const Text(
                                'Forgot Password?',
                                style: TextStyle(
                                  color: AppColors.primaryLight,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),

                          Container(
                            height: 56,
                            decoration: BoxDecoration(
                              gradient: AppGradients.primaryGradient,
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: AppShadows.intenseShadow,
                            ),
                            child: ElevatedButton(
                              onPressed: _isLoading ? null : _handleLogin,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.transparent,
                                shadowColor: Colors.transparent,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                ),
                              ),
                              child: _isLoading
                                  ? const SizedBox(
                                      height: 24,
                                      width: 24,
                                      child: CircularProgressIndicator(
                                        color: Colors.white,
                                        strokeWidth: 2.5,
                                      ),
                                    )
                                  : const Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Text(
                                          'Sign In',
                                          style: TextStyle(
                                            fontSize: 18,
                                            fontWeight: FontWeight.bold,
                                            color: Colors.white,
                                          ),
                                        ),
                                        SizedBox(width: 8),
                                        Icon(Icons.arrow_forward, color: Colors.white),
                                      ],
                                    ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
