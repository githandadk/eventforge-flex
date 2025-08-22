-- Add RLS policies for admin users to manage events
CREATE POLICY "Admin can insert events" 
ON public.events 
FOR INSERT 
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1
  FROM profiles p
  WHERE p.user_id = auth.uid() 
  AND p.role = ANY (ARRAY['admin'::text, 'staff'::text])
));

CREATE POLICY "Admin can update events" 
ON public.events 
FOR UPDATE 
TO authenticated
USING (EXISTS (
  SELECT 1
  FROM profiles p
  WHERE p.user_id = auth.uid() 
  AND p.role = ANY (ARRAY['admin'::text, 'staff'::text])
));

CREATE POLICY "Admin can delete events" 
ON public.events 
FOR DELETE 
TO authenticated
USING (EXISTS (
  SELECT 1
  FROM profiles p
  WHERE p.user_id = auth.uid() 
  AND p.role = ANY (ARRAY['admin'::text, 'staff'::text])
));