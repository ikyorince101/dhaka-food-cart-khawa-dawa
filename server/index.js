import express from 'express';
import twilio from 'twilio';
import dotenv from 'dotenv';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors()); // Enable CORS for all routes

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioVerifySid = process.env.TWILIO_VERIFY_SID;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const twilioClient = twilio(twilioAccountSid, twilioAuthToken);
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

app.post('/api/send-otp', async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ success: false, error: 'Phone number is required.' });
  }

  try {
    const verification = await twilioClient.verify.v2.services(twilioVerifySid)
      .verifications
      .create({ to: phone, channel: 'sms' });

    console.log('OTP verification initiated:', verification.sid);

    res.status(200).json({ success: true, verification_sid: verification.sid });
  } catch (error) {
    console.error('Error sending OTP:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/verify-otp', async (req, res) => {
  const { phone, code, email, fullName } = req.body;

  if (!phone || !code) {
    return res.status(400).json({ success: false, error: 'Phone number and code are required.' });
  }

  try {
    const verificationCheck = await twilioClient.verify.v2.services(twilioVerifySid)
      .verificationChecks
      .create({ to: phone, code: code });

    if (verificationCheck.status === 'approved') {
      // OTP is valid. Now, handle user in Supabase database.
      let user;
      const { data: existingUser, error: fetchError } = await supabase
        .from('users') // Assuming a 'users' table
        .select('*')
        .eq('phone', phone)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
        throw fetchError;
      }

      if (existingUser) {
        // User exists, update if necessary
        user = existingUser;
        const updates = {};
        if (email && existingUser.email !== email) updates.email = email;
        if (fullName && existingUser.full_name !== fullName) updates.full_name = fullName;

        if (Object.keys(updates).length > 0) {
          const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update(updates)
            .eq('id', existingUser.id)
            .select()
            .single();
          if (updateError) throw updateError;
          user = updatedUser;
        }
      } else {
        // New user, insert into database
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            phone: phone,
            email: email || null,
            full_name: fullName || null,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();
        if (insertError) throw insertError;
        user = newUser;
      }

      // Generate a simple session ID for the frontend to manage
      // In a real application, this would be a JWT or a more robust session token
      const sessionId = user.id; // Using user ID as a simple session ID for now

      res.status(200).json({ success: true, user, session_id: sessionId });
    } else {
      res.status(400).json({ success: false, error: 'Invalid OTP.' });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
