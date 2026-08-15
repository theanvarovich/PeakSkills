import { createClient } from '@supabase/supabase-js';
import { candidates, employers, vacancies } from './ui/src/lib/data';

// ==========================================
// PEAKSKILLS SUPABASE SEED SCRIPT
// Run with: npx ts-node seed.ts
// Requires SUPABASE_SERVICE_ROLE_KEY to bypass RLS and create auth users
// ==========================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // Must be service role

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    if (!supabaseUrl || !supabaseKey) {
        console.error("Missing Supabase credentials in environment. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
        return;
    }
    
    console.log("Starting DB Seed Process...");
    
    // 1. Seed Employers
    console.log(`Seeding ${employers.length} employers...`);
    for (const emp of employers) {
        // Create Mock Auth User
        const { data: authUser } = await supabase.auth.admin.createUser({
            email: `admin@${emp.id}.com`,
            password: 'password123',
            email_confirm: true,
        });
        
        if (authUser?.user) {
            await supabase.from('user_roles').insert({ id: authUser.user.id, role: 'employer' });
            await supabase.from('employers').insert({
                id: authUser.user.id, // Using real UUID now
                company_name: emp.company_name,
                industry: emp.industry,
                description: emp.description,
                location: emp.location,
            });
        }
    }
    
    console.log("Seeding complete. (Note: Extend to include Candidates/Vacancies dynamically mapping new UUIDs).");
}

seed();
