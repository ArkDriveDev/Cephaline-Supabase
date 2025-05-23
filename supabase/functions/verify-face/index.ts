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

// Helper function to process image data
const processImageData = (imageData: string): Uint8Array => {
  try {
    // Handle both raw base64 and data URLs
    const base64 = imageData.startsWith('data:') 
      ? imageData.split(',')[1] 
      : imageData;
    return new Uint8Array(
      atob(base64)
        .split('')
        .map(c => c.charCodeAt(0))
    );
  } catch (err) {
    throw new Error(`Invalid image data: ${err.message}`);
  }
};

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
    
    if (!user_id || !image_data) {
      throw new Error('Missing required fields: user_id and image_data');
    }

    // Initialize Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { 
        global: { 
          headers: { Authorization: req.headers.get('Authorization')! } 
        }
      }
    )

    // 1. Get user's enrolled face
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('user_facial_enrollments')
      .select('storage_path')
      .eq('user_id', user_id)
      .single()

    if (enrollmentError || !enrollment) {
      throw new Error('No facial enrollment found: ' + (enrollmentError?.message || ''));
    }

    // 2. Download enrolled image from storage
    const { data: enrolledImage, error: downloadError } = await supabase.storage
      .from('facial-recognition')
      .download(enrollment.storage_path)

    if (downloadError || !enrolledImage) {
      throw new Error('Failed to download enrolled image: ' + (downloadError?.message || ''));
    }

    // 3. Process both images
    const [enrolledArray, inputArray] = await Promise.all([
      new Uint8Array(await enrolledImage.arrayBuffer()),
      processImageData(image_data)
    ]);

    const [enrolledTensor, inputTensor] = [
      human.tf.browser.decodeImage(enrolledArray),
      human.tf.browser.decodeImage(inputArray)
    ];

    const [enrolledResult, inputResult] = await Promise.all([
      human.detect(enrolledTensor),
      human.detect(inputTensor)
    ]);

    // Clean up tensors to avoid memory leaks
    human.tf.dispose([enrolledTensor, inputTensor]);

    // 4. Validate we found faces
    if (!enrolledResult.face?.[0] || !inputResult.face?.[0]) {
      throw new Error(
        enrolledResult.face?.[0] 
          ? 'No face detected in input image' 
          : 'No face found in enrolled image'
      );
    }

    // 5. Compare faces
    const match = human.compare(enrolledResult.face[0], inputResult.face[0]);
    const verified = match > 0.8; // Adjust threshold as needed

    return new Response(
      JSON.stringify({ 
        verified,
        confidence: match,
        landmarks: inputResult.face[0]?.landmark, // Optional for UI
        faceDetected: true
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
      JSON.stringify({ 
        error: err.message,
        verified: false,
        confidence: 0,
        faceDetected: err.message.includes('No face detected') ? false : undefined
      }), 
      { 
        status: 400,
        headers: { 
          'Content-Type': 'application/json', 
          'Access-Control-Allow-Origin': '*' 
        } 
      }
    )
  }
})