// supabase/functions/face-detection/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0'

// We'll use a lighter-weight face detection library that works better in Edge
import * as faceapi from 'https://esm.sh/face-api.js@0.22.2'

// Global variables for cached models
let modelsLoaded = false
const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models'

serve(async (req) => {
  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Load models if not already loaded
    if (!modelsLoaded) {
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
      modelsLoaded = true
    }

    // Parse form data
    const formData = await req.formData()
    const imageFile = formData.get('image') as Blob

    if (!imageFile) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Convert image to HTMLImageElement
    const imageBuffer = await imageFile.arrayBuffer()
    const img = await faceapi.bufferToImage(imageBuffer)

    // Detect faces
    const detections = await faceapi.detectAllFaces(
      img,
      new faceapi.TinyFaceDetectorOptions()
    )

    // Validate exactly one face
    if (detections.length !== 1) {
      return new Response(
        JSON.stringify({
          valid: false,
          faceCount: detections.length,
          message: detections.length === 0 
            ? 'No face detected' 
            : 'Multiple faces detected'
        }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        valid: true,
        faceCount: 1,
        message: 'Face detected successfully'
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Face detection failed',
        details: error.message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})