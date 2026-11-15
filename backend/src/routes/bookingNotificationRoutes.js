const express = require('express');
const { timingSafeEqual } = require('node:crypto');
const router = express.Router();

// Supabase Database Webhook: INSERT on public.bookings.
// A DB webhook is required because the tourist app writes bookings directly to Supabase.
router.post('/booking-created', async (req, res) => {
  const configured = process.env.BOOKING_WEBHOOK_SECRET;
  const received = req.get('x-guide-webhook-secret');
  if (!configured || !received ||
      Buffer.byteLength(configured) !== Buffer.byteLength(received) ||
      !timingSafeEqual(Buffer.from(configured), Buffer.from(received))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const record = req.body?.record;
  if (req.body?.type !== 'INSERT' || !record?.id || !record.driver_id ||
      record.status?.toUpperCase() !== 'PENDING') {
    return res.status(200).json({ ignored: true });
  }

  const appId = process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;
  if (!appId || !apiKey) {
    console.error('Booking push not configured: OneSignal environment variables missing');
    return res.status(503).json({ error: 'Push provider not configured' });
  }

  try {
    const response = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${apiKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
        include_aliases: { external_id: [String(record.driver_id)] },
        target_channel: 'push',
        headings: { en: 'New safari booking!' },
        contents: { en: `You have a new safari request for ${record.booking_date || 'an upcoming date'} (${(record.time_slot || 'safari').split('|')[0]}). Open GuideLanka to review it.` },
        data: { type: 'booking', booking_id: String(record.id) },
        // Avoid duplicate pushes if the webhook is retried.
        ...( /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(String(record.id)) ? { idempotency_key: String(record.id) } : {}),
      }),
      signal: AbortSignal.timeout(12000),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.errors) {
      console.error('OneSignal booking notification failed', response.status, result.errors);
      return res.status(502).json({ error: 'Notification provider rejected request' });
    }
    return res.status(200).json({ delivered_to_provider: true, notification_id: result.id });
  } catch (error) {
    console.error('Booking notification error:', error.message);
    return res.status(502).json({ error: 'Notification provider unavailable' });
  }
});

module.exports = router;
