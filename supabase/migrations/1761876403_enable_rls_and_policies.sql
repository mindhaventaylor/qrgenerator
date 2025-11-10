-- Migration: enable_rls_and_policies
-- Created at: 1761876403

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_scans ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id OR auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id OR auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR auth.role() IN ('anon', 'service_role'));

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id OR auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Users can insert subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Users can update own subscriptions" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id OR auth.role() IN ('anon', 'service_role'));

-- Payments policies
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id OR auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Users can insert payments" ON payments
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() IN ('anon', 'service_role'));

-- Folders policies
CREATE POLICY "Users can view own folders" ON folders
  FOR SELECT USING (auth.uid() = user_id OR auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Users can insert own folders" ON folders
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Users can update own folders" ON folders
  FOR UPDATE USING (auth.uid() = user_id OR auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Users can delete own folders" ON folders
  FOR DELETE USING (auth.uid() = user_id OR auth.role() IN ('anon', 'service_role'));

-- QR codes policies
CREATE POLICY "Users can view own qr codes" ON qr_codes
  FOR SELECT USING (auth.uid() = user_id OR auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Users can insert own qr codes" ON qr_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Users can update own qr codes" ON qr_codes
  FOR UPDATE USING (auth.uid() = user_id OR auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Users can delete own qr codes" ON qr_codes
  FOR DELETE USING (auth.uid() = user_id OR auth.role() IN ('anon', 'service_role'));

-- QR scans policies (public can insert for tracking, users can view own)
CREATE POLICY "Anyone can insert scan data" ON qr_scans
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view scans of own qr codes" ON qr_scans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM qr_codes 
      WHERE qr_codes.id = qr_scans.qr_code_id 
      AND qr_codes.user_id = auth.uid()
    ) OR auth.role() IN ('anon', 'service_role')
  );

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- No trial subscription - users must subscribe to use the service
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();;