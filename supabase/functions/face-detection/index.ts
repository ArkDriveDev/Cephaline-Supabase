import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import * as tf from 'https://esm.sh/@tensorflow/tfjs-node@4.5.0'
import * as faceDetection from 'https://esm.sh/@tensorflow-models/face-detection@1.0.2'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Initialize once per instance
let detector: faceDetection.FaceDetector | null = null

async function initializeDetector() {
  await tf.setBackend('tensorflow')
  detector = await faceDetection.createDetector(
    faceDetection.SupportedModels.MediaPipeFaceDetector,
    {
      runtime: 'tfjs',
      maxFaces: 1,
      detectorModelUrl: 'https://storage.googleapis.com/tfjs-models/savedmodel/face_detection/blazeface/model.json'
    }
  )
}

serve(async (req) => {
  try {
    // Initialize detector if not already done
    if (!detector) {
      await initializeDetector()
    }

    // Parse the incoming form data
    const formData = await req.formData()
    const imageFile = formData.get('image') as File
    
    if (!imageFile) {
      return new Response(JSON.stringify({ error: 'No image provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Convert image to tensor
    const imageBuffer = new Uint8Array(await imageFile.arrayBuffer())
    const imageTensor = tf.node.decodeImage(imageBuffer)
    
    // Detect faces
    const faces = await detector!.estimateFaces(imageTensor)
    
    // Clean up
    tf.dispose(imageTensor)

    // If no face or multiple faces found
    if (faces.length !== 1) {
      return new Response(JSON.stringify({ 
        valid: false,
        faceCount: faces.length,
        message: faces.length === 0 ? 'No face detected' : 'Multiple faces detected'
      }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // If valid face detected
    return new Response(JSON.stringify({ 
      valid: true,
      faceCount: 1,
      message: 'Face detected successfully'
    }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in face detection:', error)
    return new Response(JSON.stringify({ 
      error: 'Face detection failed',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})