import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Human from 'https://cdn.jsdelivr.net/npm/@vladmandic/human/dist/human.esm.js'

// Initialize Human.js once
const human = new Human({
  backend: 'webgl',
  modelBasePath: 'https://cdn.jsdelivr.net/npm/@vladmandic/human/models/',
  face: {
    enabled: true,
    detector: { rotation: true },
    recognition: { enabled: true }
  }
})

await human.load() // Load models

serve(async (req) => {
  // CORS Handling
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
    
    // Initialize Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } }
    )

    // 1. Get user's enrolled face
    const { data: enrollment, error } = await supabase
      .from('user_facial_enrollments')
      .select('storage_path')
      .eq('user_id', user_id)
      .single()

    if (error || !enrollment) throw new Error('No facial enrollment found')

    // 2. Download enrolled image from storage
    const { data: enrolledImage } = await supabase.storage
      .from('facial-recognition')
      .download(enrollment.storage_path)

    if (!enrolledImage) throw new Error('Enrolled image not found')

    // 3. Process both images
    const [enrolledTensor, inputTensor] = await Promise.all([
      human.tf.browser.decodeImage(new Uint8Array(await enrolledImage.arrayBuffer())),
      human.tf.browser.decodeImage(new Uint8Array(await fetch(`data:image/jpeg;base64,${image_data}`).then(r => r.arrayBuffer())))
    ])

    const [enrolledResult, inputResult] = await Promise.all([
      human.detect(enrolledTensor),
      human.detect(inputTensor)
    ])

    // 4. Compare faces
    const match = human.compare(enrolledResult.face[0], inputResult.face[0])
    const verified = match > 0.8 // Threshold

    return new Response(
      JSON.stringify({ 
        verified,
        confidence: match,
        landmarks: inputResult.face[0]?.landmark // Optional for UI
      }), 
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
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
      }
    )
  }
})