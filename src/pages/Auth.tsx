import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ArrowLeft, Mail, User, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = () => {
      const userSession = localStorage.getItem('user_session');
      if (userSession) {
        navigate('/');
      }
    };
    checkUser();
  }, [navigate]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setOtpSent(true);
      toast({
        title: "OTP sent!",
        description: "Check your phone for the verification code.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to send OTP",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    
    setLoading(true);

    try {
      if (otp === '666666') { // Test mode
        const testUser = {
          id: 'test-user-' + Date.now(),
          email: email,
          phone: phone,
          full_name: fullName, // Use full_name for consistency
        };
        localStorage.setItem('user_session', JSON.stringify(testUser));
        localStorage.setItem('test_user', JSON.stringify(testUser)); // Keep for existing logic if needed
        toast({
          title: "Test Login Successful!",
          description: `Welcome ${fullName || email || 'Guest'}! You can now place orders.`,
        });
        window.location.href = '/'; // Full reload to clear old state
        return;
      }

      const response = await fetch('http://localhost:3001/api/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, code: otp, email, fullName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      localStorage.setItem('user_session', JSON.stringify(data.user));
      toast({
        title: "Welcome!",
        description: "You have successfully signed in.",
      });
      navigate('/');

    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Menu
          </Link>
          <ThemeToggle />
        </div>

        <Card className="shadow-warm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl bg-gradient-warm bg-clip-text text-transparent">
              Dhaka Street Food
            </CardTitle>
            <CardDescription>
              Enter your phone number to receive a verification code
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!otpSent ? (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 234 567 8900"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full-name">Full Name (Optional)</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="full-name"
                      type="text"
                      placeholder="Your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-warm hover:opacity-90"
                  disabled={loading}
                >
                  {loading ? 'Sending OTP...' : 'Send Verification Code'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter Verification Code</Label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={(value) => setOtp(value)}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Code sent to {phone}
                  </p>
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    <span className="text-primary">Test mode:</span> Use 666666 for instant login
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-warm hover:opacity-90"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? 'Verifying...' : 'Verify Code'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp('');
                  }}
                >
                  Change Phone Number
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}