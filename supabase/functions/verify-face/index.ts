// File: api/verify-face.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Human from 'https://cdn.jsdelivr.net/npm/@vladmandic/human/dist/human.esm.js'

// Configuration
const CONFIG = {
  FACE_MATCH_THRESHOLD: 0.7,
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_ORIGINS: [
    'https://cephaline-supabase.vercel.app',
    'https://cephaline-supabase-git-vercel1-arkyroels-projects.vercel.app',
    'https://cephaline-supabase-7s87uxaji-arkyroels-projects.vercel.app',
    'http://localhost:5173'
  ]
}

// Initialize Human.js with optimized settings
const human = new Human({
  backend: 'webgl',
  modelBasePath: 'https://cdn.jsdelivr.net/npm/@vladmandic/human/models/',
  face: {
    enabled: true,
    detector: { rotation: true, return: true },
    recognition: { enabled: true },
    mesh: { enabled: false }, // Disable for performance
    iris: { enabled: false }, // Disable for performance
    emotion: { enabled: false } // Disable for performance
  },
  filter: { enabled: false },
  gesture: { enabled: false }
})

// Warmup Human.js
let isHumanReady = false
human.load().then(() => human.warmup()).then(() => {
  isHumanReady = true
  console.log('✅ Human.js ready')
}).catch(err => {
  console.error('❌ Human.js initialization failed:', err)
})

// Image processing utility
async function processImage(imageData: string): Promise<Uint8Array> {
  if (!imageData) throw new Error('Empty image data')
  
  const base64 = imageData.startsWith('data:image/') 
    ? imageData.split(',')[1] 
    : imageData
  
  if (base64.length * 0.75 > CONFIG.MAX_IMAGE_SIZE) {
    throw new Error(`Image exceeds maximum size of ${CONFIG.MAX_IMAGE_SIZE/1024/1024}MB`)
  }

  try {
    const binaryString = typeof atob !== 'undefined'
      ? atob(base64)
      : Buffer.from(base64, 'base64').toString('binary')
    return new Uint8Array([...binaryString].map(char => char.charCodeAt(0)))
  } catch (err) {
    throw new Error(`Invalid image data: ${err.message}`)
  }
}

// Main handler
serve(async (req) => {
  // CORS handling
  const origin = req.headers.get('origin') || ''
  const isAllowedOrigin = CONFIG.ALLOWED_ORIGINS.includes(origin)
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : CONFIG.ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Max-Age': '86400'
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Validate request
  if (!req.headers.get('content-type')?.includes('application/json')) {
    return errorResponse('Content-Type must be application/json', 400, corsHeaders)
  }

  // Check Human.js readiness
  if (!isHumanReady) {
    return errorResponse('Face verification service initializing', 503, corsHeaders)
  }

  try {
    const { user_id, image_data } = await req.json()
    
    if (!user_id || !image_data) {
      return errorResponse('Missing user_id or image_data', 400, corsHeaders)
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')
    const authHeader = req.headers.get('Authorization')

    if (!supabaseUrl || !supabaseKey) {
      return errorResponse('Server configuration error', 500, corsHeaders)
    }
    if (!authHeader) {
      return errorResponse('Authorization header required', 401, corsHeaders)
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Verify user exists
    const { data: user, error: userError } = await supabase.auth.getUser()
    if (userError || !user.user) {
      return errorResponse('Invalid user', 401, corsHeaders)
    }

    // Get enrolled face
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('user_facial_enrollments')
      .select('storage_path, created_at')
      .eq('user_id', user_id)
      .eq('is_active', true)
      .single()

    if (enrollmentError || !enrollment) {
      return errorResponse('No active facial enrollment found', 404, corsHeaders)
    }

    // Download enrolled image
    const { data: enrolledImage, error: downloadError } = await supabase.storage
      .from('facial-recognition')
      .download(enrollment.storage_path)

    if (downloadError || !enrolledImage) {
      return errorResponse('Failed to retrieve enrolled image', 404, corsHeaders)
    }

    // Process images
    let enrolledTensor, inputTensor
    try {
      const [enrolledArray, inputArray] = await Promise.all([
        new Uint8Array(await enrolledImage.arrayBuffer()),
        processImage(image_data)
      ])

      // Decode images
      enrolledTensor = await human.tf.browser.decodeImage(enrolledArray)
      inputTensor = await human.tf.browser.decodeImage(inputArray)

      // Detect faces
      const [enrolledResult, inputResult] = await Promise.all([
        human.detect(enrolledTensor),
        human.detect(inputTensor)
      ])

      // Validate faces
      if (!enrolledResult.face?.[0]) {
        return errorResponse('No face found in enrolled image', 400, corsHeaders)
      }
      if (!inputResult.face?.[0]) {
        return errorResponse('No face detected in uploaded image', 400, corsHeaders)
      }

      // Compare faces
      const similarity = human.compare(enrolledResult.face[0], inputResult.face[0])
      const verified = similarity >= CONFIG.FACE_MATCH_THRESHOLD

      return new Response(
        JSON.stringify({
          verified,
          confidence: similarity,
          faceDetected: true,
          landmarks: inputResult.face[0]?.landmark,
          enrollmentDate: enrollment.created_at
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    } finally {
      // Cleanup tensors
      if (enrolledTensor) human.tf.dispose(enrolledTensor)
      if (inputTensor) human.tf.dispose(inputTensor)
    }
  } catch (err) {
    console.error('Verification error:', err)
    return errorResponse(
      err.message.includes('Invalid image') ? err.message : 'Verification failed',
      400,
      corsHeaders
    )
  }
})

// Helper function for error responses
function errorResponse(message: string, status = 400, headers = {}) {
  return new Response(
    JSON.stringify({
      error: message,
      verified: false,
      confidence: 0,
      faceDetected: message.includes('No face') ? false : undefined
    }),
    {
      status,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      }
    }
  )
}