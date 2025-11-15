-- Create advertisements table
CREATE TABLE public.advertisements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  advertiser_id UUID NOT NULL,
  referred_by UUID,
  title TEXT NOT NULL,
  description TEXT,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'video',
  amount_spent NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

-- Policies for advertisements
CREATE POLICY "Active ads are viewable by everyone"
ON public.advertisements
FOR SELECT
USING (status = 'active' AND start_date <= now() AND (end_date IS NULL OR end_date >= now()));

CREATE POLICY "Advertisers can view their own ads"
ON public.advertisements
FOR SELECT
USING (auth.uid() = advertiser_id);

CREATE POLICY "Users can create their own ads"
ON public.advertisements
FOR INSERT
WITH CHECK (auth.uid() = advertiser_id);

CREATE POLICY "Advertisers can update their own ads"
ON public.advertisements
FOR UPDATE
USING (auth.uid() = advertiser_id);

-- Trigger for updated_at
CREATE TRIGGER update_advertisements_updated_at
BEFORE UPDATE ON public.advertisements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create ad_commissions table to track affiliate earnings from ads
CREATE TABLE public.ad_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID NOT NULL REFERENCES public.advertisements(id) ON DELETE CASCADE,
  affiliate_id UUID NOT NULL,
  advertiser_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  commission_rate NUMERIC NOT NULL DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ad_commissions ENABLE ROW LEVEL SECURITY;

-- Policies for ad_commissions
CREATE POLICY "Users can view their own ad commissions"
ON public.ad_commissions
FOR SELECT
USING (auth.uid() = affiliate_id);

CREATE POLICY "System can create ad commissions"
ON public.ad_commissions
FOR INSERT
WITH CHECK (true);

-- Create storage bucket for ad videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('advertisements', 'advertisements', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for advertisements
CREATE POLICY "Users can upload their own ad videos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'advertisements' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Ad videos are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'advertisements');

CREATE POLICY "Users can update their own ad videos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'advertisements' AND auth.uid()::text = (storage.foldername(name))[1]);