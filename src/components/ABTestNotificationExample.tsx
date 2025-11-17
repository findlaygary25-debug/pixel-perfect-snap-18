/**
 * Example component showing how to integrate A/B testing with notifications
 * 
 * This demonstrates:
 * 1. How to use the useABTestNotification hook
 * 2. How to track engagement events (view, click, conversion)
 * 3. How to display notification content from test variants
 */

import { useEffect } from "react";
import { useABTestNotification } from "@/hooks/useABTestNotification";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";

interface ABTestNotificationExampleProps {
  testId: string;
  notificationType: string;
  onAction?: () => void;
}

export function ABTestNotificationExample({ 
  testId, 
  notificationType,
  onAction 
}: ABTestNotificationExampleProps) {
  const { variant, loading, trackView, trackClick, trackConversion } = useABTestNotification(
    testId,
    notificationType
  );

  useEffect(() => {
    // Track view when notification is displayed
    if (variant) {
      trackView();
    }
  }, [variant]);

  if (loading) {
    return <div>Loading notification...</div>;
  }

  if (!variant) {
    // Fallback to standard notification if no test is active
    return (
      <Card>
        <CardHeader>
          <CardTitle>Standard Notification</CardTitle>
          <CardDescription>No A/B test active for this notification type</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleClick = async () => {
    // Track click event
    await trackClick();
    
    // Navigate or perform action
    if (variant.cta_link) {
      window.location.href = variant.cta_link;
    }
    
    if (onAction) {
      onAction();
    }
  };

  const handleConversion = async () => {
    // Track conversion event (e.g., when user makes a purchase, completes signup, etc.)
    await trackConversion();
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{variant.message_title}</CardTitle>
            <CardDescription className="mt-1">{variant.message_body}</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      {variant.cta_text && (
        <CardContent>
          <Button onClick={handleClick} className="w-full">
            {variant.cta_text}
          </Button>
        </CardContent>
      )}

      {/* Example: Track conversion on some other action */}
      {/* <Button onClick={handleConversion}>Complete Action</Button> */}
    </Card>
  );
}

/**
 * Integration Example for Flash Sale Notifications:
 * 
 * ```tsx
 * // In your flash sale trigger or notification component:
 * import { ABTestNotificationExample } from "@/components/ABTestNotificationExample";
 * 
 * // Check if there's an active A/B test for flash sales
 * const { data: activeTest } = await supabase
 *   .from('notification_ab_tests')
 *   .select('id')
 *   .eq('notification_type', 'flash_sale')
 *   .eq('status', 'active')
 *   .single();
 * 
 * // Render the A/B tested notification
 * <ABTestNotificationExample
 *   testId={activeTest?.id}
 *   notificationType="flash_sale"
 *   onAction={() => {
 *     // Navigate to rewards store
 *     navigate('/rewards-store');
 *   }}
 * />
 * ```
 * 
 * Integration Example for In-App Notifications:
 * 
 * ```tsx
 * // When displaying a notification from the notifications table:
 * const notification = {
 *   type: 'flash_sale',
 *   message: 'Default message',
 *   ab_test_id: 'uuid-here' // Store test ID in notification
 * };
 * 
 * // Use the hook to get variant content
 * const { variant } = useABTestNotification(notification.ab_test_id, notification.type);
 * 
 * // Display variant content instead of default
 * const title = variant?.message_title || notification.message;
 * const body = variant?.message_body || notification.message;
 * ```
 */
