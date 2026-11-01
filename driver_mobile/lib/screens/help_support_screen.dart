import 'package:flutter/material.dart';

import 'package:flutter/services.dart';

import '../widgets/theme_constants.dart';

class HelpSupportScreen extends StatefulWidget {
  const HelpSupportScreen({super.key});

  @override
  State<HelpSupportScreen> createState() => _HelpSupportScreenState();
}

class _HelpSupportScreenState extends State<HelpSupportScreen> {

  final _messageController = TextEditingController();

  final _subjectController = TextEditingController();

  final _formKey = GlobalKey<FormState>();

  bool _isSubmitting = false;

  final List<Map<String, String>> _faqs = [
    {
      'question': 'How do I report wildlife sightings?',
      'answer': 'Go to the Map tab, click on "Log Wildlife Sighting", select the animal type (e.g., Elephant, Leopard), and confirm the location to share with other drivers.'
    },
    {
      'question': 'How do I accept or reject safari bookings?',
      'answer': 'Whenever a tourist requests a safari booking, you will receive a notification. Go to the Home tab where pending bookings are listed, and tap "Accept" or "Reject".'
    },
    {
      'question': 'How do I update my vehicle or license details?',
      'answer': 'Navigate to the Profile page, click on "Edit Profile", modify your mobile number, license number, or vehicle number, and press "Save Changes".'
    },
    {
      'question': 'What should I do in case of an emergency?',
      'answer': 'If you face vehicle breakdown, wild animal threats, or boundary violations, tap the "SOS" emergency button on the Map page to alert the park authority immediately.'
    },
    {
      'question': 'Can I chat directly with the tourists?',
      'answer': 'Yes, once a booking is confirmed, a chat option will become available. You can communicate regarding pick-up points and trip timing.'
    },
  ];

  void _copyToClipboard(String text, String label) {
    Clipboard.setData(ClipboardData(text: text));

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$label copied to clipboard!'),
        backgroundColor: AppColors.primary,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _submitSupportTicket() async {

    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSubmitting = true;
    });

    await Future.delayed(const Duration(seconds: 2));

    if (!mounted) return;
    setState(() {
      _isSubmitting = false;
    });

    _subjectController.clear();
    _messageController.clear();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: const [
            Icon(Icons.check_circle_outline, color: AppColors.primary, size: 28),
            SizedBox(width: 10),
            Text('Ticket Submitted', style: TextStyle(fontWeight: FontWeight.bold)),
          ],
        ),
        content: const Text(
          'Thank you for contacting GuideLanka Support. Our administrators will review your ticket and get back to you via your registered email shortly.',
          style: TextStyle(fontSize: 15),
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgSand,

      appBar: AppBar(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        title: const Text('Help & Support', style: TextStyle(fontWeight: FontWeight.bold)),
        elevation: 0,
        centerTitle: true,
      ),

      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [

            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 20),
              decoration: const BoxDecoration(
                gradient: AppGradients.primaryGradient,
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(30),
                  bottomRight: Radius.circular(30),
                ),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'How can we help you?',
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Find answers to your questions or submit a ticket to the GuideLanka admin team.',
                    style: TextStyle(fontSize: 13, color: Colors.white70),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 20),
              child: Text(
                'Frequently Asked Questions',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87),
              ),
            ),
            const SizedBox(height: 12),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _faqs.length,
                itemBuilder: (context, index) {
                  final faq = _faqs[index];
                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.black.withValues(alpha: 0.03)),
                      boxShadow: AppShadows.softCardShadow,
                    ),
                    child: Theme(
                      data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
                      child: ExpansionTile(
                        leading: const Icon(Icons.help_outline, color: AppColors.primary),
                        title: Text(
                          faq['question']!,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.textDark),
                        ),
                        iconColor: AppColors.primary,
                        collapsedIconColor: AppColors.textLight,
                        childrenPadding: const EdgeInsets.only(left: 16, right: 16, bottom: 16),
                        children: [
                          Text(
                            faq['answer']!,
                            style: const TextStyle(fontSize: 13, color: AppColors.textMuted, height: 1.4),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),

            const SizedBox(height: 24),

            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 20),
              child: Text(
                'Contact Details',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87),
              ),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: AppShadows.softCardShadow,
                ),
                child: Material(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  clipBehavior: Clip.antiAlias,
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.black.withValues(alpha: 0.03)),
                    ),
                    child: Column(
                      children: [

                        ListTile(
                          leading: const Icon(Icons.phone_in_talk, color: AppColors.primary),
                          title: const Text('Call Park Administration', style: TextStyle(fontSize: 13, color: AppColors.textMuted)),
                          subtitle: const Text('+94 11 234 5678', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.textDark)),
                          trailing: IconButton(
                            icon: const Icon(Icons.copy, size: 20, color: AppColors.textMuted),
                            onPressed: () => _copyToClipboard('+94 11 234 5678', 'Phone number'),
                          ),
                        ),
                        const Divider(height: 24, thickness: 0.8),

                        ListTile(
                          leading: const Icon(Icons.email_outlined, color: AppColors.primary),
                          title: const Text('Email Support Desk', style: TextStyle(fontSize: 13, color: AppColors.textMuted)),
                          subtitle: const Text('support@guidelanka.com', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.textDark)),
                          trailing: IconButton(
                            icon: const Icon(Icons.copy, size: 20, color: AppColors.textMuted),
                            onPressed: () => _copyToClipboard('support@guidelanka.com', 'Email address'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),

            const SizedBox(height: 24),

            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 20),
              child: Text(
                'Submit a Support Ticket',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87),
              ),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.black.withValues(alpha: 0.03)),
                  boxShadow: AppShadows.softCardShadow,
                ),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [

                      TextFormField(
                        controller: _subjectController,
                        style: const TextStyle(color: AppColors.textDark),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Please enter a subject';
                          }
                          return null;
                        },
                        decoration: InputDecoration(
                          labelText: 'Subject',
                          labelStyle: const TextStyle(color: AppColors.textMuted),
                          prefixIcon: const Icon(Icons.title, color: AppColors.primary),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: Colors.grey.shade300),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: AppColors.primary, width: 2),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      TextFormField(
                        controller: _messageController,
                        maxLines: 4,
                        style: const TextStyle(color: AppColors.textDark),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Please describe your query or problem';
                          }
                          return null;
                        },
                        decoration: InputDecoration(
                          labelText: 'Describe your issue...',
                          labelStyle: const TextStyle(color: AppColors.textMuted),
                          alignLabelWithHint: true,
                          prefixIcon: const Padding(
                            padding: EdgeInsets.only(bottom: 50.0),
                            child: Icon(Icons.message_outlined, color: AppColors.primary),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: Colors.grey.shade300),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: AppColors.primary, width: 2),
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),

                      ElevatedButton(
                        onPressed: _isSubmitting ? null : _submitSupportTicket,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: _isSubmitting
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                              )
                            : const Text('Submit Ticket', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}
