-- Restrict public access to profiles and allow only authenticated users to read
-- 1) Drop overly-permissive public SELECT policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- 2) Create a safer policy limited to authenticated users
CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Keep existing insert/update policies unchanged:
-- "Users can insert their own profile" (INSERT with CHECK auth.uid() = id)
-- "Users can update their own profile" (UPDATE with USING auth.uid() = id)
