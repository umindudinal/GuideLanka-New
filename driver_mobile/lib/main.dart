import 'package:flutter/material.dart';
import 'package:onesignal_flutter/onesignal_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'widgets/theme_constants.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';

void main() async {

  WidgetsFlutterBinding.ensureInitialized();

  OneSignal.Debug.setLogLevel(OSLogLevel.verbose);

  OneSignal.initialize("8c5451c2-789c-46d3-ba3a-a1549488aa21");

  OneSignal.Notifications.requestPermission(true);

  runApp(const GuideLankaDriverApp());
}

class GuideLankaDriverApp extends StatelessWidget {
  const GuideLankaDriverApp({super.key});

  Future<bool> _checkLoginStatus() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('jwt_token');

    return token != null && token.isNotEmpty;
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(

      title: 'GuideLanka Driver',

      debugShowCheckedModeBanner: false,

      theme: ThemeData(

        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.primary,
          primary: AppColors.primary,
          secondary: AppColors.accent,
          surface: AppColors.cardBg,
        ),

        scaffoldBackgroundColor: AppColors.bgSand,

        useMaterial3: true,

        fontFamily: 'Roboto',

        appBarTheme: const AppBarTheme(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          elevation: 0,
          centerTitle: true,
        ),
      ),

      home: FutureBuilder<bool>(
        future: _checkLoginStatus(),
        builder: (context, snapshot) {

          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Scaffold(
              backgroundColor: Colors.white,
              body: Center(
                child: CircularProgressIndicator(color: AppColors.primary),
              ),
            );
          }

          if (snapshot.data == true) {
            return const HomeScreen();
          }

          return const LoginScreen();
        },
      ),
    );
  }
}
