const { registerUser, sendEmailOtp } = require('./src/controllers/authController');
const supabase = require('./src/config/supabaseClient');
const fs = require('fs');
const path = require('path');

async function test() {
  const testEmail = `test_driver_${Date.now()}@example.com`;

  console.log("Step 1: Requesting OTP for test driver email:", testEmail);
  let otpCode = '';
  const mockResOtp = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.data = data;
      if (data.otp) otpCode = data.otp;
      return this;
    }
  };

  await sendEmailOtp({
    body: { email: testEmail }
  }, mockResOtp);

  console.log("OTP Sent result status:", mockResOtp.statusCode);
  console.log("Generated OTP:", otpCode);

  if (!otpCode) {
    console.error("Failed to generate OTP code.");
    process.exit(1);
  }

  console.log("\nStep 2: Calling registerUser with mock data and base64 profile image...");
  const mockBase64Image = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

  const mockReqRegister = {
    body: {
      full_name: "Test Driver Photo Upload",
      email: testEmail,
      password: "TestPassword123",
      role: "DRIVER",
      phone_number: "+94771112222",
      vehicle_id: "WP-LH-9999",
      verification_code: otpCode,
      profile_image: mockBase64Image
    }
  };

  let registeredUser = null;
  const mockResRegister = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.data = data;
      if (data.user) registeredUser = data.user;
      return this;
    }
  };

  await registerUser(mockReqRegister, mockResRegister);

  console.log("Register result status:", mockResRegister.statusCode);

  if (mockResRegister.statusCode !== 201 || !registeredUser) {
    console.error("Failed to register driver:", mockResRegister.data);
    process.exit(1);
  }

  const driverId = registeredUser.id;
  console.log("Registered Driver ID:", driverId);

  console.log("\nStep 3: Checking Supabase Database for profile_image column...");
  const { data: dbUser, error: dbError } = await supabase
    .from('users')
    .select('profile_image')
    .eq('id', driverId)
    .single();

  let dbCheckPassed = false;
  if (dbError) {
    console.error("Database check error:", dbError.message);
  } else {
    dbCheckPassed = dbUser && dbUser.profile_image?.startsWith("data:image/gif;base64");
    console.log("Database contains profile_image:", !!dbUser?.profile_image);
    console.log("Profile image matches mock base64 prefix:", dbCheckPassed);
  }

  console.log("\nStep 4: Checking local filesystem for uploaded avatar...");
  const filePath = path.join(__dirname, 'uploads/avatars', `${driverId}.jpg`);
  const fileExists = fs.existsSync(filePath);
  console.log("Filesystem contains avatar file:", fileExists);

  console.log("\nStep 5: Cleaning up test data from Supabase and filesystem...");
  await supabase.from('driver_profiles').delete().eq('id', driverId);
  await supabase.from('users').delete().eq('id', driverId);
  if (fileExists) {
    fs.unlinkSync(filePath);
    console.log("Cleaned up filesystem image.");
  }
  console.log("Cleaned up database records.");

  if (dbCheckPassed && fileExists) {
    console.log("\n=========================================");
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉");
    console.log("=========================================");
  } else {
    console.error("\n❌ Some verification checks failed.");
    process.exit(1);
  }
}

test().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
