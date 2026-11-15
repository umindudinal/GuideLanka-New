# GuideLanka: Booking notifications when driver app is closed

## Existing mobile integration
The Flutter driver app already uses `onesignal_flutter` and initializes OneSignal in `driver_mobile/lib/main.dart`. When a driver signs in, `driver_mobile/lib/screens/login_screen.dart` calls `OneSignal.login(driverId)`. The backend uses this **exact user ID** to target a push notification.

## Configure backend environment (Vercel environment variables)
- `ONESIGNAL_APP_ID`: The **same** OneSignal App ID already used by the Flutter app (`main.dart`).
- `ONESIGNAL_REST_API_KEY`: OneSignal REST API key. Server only; NEVER put it in Flutter, web frontend, or Git.
- `BOOKING_WEBHOOK_SECRET`: Generate a long random secret (at least 32 random bytes). Server only.

Redeploy backend after setting variables. Do not commit real secrets.

## Configure Supabase Database Webhook
Supabase Dashboard > Database > Webhooks > Create a new hook:
- Name: `notify_driver_on_booking_insert`
- Table: `public.bookings`
- Event: `INSERT` **only**
- Type: HTTP Request
- Method: POST
- URL: `https://guide-lanka-backend.vercel.app/api/notifications/booking-created` (change if deployed elsewhere)
- HTTP Headers: `Content-Type: application/json`, `x-guide-webhook-secret: <BOOKING_WEBHOOK_SECRET>`

This is required because the tourist React frontend inserts bookings directly into Supabase rather than always using the Express booking endpoint.

## End-to-end test
1. Configure platform push credentials (Firebase/FCM for Android, APNs for iOS) inside the OneSignal dashboard. Ensure notification permission is granted on the driver's phone.
2. Sign in to the Flutter app as a driver, then close or background the app. Do **not** force-stop the Android app in system settings.
3. As a tourist, create a valid PENDING booking with that driver_id.
4. Confirm the driver's device gets `New safari booking!` with booking date and slot.
5. Confirm a booking for another driver does not notify this driver. Confirm rejected inserts and booking updates do not trigger this INSERT hook.
6. Test on actual Android/iOS devices with notification permissions, internet connectivity and non-disabled system notifications.

## Important limitations / follow-up work
- This implementation sends push for **new PENDING booking inserts**; not booking cancellations or status updates.
- Delivery depends on OneSignal subscription, correct external user ID, OS notification permission, push platform setup, internet and device policy. It can work while the app is closed, but is not guaranteed when force-stopped, offline, or notifications blocked.
- The endpoint authenticates with a shared secret and only handles Supabase INSERT-shaped payloads. Restrict/rotate the secret as needed.
- OneSignal API acceptance does not mean the phone displayed the notification.
- For robust guaranteed-once processing and retry handling, use an event outbox table plus queue/worker; OneSignal API idempotency is used when booking IDs are UUIDs.
- Mobile push-click deep-link handling has not been added yet; notification opens the app by normal OS behavior.
