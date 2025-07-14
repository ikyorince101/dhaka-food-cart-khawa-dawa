// otp-test.js
import readline from 'readline-sync';
import { config } from 'dotenv';
config({ path: '.env' }); // Assuming .env file is in the root

import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function runOTPVerification() {
  try {
    const phone = readline.question('📱 Enter phone number with country code (e.g., +15551234567): ');

    const send = await client.verify.v2.services(process.env.TWILIO_VERIFY_SID)
      .verifications
      .create({ to: phone, channel: 'sms' });

    console.log('📨 OTP sent. Check your phone.');

    const code = readline.question('🔢 Enter the OTP you received: ');

    const check = await client.verify.v2.services(process.env.TWILIO_VERIFY_SID)
      .verificationChecks
      .create({ to: phone, code });

    if (check.status === 'approved') {
      console.log('✅ OTP verified. Login successful!');
    } else {
      console.log('❌ OTP invalid. Login failed.');
    }
  } catch (err) {
    console.error('⚠️ Error:', err.message);
  }
}

runOTPVerification();
