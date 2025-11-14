-- Create stores table
CREATE TABLE public.stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  email TEXT,
  phone TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create affiliate_links table (5-tier affiliate system)
CREATE TABLE public.affiliate_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sponsor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create wallets table for VoiceCoin
CREATE TABLE public.wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(20, 8) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create videos table (TikTok-style feed)
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  caption TEXT,
  username TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_stores_user_id ON public.stores(user_id);
CREATE INDEX idx_products_store_id ON public.products(store_id);
CREATE INDEX idx_products_is_active ON public.products(is_active);
CREATE INDEX idx_affiliate_links_user_id ON public.affiliate_links(user_id);
CREATE INDEX idx_affiliate_links_sponsor_id ON public.affiliate_links(sponsor_id);
CREATE INDEX idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX idx_videos_user_id ON public.videos(user_id);
CREATE INDEX idx_videos_created_at ON public.videos(created_at DESC);
CREATE INDEX idx_videos_is_active ON public.videos(is_active);

-- Enable Row Level Security
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stores
CREATE POLICY "Users can view their own store"
  ON public.stores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own store"
  ON public.stores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own store"
  ON public.stores FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own store"
  ON public.stores FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for products (viewable by everyone, manageable by store owner)
CREATE POLICY "Products are viewable by everyone"
  ON public.products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Store owners can view their products"
  ON public.products FOR SELECT
  USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));

CREATE POLICY "Store owners can create products"
  ON public.products FOR INSERT
  WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));

CREATE POLICY "Store owners can update their products"
  ON public.products FOR UPDATE
  USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));

CREATE POLICY "Store owners can delete their products"
  ON public.products FOR DELETE
  USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));

-- RLS Policies for affiliate_links
CREATE POLICY "Users can view their own affiliate link"
  ON public.affiliate_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own affiliate link"
  ON public.affiliate_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own affiliate link"
  ON public.affiliate_links FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for wallets
CREATE POLICY "Users can view their own wallet"
  ON public.wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own wallet"
  ON public.wallets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet"
  ON public.wallets FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for videos
CREATE POLICY "Videos are viewable by everyone"
  ON public.videos FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can view their own videos"
  ON public.videos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own videos"
  ON public.videos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos"
  ON public.videos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos"
  ON public.videos FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_videos_updated_at
  BEFORE UPDATE ON public.videos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();