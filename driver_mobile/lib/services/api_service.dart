import 'package:flutter/foundation.dart';

import 'dart:convert';

import 'package:http/http.dart' as http;

import 'package:shared_preferences/shared_preferences.dart';

class ApiService {

  static String get baseUrl {
    return 'https://guide-lanka-backend.vercel.app/api';
  }

  static Future<Map<String, dynamic>> loginDriver(String email, String password) async {
    try {

      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('jwt_token', data['token']);
        await prefs.setString('user_id', data['user']['id']);
        await prefs.setString('user_role', data['user']['role']);
        await prefs.setString('user_name', data['user']['full_name'] ?? 'Driver');
        await prefs.setString('user_email', data['user']['email'] ?? '');

        return {'success': true, 'data': data};
      } else {

        return {'success': false, 'error': data['error'] ?? 'Login failed'};
      }
    } catch (e) {

      return {'success': false, 'error': 'Cannot connect to server. Check your network.'};
    }
  }

  static Future<Map<String, dynamic>> sendOtp(String phone) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/send-otp'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'phone': phone,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'otp': data['otp']?.toString(),
          'message': data['message']
        };
      }
      else {
        return {
          'success': false,
          'error': data['error'] ?? 'Failed to send OTP'
        };
      }
    }
    catch (e) {
      return {
        'success': false,
        'error': 'Cannot connect to server. Check your network.'
      };
    }
  }

  static Future<Map<String, dynamic>> verifyOtp(String phone, String otp) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/verify-otp'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'phone': phone,
          'otp': otp,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('jwt_token', data['token']);
        await prefs.setString('user_id', data['user']['id']);
        await prefs.setString('user_role', data['user']['role']);
        await prefs.setString('user_name', data['user']['full_name'] ?? 'Driver');
        await prefs.setString('user_email', data['user']['email'] ?? '');

        return {'success': true, 'data': data};
      }
      else {
        return {'success': false, 'error': data['error'] ?? 'Login failed'};
      }
    }
    catch (e) {
      return {'success': false, 'error': 'Cannot connect to server. Check your network.'};
    }
  }

  static Future<Map<String, dynamic>> changePassword(String oldPassword, String newPassword) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token');
      final userId = prefs.getString('user_id');

      debugPrint('🚀 Calling API URL: $baseUrl/auth/change-password');
      final response = await http.post(
        Uri.parse('$baseUrl/auth/change-password'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'user_id': userId,
          'old_password': oldPassword,
          'new_password': newPassword,
        }),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          return {'success': true};
        } else {
          return {'success': false, 'error': data['message'] ?? data['error'] ?? 'Failed to change password'};
        }
      } else {
        try {
          final data = jsonDecode(response.body);
          return {'success': false, 'error': data['message'] ?? data['error'] ?? 'Server error: ${response.statusCode}'};
        } catch (_) {
          return {'success': false, 'error': 'Server error: ${response.statusCode}'};
        }
      }
    } catch (e) {
      debugPrint("💥 Error changing password: $e");
      return {'success': false, 'error': 'Network error. Please try again.'};
    }
  }

  static Future<Map<String, dynamic>> getDriverBookings() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token');

      if (token == null) {
        return {'success': false, 'error': 'No token found. Please login again.'};
      }

      final response = await http.get(
        Uri.parse('$baseUrl/bookings'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 10));

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'data': data['bookings']};
      } else {
        return {'success': false, 'error': data['error'] ?? 'Failed to fetch bookings'};
      }
    } catch (e) {
      return {'success': false, 'error': 'Cannot connect to server. Check your network.'};
    }
  }

  static Future<Map<String, dynamic>> updateBookingStatus(String bookingId, String newStatus) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token');

      if (token == null) {
        return {'success': false, 'error': 'No token found. Please login again.'};
      }

      final response = await http.patch(
        Uri.parse('$baseUrl/bookings/$bookingId/status'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'status': newStatus,
        }),
      ).timeout(const Duration(seconds: 10));

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'data': data};
      } else {
        return {'success': false, 'error': data['error'] ?? 'Failed to update status'};
      }
    } catch (e) {
      return {'success': false, 'error': 'Cannot connect to server. Check your network.'};
    }
  }

  static Future<Map<String, dynamic>> getMessages(String bookingId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token');

      final response = await http.get(
        Uri.parse('$baseUrl/chat/$bookingId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 10));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        return {'success': true, 'data': data['messages']};
      } else {
        return {'success': false, 'error': data['error']};
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error'};
    }
  }

  static Future<Map<String, dynamic>> sendMessage(String bookingId, String text) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token');
      final myUserId = prefs.getString('user_id');

      final response = await http.post(
        Uri.parse('$baseUrl/chat/sendMessage'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'booking_id': bookingId,
          'text': text,
          'sender_id': myUserId,
        }),
      ).timeout(const Duration(seconds: 10));

      debugPrint("👉 Request URL: $baseUrl/chat/sendMessage");
      debugPrint("👉 Server Response: ${response.statusCode} - ${response.body}");

      final data = jsonDecode(response.body);
      if (response.statusCode == 201) {
        return {'success': true, 'data': data['data']};
      } else {
        return {'success': false, 'error': data['error']};
      }
    } catch (e) {
      debugPrint("💥 Network Error: $e");
      return {'success': false, 'error': 'Network error'};
    }
  }

  static Future<void> markMessagesAsRead(String bookingId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token');
      final myUserId = prefs.getString('user_id');

      await http.post(
        Uri.parse('$baseUrl/chat/markRead'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'booking_id': bookingId,
          'user_id': myUserId,
        }),
      );
    } catch (e) {
      debugPrint("💥 Error marking as read: $e");
    }
  }

  static Future<Map<String, dynamic>> logWildlifeSighting(String animalType, double lat, double lng) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token');
      final driverId = prefs.getString('user_id');

      final response = await http.post(
        Uri.parse('$baseUrl/sightings'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'driver_id': driverId,
          'animal_type': animalType,
          'location_lat': lat,
          'location_lng': lng,
          'description': 'Logged via mobile map',
        }),
      ).timeout(const Duration(seconds: 10));

      final data = jsonDecode(response.body);
      if (response.statusCode == 201 || response.statusCode == 200) {
        return {'success': true, 'data': data};
      } else {
        return {'success': false, 'error': data['error'] ?? 'Failed to log sighting'};
      }
    } catch (e) {
      debugPrint("💥 Network Error: $e");
      return {'success': false, 'error': 'Network error occurred'};
    }
  }

  static Future<List<dynamic>> getRecentSightings() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token');

      final response = await http.get(
        Uri.parse('$baseUrl/sightings'),
        headers: {
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true && data['data'] != null) {
          final List<dynamic> allSightings = data['data'];
          return List<dynamic>.from(allSightings);
        }
      }
      return [];
    } catch (e) {
      debugPrint("💥 Error fetching sightings: $e");
      return [];
    }
  }

  static Future<Map<String, dynamic>> updateLiveLocation(double lat, double lng) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token');
      final driverId = prefs.getString('user_id');

      if (driverId == null || token == null) {
        return {'success': false, 'error': 'Not logged in'};
      }

      final response = await http.post(
        Uri.parse('$baseUrl/alerts'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'driver_id': driverId,
          'alert_type': 'LOCATION_UPDATE',
          'location_lat': lat,
          'location_lng': lng,
          'status': 'Active'
        }),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 201 || response.statusCode == 200) {
        return {'success': true};
      } else {
        return {'success': false, 'error': 'Failed to update location'};
      }
    } catch (e) {
      debugPrint("💥 Network Error updating location: $e");
      return {'success': false, 'error': 'Network error'};
    }
  }

  static Future<Map<String, dynamic>> sendEmergencyAlert(String alertType, double lat, double lng) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token');
      final driverId = prefs.getString('user_id');

      final response = await http.post(
        Uri.parse('$baseUrl/alerts'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'driver_id': driverId,
          'alert_type': alertType,
          'location_lat': lat,
          'location_lng': lng,
          'status': 'Active'
        }),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 201 || response.statusCode == 200) {
        return {'success': true};
      } else {
        return {'success': false, 'error': 'Failed to send alert'};
      }
    } catch (e) {
      debugPrint("💥 Network Error sending alert: $e");
      return {'success': false, 'error': 'Network error'};
    }
  }

  static Future<Map<String, dynamic>> sendSOSAlert({
    required double lat,
    required double lng,
    required String emergencyType,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token');
      final driverId = prefs.getString('user_id');

      final response = await http.post(
        Uri.parse('$baseUrl/alerts/sos'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'driver_id': driverId,
          'latitude': lat,
          'longitude': lng,
          'alert_type': emergencyType,
          'status': 'PENDING'
        }),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200 || response.statusCode == 201) {
        return {'success': true};
      } else {
        return {'success': false, 'error': 'Failed to send SOS'};
      }
    } catch (e) {
      debugPrint("💥 Error sending SOS: $e");
      return {'success': false, 'error': 'Network error. Please try again.'};
    }
  }

  static Future<Map<String, dynamic>> getDriverProfile() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token');

      if (token == null) {
        return {'success': false, 'error': 'No token found. Please login again.'};
      }

      debugPrint('🚀 Calling Profile API: $baseUrl/driver/profile');
      final response = await http.get(
        Uri.parse('$baseUrl/driver/profile'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {'success': true, 'data': data};
      } else {
        final data = jsonDecode(response.body);
        return {'success': false, 'error': data['error'] ?? 'Server error: ${response.statusCode}'};
      }
    } catch (e) {
      debugPrint("💥 Error fetching profile: $e");
      return {'success': false, 'error': 'Network error. Please try again.'};
    }
  }

  static Future<Map<String, dynamic>> updateDriverProfile(
      String name, String mobile, String licenseNo, String vehicleNo, int pricePerSafari, int experienceYears, String experience) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token');

      if (token == null) {
        return {'success': false, 'error': 'No token found. Please login again.'};
      }

      debugPrint('🚀 Calling Update Profile API: $baseUrl/driver/profile');
      final response = await http.put(
        Uri.parse('$baseUrl/driver/profile'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'name': name,
          'mobile': mobile,
          'licenseNo': licenseNo,
          'vehicleNo': vehicleNo,
          'pricePerSafari': pricePerSafari,
          'experienceYears': experienceYears,
          'experience': experience,
        }),
      ).timeout(const Duration(seconds: 10));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        return {'success': true};
      } else {
        return {'success': false, 'error': data['error'] ?? 'Failed to update profile'};
      }
    } catch (e) {
      debugPrint("💥 Error updating profile: $e");
      return {'success': false, 'error': 'Network error. Please try again.'};
    }
  }

  static Future<Map<String, dynamic>> uploadProfilePicture(String base64Image) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token');

      if (token == null) {
        return {'success': false, 'error': 'No token found. Please login again.'};
      }

      debugPrint('🚀 Calling Upload Profile Picture API: $baseUrl/driver/profile/picture');
      final response = await http.post(
        Uri.parse('$baseUrl/driver/profile/picture'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'image': base64Image,
        }),
      ).timeout(const Duration(seconds: 15));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        return {'success': true, 'url': data['url']};
      } else {
        return {'success': false, 'error': data['error'] ?? 'Failed to upload profile picture'};
      }
    } catch (e) {
      debugPrint("💥 Error uploading profile picture: $e");
      return {'success': false, 'error': 'Network error. Please try again.'};
    }
  }

  static Future<Map<String, dynamic>> updateDriverStatus(bool isActive) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token');

      if (token == null) {
        return {'success': false, 'error': 'No token found.'};
      }

      debugPrint('🚀 Calling Update Status API: $baseUrl/driver/status');
      final response = await http.patch(
        Uri.parse('$baseUrl/driver/status'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'isActive': isActive,
        }),
      ).timeout(const Duration(seconds: 10));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        return {'success': true};
      } else {
        return {'success': false, 'error': data['error'] ?? 'Failed to update status'};
      }
    } catch (e) {
      debugPrint("💥 Error updating status: $e");
      return {'success': false, 'error': 'Network error. Please try again.'};
    }
  }

}
