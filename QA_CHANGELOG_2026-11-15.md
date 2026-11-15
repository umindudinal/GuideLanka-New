# GuideLanka targeted fixes and QA notes (2026-11-15)

## Source-reviewed findings
1. Tourist BookingForm writes directly to Supabase, bypassing the Express createBooking endpoint. Backend-only validation cannot protect this flow.
2. Existing driver slot checks excluded PENDING reservations. Same-slot reservations could be duplicated while pending.
3. DriversList labeled any confirmed booking *today* as "On Safari" regardless of time; no selected-date/slot context.
4. Reviews come from `driver_reviews` data; `backend/scripts/seed_sample_drivers.js` inserts synthetic driver reviews. Removing UI defaults does not remove previously seeded review records.
5. Mobile map already fetches sightings every 15 seconds and has road-graph-based S2R routing, but previously required manual marker selection and had no nearby-notification behavior.

## Changes in this ZIP
- `backend/src/controllers/bookingController.js`: rejects malformed/missing dates and past Sri Lanka dates, validates slot, includes PENDING in driver slot conflicts.
- `tourist-web-app/src/components/booking/BookingForm.jsx`: uses Sri Lanka date for date minimum/validation and includes PENDING when checking driver availability.
- `tourist-web-app/src/pages/DriversList.jsx`: counts PENDING/APPROVED bookings in the "Booked Today" indicator instead of claiming the driver is on safari. Does not indiscriminately disable all future dates.
- `tourist-web-app/src/components/driver/DriverCard.jsx`: displays "New Guide · No reviews yet" when no review exists instead of an undefined/fabricated rating.
- `backend/migrations/20261115_booking_integrity.sql`: **not executed**. Intended Supabase trigger to validate dates and enforce per-driver/per-tourist date-and-slot overlap rules, with transaction-level locks against concurrent insert races. Requires schema review and database backup before running.
- `driver_mobile/lib/screens/safari_map_screen.dart`: attempts foreground nearby in-app snackbar notifications on newly observed sightings within 5 km of genuine GPS position and suggests the shortest S2R road route among nearby sightings. Polls roughly every 15 seconds. Requires Flutter/device validation; NOT OS-level/background push notifications. Routing only works when graph and GPS have loaded. Radius is provisional.
- `backend/tests/booking-rules.test.js`: four pure slot-logic unit scenarios (pass); they do **not** exercise a real database.

## Verification performed
- `node --test backend/tests/booking-rules.test.js`: 4 passed, 0 failed.
- `node --check backend/src/controllers/bookingController.js`: passed.

## Not yet verified / unresolved
- No real Supabase access or authentication credentials, so migrations, booking transactions, reviews, live user roles and RLS policies have not been tested.
- Browser E2E / full tourist app build was not run; Flutter SDK absent, so mobile code not compiled. Backend/frontend integrations remain unverified.
- UI can still show records previously inserted by the sample driver seeding script. Identify demo-only accounts/rows before removal; NEVER mass-delete genuine customer reviews.
- Real push notifications to phones in the background require FCM/APNs and a secure driver-geolocation / delivery pipeline; not implemented.
- A production booking system should centralize booking writes via authenticated server or an audited Supabase RPC / RLS setup. Existing direct writes mean DB trigger and RLS are essential.
- Existing map graph forcibly connects disconnected components in routing service; validate paths against legal park roads with real device tests before describing any route as navigable.
- `PENDING` blocks driver times in this version to prevent double booking. Decide reservation expiration/driver-decline policy before production rollout.
- Backend server timezone and tourist browser can differ; current date checks have been aligned to Asia/Colombo, but account for cutoff times if same-day morning safaris should close after the morning start.

## Manual QA checklist (in staging database)
| ID | Test | Expected |
|---|---|---|
| BK-01 | Past date (yesterday) | rejected both UI and database |
| BK-02 | Today / future date | allowed subject to slot |
| BK-03 | Driver A 10 Dec morning pending, another morning | rejected |
| BK-04 | Driver A 10 Dec morning, same day evening | allowed |
| BK-05 | Driver A 10 Dec morning, 11 Dec morning | allowed |
| BK-06 | Full-day conflicts with both slots on same date | rejected |
| BK-07 | Concurrent same-driver same-date same-slot inserts | at most one succeeds |
| BK-08 | Canceled/rejected booking | slot becomes available |
| BK-09 | Tourist tries overlapping bookings | rejected |
| RV-01 | New driver with zero real reviews | New Guide / No reviews yet |
| RV-02 | Driver has 2 real reviews | average and review count accurate |
| RV-03 | Historical sample reviews | audited separately, not mistaken as authentic |
| ST-01 | Two drivers with active app, new sighting within 5 km | driver B receives foreground snack-bar on next fetch |
| ST-02 | Two sightings ahead/behind on road network | route recommendation uses shortest road distance |
| ST-03 | No GPS / no offline connectivity | no misleading GPS-based nearby alert |
| ST-04 | Sightings outside range or expired | not recommended |
| ST-05 | App backgrounded / killed | no push promised (not implemented) |

**Deployment order:** Back up DB → inspect existing bookings and schema → evaluate SQL trigger on staging → test RLS/access → run browser and Flutter integration tests → deploy client + server together.
