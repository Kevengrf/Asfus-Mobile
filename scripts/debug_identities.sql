-- Inspect identities for the tainted email
SELECT * FROM auth.identities WHERE email = 'kevenwilliam2304@gmail.com';

-- Inspect users for the tainted email (direct query)
SELECT * FROM auth.users WHERE email = 'kevenwilliam2304@gmail.com';

-- Force Clean (use with caution)
-- DELETE FROM auth.identities WHERE email = 'kevenwilliam2304@gmail.com';
-- DELETE FROM auth.users WHERE email = 'kevenwilliam2304@gmail.com';
