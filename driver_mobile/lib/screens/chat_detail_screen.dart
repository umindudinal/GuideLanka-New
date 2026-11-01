import 'dart:async';

import 'package:flutter/material.dart';

import 'package:shared_preferences/shared_preferences.dart';

import 'package:onesignal_flutter/onesignal_flutter.dart';

import '../services/api_service.dart';

import '../widgets/theme_constants.dart';

class ChatDetailScreen extends StatefulWidget {

  final String bookingId;

  final String touristName;

  const ChatDetailScreen({super.key, required this.bookingId, required this.touristName});

  @override
  State<ChatDetailScreen> createState() => _ChatDetailScreenState();
}

class _ChatDetailScreenState extends State<ChatDetailScreen> {

  final TextEditingController _messageController = TextEditingController();

  final ScrollController _scrollController = ScrollController();

  List<dynamic> _messages = [];

  String? _myUserId;

  Timer? _pollingTimer;

  bool _isSending = false;

  @override
  void initState() {
    super.initState();

    _loadMyUserId();

    _fetchMessages();

    OneSignal.Notifications.addForegroundWillDisplayListener((event) {
      _fetchMessages();
    });

    _pollingTimer = Timer.periodic(const Duration(seconds: 3), (timer) {
      _fetchMessages();
    });
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadMyUserId() async {
    final prefs = await SharedPreferences.getInstance();
    if (mounted) {
      setState(() {
        _myUserId = prefs.getString('user_id');
      });
    }
  }

  Future<void> _fetchMessages() async {
    final result = await ApiService.getMessages(widget.bookingId);
    if (result['success']) {
      if (mounted) {
        final fetchedMessages = result['data'] as List<dynamic>;

        if (_messages.length != fetchedMessages.length) {
          setState(() {
            _messages = fetchedMessages;
          });

          Future.delayed(const Duration(milliseconds: 100), () {
            if (_scrollController.hasClients) {
              _scrollController.animateTo(
                _scrollController.position.maxScrollExtent,
                duration: const Duration(milliseconds: 300),
                curve: Curves.easeOut,
              );
            }
          });
        }
      }
    }
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();

    if (text.isEmpty || _isSending) return;

    setState(() {
      _isSending = true;
    });

    _messageController.clear();

    final result = await ApiService.sendMessage(widget.bookingId, text);

    if (mounted) {
      setState(() {
        _isSending = false;
      });
    }

    if (result['success']) {
      _fetchMessages();
    } else {

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to send message'),
            backgroundColor: AppColors.offline,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
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
        titleSpacing: 0,
        title: Row(
          children: [

            Stack(
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: Colors.white.withValues(alpha: 0.2),
                  child: Text(
                    widget.touristName.isNotEmpty ? widget.touristName[0].toUpperCase() : 'T',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                ),

                Positioned(
                  right: 0,
                  bottom: 0,
                  child: Container(
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(
                      color: AppColors.online,
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.primary, width: 1.5),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 12),

            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.touristName,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Colors.white),
                ),
                const Text(
                  'Tourist • Online',
                  style: TextStyle(fontSize: 11, color: Colors.white70, fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ],
        ),
      ),

      body: Column(
        children: [

          Expanded(

            child: _messages.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.chat_bubble_outline_rounded, size: 48, color: Colors.grey.shade400),
                        const SizedBox(height: 12),
                        const Text(
                          'No messages yet',
                          style: TextStyle(color: AppColors.textMuted, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Send a greeting message to start the conversation!',
                          style: TextStyle(color: AppColors.textLight, fontSize: 12),
                        ),
                      ],
                    ),
                  )

                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      final msg = _messages[index];

                      final isMe = msg['sender_id'] == _myUserId;

                      return Align(

                        alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          decoration: BoxDecoration(

                            gradient: isMe ? AppGradients.primaryGradient : null,
                            color: isMe ? null : Colors.white,
                            border: isMe ? null : Border.all(color: Colors.black.withValues(alpha: 0.04)),

                            borderRadius: BorderRadius.only(
                              topLeft: const Radius.circular(20),
                              topRight: const Radius.circular(20),
                              bottomLeft: isMe ? const Radius.circular(20) : const Radius.circular(4),
                              bottomRight: isMe ? const Radius.circular(4) : const Radius.circular(20),
                            ),
                            boxShadow: AppShadows.softCardShadow,
                          ),

                          constraints: BoxConstraints(
                            maxWidth: MediaQuery.of(context).size.width * 0.78,
                          ),
                          child: Column(
                            crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                            children: [
                              Text(
                                msg['text'] ?? '',
                                style: TextStyle(

                                  color: isMe ? Colors.white : AppColors.textDark,
                                  fontSize: 15,
                                  height: 1.3,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),

          Container(
            padding: const EdgeInsets.only(left: 16, right: 16, top: 12, bottom: 24),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 16,
                  offset: const Offset(0, -4),
                )
              ],
            ),
            child: Row(
              children: [

                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      color: AppColors.bgSand,
                      borderRadius: BorderRadius.circular(26),
                      border: Border.all(color: AppColors.primary.withValues(alpha: 0.08)),
                    ),
                    child: TextField(
                      controller: _messageController,
                      style: const TextStyle(color: AppColors.textDark, fontSize: 14),
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _sendMessage(),
                      decoration: const InputDecoration(
                        hintText: 'Type message for tourist...',
                        hintStyle: TextStyle(color: AppColors.textLight, fontSize: 14),
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),

                Container(
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(
                    gradient: AppGradients.primaryGradient,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.3),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      )
                    ],
                  ),
                  child: IconButton(
                    icon: _isSending

                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                          )

                        : const Icon(Icons.send_rounded, color: Colors.white, size: 20),
                    onPressed: _sendMessage,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
