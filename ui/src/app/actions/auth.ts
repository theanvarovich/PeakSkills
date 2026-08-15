'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

// ─────────────────────────────────────────────────────────────────────────────
// SECURITY: The admin client is ONLY constructed in this server-side file.
// The SUPABASE_SERVICE_ROLE_KEY is NEVER exposed to the browser or client code.
// ─────────────────────────────────────────────────────────────────────────────
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Supabase service role configuration missing.')
  }
  return createAdminClient(url, key)
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────────────────────
export async function loginAction(formData: FormData) {
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  if (!email || !password) {
    redirect('/login?error=missing_fields')
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    console.error('Login failed:', error.message)
    if (error.message.toLowerCase().includes('email not confirmed')) {
      redirect('/login?error=email_not_confirmed')
    }
    redirect('/login?error=invalid_credentials')
  }

  // Determine role and redirect accordingly
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?error=invalid_credentials')

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('id', user!.id)
    .single()

  const role = roleData?.role

  if (role === 'employer') {
    redirect('/employer')
  } else {
    redirect('/dashboard')
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────────────────────────────────────
export async function registerAction(formData: FormData) {
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  const type = formData.get('type') as string   // 'employer' | 'candidate'
  const name = (formData.get('name') as string)?.trim()

  // ── Validation ────────────────────────────────────────────────────────────
  if (!email || !password || !name) {
    redirect('/register?error=missing_fields')
  }

  if (password.length < 6) {
    redirect(`/register?type=${type}&error=password_too_short`)
  }

  if (!['candidate', 'employer'].includes(type)) {
    redirect('/register?error=invalid_role')
  }

  // ── Sign Up ───────────────────────────────────────────────────────────────
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: type,
        full_name: name,
      },
    },
  })

  if (error) {
    console.error('Register failed:', error.message)

    const msg = error.message.toLowerCase()

    // Duplicate email
    if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('email address is already')) {
      redirect(`/register?type=${type}&error=email_taken`)
    }

    // Rate limiting
    if (msg.includes('rate limit') || msg.includes('too many')) {
      redirect(`/register?type=${type}&error=rate_limited`)
    }

    // Invalid email format (Supabase validates email domains/format)
    if (msg.includes('is invalid') || msg.includes('invalid email')) {
      redirect(`/register?type=${type}&error=invalid_email`)
    }

    redirect(`/register?type=${type}&error=failed`)
  }

  if (!data.user) {
    redirect(`/register?type=${type}&error=failed`)
  }

  // ── Seed profile rows via service role (bypasses RLS for initial creation) ──
  // This is the correct pattern: service-role operations stay server-side only.
  const admin = getAdminClient()

  // Insert user role (admin-authoritative, no client can assign arbitrary roles)
  const { error: roleError } = await admin
    .from('user_roles')
    .upsert({ id: data.user.id, role: type })

  if (roleError) {
    console.error('user_roles upsert failed:', roleError.message)
  }

  if (type === 'employer') {
    const { error: empError } = await admin.from('employers').upsert({
      id: data.user.id,
      company_name: name,
      industry: 'Technology',
      location: 'Tashkent, Uzbekistan',
    })
    if (empError) {
      console.error('employers upsert failed:', empError.message)
    }
  } else {
    const firstName = name.split(' ')[0] || name
    const lastName = name.split(' ').slice(1).join(' ') || ''

    const { error: candError } = await admin.from('candidates').upsert({
      id: data.user.id,
      first_name: firstName,
      last_name: lastName,
      candidate_type: 'professional',
      location: 'Tashkent',
      headline: 'New Member',
      cv_summary: 'Newly registered.',
      experience_years: 0,
    })
    if (candError) {
      console.error('candidates upsert failed:', candError.message)
    }
  }

  // ── Handle email confirmation state ──────────────────────────────────────
  // If the user has a session it means email confirmation is disabled — redirect
  // straight to their dashboard. Otherwise send them to a confirmation notice page.
  if (data.session) {
    redirect(type === 'employer' ? '/employer' : '/dashboard')
  } else {
    // Email confirmation is enabled. Do NOT pretend the user is authenticated.
    redirect(`/register/confirm?email=${encodeURIComponent(email)}`)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────────────────────────────────────
export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
