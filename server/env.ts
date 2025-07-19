import dotenv from "dotenv";
dotenv.config();

console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID);
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN);
console.log('TWILIO_VERIFY_SID:', process.env.TWILIO_VERIFY_SID); 