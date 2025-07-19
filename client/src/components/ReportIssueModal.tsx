import React, { useState } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle } from 'lucide-react';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onIssueReported: () => void;
}

export function ReportIssueModal({ isOpen, onClose, order, onIssueReported }: ReportIssueModalProps) {
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const issueTypes = [
    { value: 'wrong_order', label: 'Wrong Order' },
    { value: 'quality_issue', label: 'Food Quality Issue' },
    { value: 'missing_items', label: 'Missing Items' },
    { value: 'late_delivery', label: 'Late Delivery' },
    { value: 'other', label: 'Other Issue' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!issueType || !description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select an issue type and provide a description.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const userSession = localStorage.getItem('user_session');
      if (!userSession) throw new Error('Not authenticated');
      
      const user = JSON.parse(userSession);

      const response = await fetch('/api/customer-issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: user.id,
          orderId: order.id,
          issueType,
          description: description.trim(),
          priority: issueType === 'quality_issue' ? 'high' : 'medium'
        }),
      });

      if (!response.ok) throw new Error('Failed to submit issue');

      toast({
        title: "Issue Reported",
        description: "Your issue has been submitted. We'll investigate and get back to you.",
      });
      
      onIssueReported();
      onClose();
      setIssueType('');
      setDescription('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to submit your issue. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            Report Issue
          </DialogTitle>
          <DialogDescription>
            Tell us about the issue with your order. We'll investigate and get back to you.
          </DialogDescription>
        </DialogHeader>

        {/* Order Info */}
        <div className="bg-card/50 rounded-lg p-3 text-sm">
          <p><strong>Order:</strong> Queue #{order.queue_number}</p>
          <p><strong>Date:</strong> {new Date(order.created_at).toLocaleDateString()}</p>
          <p><strong>Total:</strong> ${order.total_amount}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Issue Type */}
          <div className="space-y-2">
            <Label>What type of issue did you experience?</Label>
            <Select value={issueType} onValueChange={setIssueType}>
              <SelectTrigger>
                <SelectValue placeholder="Select an issue type" />
              </SelectTrigger>
              <SelectContent>
                {issueTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Describe the issue</Label>
            <Textarea
              id="description"
              placeholder="Please provide details about what went wrong..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-warm hover:opacity-90" 
              disabled={submitting || !issueType || !description.trim()}
            >
              {submitting ? 'Submitting...' : 'Submit Issue'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}