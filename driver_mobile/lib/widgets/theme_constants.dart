import 'package:flutter/material.dart';

class AppColors {

  static const Color primary = Color(0xFF0F4C3A);

  static const Color primaryLight = Color(0xFF1E6F56);

  static const Color primaryExtraLight = Color(0xFFEBF5F1);

  static const Color accent = Color(0xFFD4AF37);

  static const Color accentLight = Color(0xFFFFF7E0);

  static const Color textDark = Color(0xFF1F2937);

  static const Color textMuted = Color(0xFF6B7280);

  static const Color textLight = Color(0xFF9CA3AF);

  static const Color online = Color(0xFF10B981);

  static const Color offline = Color(0xFFEF4444);

  static const Color warning = Color(0xFFF59E0B);

  static const Color info = Color(0xFF3B82F6);

  static const Color bgSand = Color(0xFFFAF8F5);

  static const Color cardBg = Colors.white;
}

class AppGradients {

  static const LinearGradient primaryGradient = LinearGradient(
    colors: [AppColors.primary, AppColors.primaryLight],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient goldGradient = LinearGradient(
    colors: [AppColors.accent, Color(0xFFE8C248)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient loginGradient = LinearGradient(
    colors: [Color(0xFF072D22), AppColors.primary, Color(0xFF1E6F56)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const LinearGradient pulseRedGradient = LinearGradient(
    colors: [Color(0xFFE74C3C), Color(0xFFC0392B)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}

class AppShadows {

  static List<BoxShadow> softCardShadow = [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.04),
      blurRadius: 16,
      offset: const Offset(0, 8),
    ),
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.02),
      blurRadius: 4,
      offset: const Offset(0, 2),
    ),
  ];

  static List<BoxShadow> intenseShadow = [
    BoxShadow(
      color: AppColors.primary.withValues(alpha: 0.12),
      blurRadius: 20,
      offset: const Offset(0, 10),
    ),
  ];

  static List<BoxShadow> emergencyPulseShadow = [
    BoxShadow(
      color: AppColors.offline.withValues(alpha: 0.35),
      blurRadius: 30,
      spreadRadius: 8,
    ),
  ];
}

class AppDecorations {

  static BoxDecoration premiumCard = BoxDecoration(
    color: AppColors.cardBg,
    borderRadius: BorderRadius.circular(24),
    border: Border.all(color: Colors.black.withValues(alpha: 0.04), width: 1),
    boxShadow: AppShadows.softCardShadow,
  );

  static BoxDecoration innerGlass = BoxDecoration(
    color: Colors.white.withValues(alpha: 0.85),
    borderRadius: BorderRadius.circular(20),
    border: Border.all(color: Colors.white.withValues(alpha: 0.6), width: 1.5),
  );
}
