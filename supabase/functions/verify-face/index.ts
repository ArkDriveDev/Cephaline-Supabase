import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // 1. Handle CORS for web requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    })
  }

  try {
    const { user_id, image_data } = await req.json()
    
    // 2. Initialize Supabase
    const supabase = createClient(
      Deno.env.get('VITE_SUPABASE_URL')!,
      Deno.env.get('VITE_SUPABASE_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // 3. Mock verification (replace with real logic)
    return new Response(
      JSON.stringify({ verified: true, confidence: 0.95 }), 
      {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*' 
        },
      }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }), 
      { 
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' } 
      }
    )
  }
})