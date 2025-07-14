import express from 'express';
import twilio from 'twilio';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors()); // Enable CORS for all routes

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioVerifySid = process.env.TWILIO_VERIFY_SID;

const twilioClient = twilio(twilioAccountSid, twilioAuthToken);

// Local in-memory store for users
const localUsers = [];
let nextUserId = 1;

app.post('/api/send-otp', async (req, res) => {
  const { phone } = req.body;

  console.log(`Received request to send OTP to phone: ${phone}`);

  if (!phone) {
    console.log('Error: Phone number is required for send-otp.');
    return res.status(400).json({ success: false, error: 'Phone number is required.' });
  }

  try {
    const verification = await twilioClient.verify.v2.services(twilioVerifySid)
      .verifications
      .create({ to: phone, channel: 'sms' });

    console.log('OTP verification initiated successfully:');
    console.log(JSON.stringify(verification, null, 2)); // Log the full verification object

    res.status(200).json({ success: true, verification_sid: verification.sid });
  } catch (error) {
    console.error(`Error sending OTP to ${phone}:`);
    console.error(`Error message: ${error.message}`);
    if (error.code) console.error(`Twilio Error Code: ${error.code}`);
    if (error.moreInfo) console.error(`More Info: ${error.moreInfo}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/verify-otp', async (req, res) => {
  const { phone, code, email, fullName } = req.body;

  console.log(`Received request to verify OTP for phone: ${phone} with code: ${code}`);

  if (!phone || !code) {
    console.log('Error: Phone number and code are required for verify-otp.');
    return res.status(400).json({ success: false, error: 'Phone number and code are required.' });
  }

  try {
    const verificationCheck = await twilioClient.verify.v2.services(twilioVerifySid)
      .verificationChecks
      .create({ to: phone, code: code });

    console.log('OTP verification check result:');
    console.log(JSON.stringify(verificationCheck, null, 2)); // Log the full verificationCheck object

    if (verificationCheck.status === 'approved') {
      console.log(`OTP approved for phone: ${phone}. Proceeding with local user handling.`);
      
      let user;
      let existingUser = localUsers.find(u => u.phone === phone);

      if (existingUser) {
        console.log(`Existing user found for phone: ${phone}. User ID: ${existingUser.id}`);
        user = existingUser;
        // Update existing user if email or fullName provided
        if (email && user.email !== email) user.email = email;
        if (fullName && user.full_name !== fullName) user.full_name = fullName;
        console.log('User updated successfully (in-memory).');
      } else {
        console.log(`No existing user found for phone: ${phone}. Creating new user.`);
        user = {
          id: nextUserId++,
          phone: phone,
          email: email || null,
          full_name: fullName || null,
          created_at: new Date().toISOString(),
        };
        localUsers.push(user);
        console.log(`New user created successfully (in-memory). User ID: ${user.id}`);
      }

      // Generate a simple session ID for the frontend to manage
      const sessionId = user.id;

      res.status(200).json({ success: true, user, session_id: sessionId });
    } else {
      console.log(`OTP verification failed for phone: ${phone}. Status: ${verificationCheck.status}`);
      res.status(400).json({ success: false, error: 'Invalid OTP.' });
    }
  } catch (error) {
    console.error(`Error verifying OTP for phone ${phone}:`);
    console.error(`Error message: ${error.message}`);
    if (error.code) console.error(`Twilio Error Code: ${error.code}`);
    if (error.moreInfo) console.error(`More Info: ${error.moreInfo}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
