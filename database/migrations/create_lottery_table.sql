-- Create table for Lottery Periods
CREATE TABLE IF NOT EXISTS public.lottery_periods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.lottery_periods ENABLE ROW LEVEL SECURITY;

-- Allow public read access (so users can see if a date is in a lottery period)
CREATE POLICY "Allow public read access" ON public.lottery_periods
    FOR SELECT USING (true);

-- Allow admins to insert/update/delete
CREATE POLICY "Allow admin full access" ON public.lottery_periods
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM public.profiles WHERE role = 'admin'
        )
    );
