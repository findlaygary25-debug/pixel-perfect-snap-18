import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ABTestVariant {
  variant_name: string;
  message_title: string;
  message_body: string;
  cta_text: string | null;
  cta_link: string | null;
}

interface UseABTestNotificationResult {
  variant: ABTestVariant | null;
  loading: boolean;
  trackView: () => Promise<void>;
  trackClick: () => Promise<void>;
  trackConversion: () => Promise<void>;
}

export function useABTestNotification(
  testId: string | null,
  notificationType: string
): UseABTestNotificationResult {
  const [variant, setVariant] = useState<ABTestVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    initUser();
  }, []);

  useEffect(() => {
    if (!testId || !userId) {
      setLoading(false);
      return;
    }

    const assignVariant = async () => {
      try {
        // Check if there's an active test for this notification type
        const { data: activeTest } = await supabase
          .from('notification_ab_tests')
          .select('id, status')
          .eq('id', testId)
          .eq('status', 'active')
          .single();

        if (!activeTest) {
          console.log('No active test found');
          setLoading(false);
          return;
        }

        // Call edge function to assign variant
        const { data, error } = await supabase.functions.invoke('assign-ab-test-variant', {
          body: { testId, userId }
        });

        if (error) throw error;

        if (data?.success && data?.assignment?.notification_test_variants) {
          setVariant(data.assignment.notification_test_variants);
        }
      } catch (error) {
        console.error('Error assigning A/B test variant:', error);
      } finally {
        setLoading(false);
      }
    };

    assignVariant();
  }, [testId, userId]);

  const trackEvent = async (eventType: 'viewed' | 'clicked' | 'converted') => {
    if (!testId || !userId) return;

    try {
      const { error } = await supabase.functions.invoke('track-ab-test-event', {
        body: { testId, userId, eventType }
      });

      if (error) throw error;
      console.log(`Tracked ${eventType} event for A/B test`);
    } catch (error) {
      console.error(`Error tracking ${eventType} event:`, error);
    }
  };

  const trackView = async () => trackEvent('viewed');
  const trackClick = async () => trackEvent('clicked');
  const trackConversion = async () => trackEvent('converted');

  return {
    variant,
    loading,
    trackView,
    trackClick,
    trackConversion,
  };
}
