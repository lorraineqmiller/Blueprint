// Emails a 6-digit code to a school address so the signed-in user can join
// that school's community. The code itself is checked in the database by
// verify_school_email() (see migrations/0007) — this function only issues
// it, because issuing needs two things a browser must never hold: the
// service-role key (to write the code hash) and the email API key.
//
// Deploy:   supabase functions deploy send-school-verification
// Secrets:  supabase secrets set RESEND_API_KEY=re_... EMAIL_FROM="Blueprint <verify@yourdomain.com>"
// (SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are provided automatically.)
import { createClient } from 'npm:@supabase/supabase-js@2'

const CODE_TTL_MINUTES = 15
const RESEND_COOLDOWN_SECONDS = 60

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function reply(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}

async function sha256Hex(input: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function sixDigitCode() {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000
  return String(n).padStart(6, '0')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return reply(405, { error: 'Method not allowed' })

  const url = Deno.env.get('SUPABASE_URL')!
  const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const { data: auth } = await userClient.auth.getUser()
  const user = auth.user
  if (!user) return reply(401, { error: 'Sign in first.' })

  const { email: rawEmail } = await req.json().catch(() => ({ email: '' }))
  const email = String(rawEmail ?? '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply(400, { error: 'Enter a valid email address.' })

  const domain = email.split('@')[1]
  const { data: domains, error: domainsError } = await admin.from('community_domains').select('domain')
  if (domainsError) return reply(500, { error: 'Something went wrong. Try again.' })
  const supported = (domains ?? []).some((d: { domain: string }) => domain === d.domain || domain.endsWith(`.${d.domain}`))
  if (!supported) return reply(400, { error: "That school isn't on Blueprint yet — right now it's Columbia and Barnard emails only." })

  const { data: taken } = await admin
    .from('school_email_verifications')
    .select('user_id')
    .ilike('email', email)
    .neq('user_id', user.id)
    .maybeSingle()
  if (taken) return reply(409, { error: 'That school email is already linked to another account.' })

  const { data: existing } = await admin
    .from('school_email_verifications')
    .select('code_sent_at')
    .eq('user_id', user.id)
    .maybeSingle()
  if (existing?.code_sent_at && Date.now() - new Date(existing.code_sent_at).getTime() < RESEND_COOLDOWN_SECONDS * 1000) {
    return reply(429, { error: 'A code was just sent — give it a minute before asking for another.' })
  }

  const code = sixDigitCode()
  const now = new Date()
  const { error: upsertError } = await admin.from('school_email_verifications').upsert(
    {
      user_id: user.id,
      pending_email: email,
      code_hash: await sha256Hex(`${code}:${user.id}`),
      code_expires_at: new Date(now.getTime() + CODE_TTL_MINUTES * 60_000).toISOString(),
      code_sent_at: now.toISOString(),
      attempts: 0,
    },
    { onConflict: 'user_id' },
  )
  if (upsertError) return reply(500, { error: 'Something went wrong. Try again.' })

  const sent = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: Deno.env.get('EMAIL_FROM'),
      to: email,
      subject: `${code} is your Blueprint school code`,
      text: `Your code is ${code}. It expires in ${CODE_TTL_MINUTES} minutes.\n\nIf you didn't ask to link this email to a Blueprint account, you can ignore this message.`,
      html: `<div style="font-family:system-ui,sans-serif;max-width:420px">
        <p style="font-size:14px;color:#444">Enter this code in Blueprint to join your school community:</p>
        <p style="font-size:32px;letter-spacing:6px;font-weight:600;margin:16px 0">${code}</p>
        <p style="font-size:12px;color:#888">It expires in ${CODE_TTL_MINUTES} minutes. If you didn't ask for this, you can ignore it.</p>
      </div>`,
    }),
  })
  if (!sent.ok) {
    console.error('resend failed', sent.status, await sent.text())
    return reply(502, { error: "Couldn't send the email. Try again in a moment." })
  }

  return reply(200, { ok: true })
})
