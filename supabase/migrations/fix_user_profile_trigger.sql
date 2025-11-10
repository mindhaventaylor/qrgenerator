-- Migration: fix_user_profile_trigger
-- Fix the handle_new_user function to handle conflicts and errors better
-- No trial periods - users must subscribe to use the service

-- Drop and recreate the function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile, ignoring conflicts (in case trigger fires multiple times)
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

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

