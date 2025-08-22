-- Create event_fees table for centralized fee management
CREATE TABLE public.event_fees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  category TEXT NOT NULL,
  code TEXT NOT NULL,
  label TEXT NOT NULL,
  unit TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, code)
);

-- Enable Row Level Security
ALTER TABLE public.event_fees ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public read event fees" 
ON public.event_fees 
FOR SELECT 
USING (true);

CREATE POLICY "Admin manage event fees" 
ON public.event_fees 
FOR ALL 
USING (EXISTS ( 
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() 
  AND p.role IN ('admin', 'staff')
))
WITH CHECK (EXISTS ( 
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() 
  AND p.role IN ('admin', 'staff')
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_event_fees_updated_at
BEFORE UPDATE ON public.event_fees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample fees for East Coast Korean Camp Meeting 2026
-- First, get the event ID (assuming it exists, otherwise this will need to be run after event creation)
DO $$
DECLARE
    event_uuid UUID;
BEGIN
    -- Try to find the event by name, or use a placeholder
    SELECT id INTO event_uuid FROM events WHERE name ILIKE '%East Coast Korean Camp Meeting 2026%' LIMIT 1;
    
    -- If no event found, we'll insert with a placeholder that can be updated later
    IF event_uuid IS NULL THEN
        event_uuid := '00000000-0000-0000-0000-000000000000'::UUID;
    END IF;
    
    -- Insert the fees
    INSERT INTO public.event_fees (event_id, category, code, label, unit, amount) VALUES
    -- Room types
    (event_uuid, 'lodging', 'AC', 'AC Room', 'night', 90.00),
    (event_uuid, 'lodging', 'NON_AC', 'Non-AC Room', 'night', 60.00),
    
    -- Meals
    (event_uuid, 'meal', 'BREAKFAST', 'Breakfast', 'person', 15.00),
    (event_uuid, 'meal', 'LUNCH', 'Lunch', 'person', 25.00),
    (event_uuid, 'meal', 'DINNER', 'Dinner', 'person', 30.00),
    (event_uuid, 'meal', 'DAILY_MEAL', 'Daily Meal Plan', 'person', 65.00),
    
    -- Registration and other fees
    (event_uuid, 'registration', 'BASE_FEE', 'Base Registration Fee', 'person', 60.00),
    (event_uuid, 'lodging', 'KEY_DEPOSIT', 'Key Deposit', 'key', 50.00),
    (event_uuid, 'shuttle', 'SHUTTLE', 'Airport Shuttle', 'trip', 25.00),
    (event_uuid, 'surcharge', 'EM_VBS', 'EM/VBS Department Surcharge', 'person', 30.00);
END $$;