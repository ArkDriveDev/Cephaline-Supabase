// File: api/verify-face.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Human from 'https://cdn.jsdelivr.net/npm/@vladmandic/human/dist/human.esm.js'

// Initialize Human.js
const human = new Human({
  backend: 'webgl',
  modelBasePath: 'https://cdn.jsdelivr.net/npm/@vladmandic/human/models/',
  face: {
    enabled: true,
    detector: { rotation: true, return: true },
    recognition: { enabled: true }
  }
})

await human.load()
await human.warmup()
console.log('✅ Human.js models ready')

// Convert base64 to Uint8Array
function processImageData(imageData: string): Uint8Array {
  try {
    const base64 = imageData.startsWith('data:')
      ? imageData.split(',')[1]
      : imageData

    const binaryString = typeof atob !== 'undefined'
      ? atob(base64)
      : Buffer.from(base64, 'base64').toString('binary')

    return new Uint8Array([...binaryString].map(char => char.charCodeAt(0)))
  } catch (err) {
    throw new Error(`Invalid image data: ${err.message}`)
  }
}

serve(async (req) => {
  const allowedOrigins = [
    'https://cephaline-supabase-git-vercel1-arkyroels-projects.vercel.app',
    'https://cephaline-supabase-7s87uxaji-arkyroels-projects.vercel.app',
    'http://localhost:5173'
  ]

  const origin = req.headers.get('origin') || ''
  const isAllowedOrigin = allowedOrigins.includes(origin)

  const corsHeaders = {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Content-Length': '0'
      }
    })
  }

  try {
    const contentType = req.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      throw new Error('Content-Type must be application/json')
    }

    const { user_id, image_data } = await req.json()
    if (!user_id || !image_data) {
      throw new Error('Missing required fields: user_id and image_data')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')
    const authHeader = req.headers.get('Authorization')

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration')
    }
    if (!authHeader) {
      throw new Error('Authorization header required')
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    })

    const { data: enrollment, error: enrollmentError } = await supabase
      .from('user_facial_enrollments')
      .select('storage_path')
      .eq('user_id', user_id)
      .eq('is_active', true)
      .single()

    if (enrollmentError) throw enrollmentError
    if (!enrollment) throw new Error('No active facial enrollment found')

    const { data: enrolledImage, error: downloadError } = await supabase.storage
      .from('facial-recognition')
      .download(enrollment.storage_path)

    if (downloadError) throw downloadError
    if (!enrolledImage) throw new Error('Enrolled image download failed')

    let enrolledTensor, inputTensor
    try {
      const [enrolledArray, inputArray] = await Promise.all([
        new Uint8Array(await enrolledImage.arrayBuffer()),
        processImageData(image_data)
      ])

      enrolledTensor = await human.tf.browser.decodeImage(enrolledArray)
      inputTensor = await human.tf.browser.decodeImage(inputArray)

      const [enrolledResult, inputResult] = await Promise.all([
        human.detect(enrolledTensor),
        human.detect(inputTensor)
      ])

      if (!enrolledResult.face?.[0]) throw new Error('No face found in enrolled image')
      if (!inputResult.face?.[0]) throw new Error('No face detected in uploaded image')

      const match = human.compare(enrolledResult.face[0], inputResult.face[0])
      const threshold = 0.7
      const verified = match > threshold

      return new Response(
        JSON.stringify({
          verified,
          confidence: match,
          faceDetected: true,
          landmarks: inputResult.face[0]?.landmark
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    } finally {
      if (enrolledTensor) human.tf.dispose(enrolledTensor)
      if (inputTensor) human.tf.dispose(inputTensor)
    }

  } catch (err) {
    console.error('❌ Error:', err)
    return new Response(
      JSON.stringify({
        error: err.message,
        verified: false,
        confidence: 0,
        faceDetected: err.message.includes('No face detected') ? false : undefined
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})
