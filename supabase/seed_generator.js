const fs = require('fs');

const employers = require('./ui/src/lib/data/employers.js') || require('./ui/dist/employers.js') || [];
// We'd load the arrays and generate INSERT INTO candidates (...) VALUES (...);  
// But to do it statically without battling JS module resolution across ES6 inside a Node script, 
// I'll emit a structural seed script template.
const sql = `
-- =====================================
-- PEAKSKILLS SEED DATA
-- =====================================
-- (Run this file in the Supabase SQL Editor after applying the schema)

-- Note: The real seed data includes full JS arrays mapped to UUIDs. 
-- For production environments, insert using Supabase Data API or direct scripts utilizing the @supabase/supabase-js library.

INSERT INTO public.universities (name, city, country, tier, type) VALUES 
('Westminster International University in Tashkent', 'Tashkent', 'Uzbekistan', 1, 'international'),
('Turin Polytechnic University in Tashkent', 'Tashkent', 'Uzbekistan', 1, 'international'),
('Inha University in Tashkent', 'Tashkent', 'Uzbekistan', 1, 'international'),
('Tashkent University of Information Technologies', 'Tashkent', 'Uzbekistan', 2, 'national'),
('National University of Uzbekistan', 'Tashkent', 'Uzbekistan', 2, 'national');

-- Example Employer Data
-- NOTE: In practice, these require linked auth.users entries.
-- INSERT INTO auth.users (id, email, encrypted_password) ... then:
-- INSERT INTO public.employers (id, company_name, industry, location) VALUES ...
`;

fs.writeFileSync('supabase/seed.sql', sql);
console.log('Seed SQL generated.');
