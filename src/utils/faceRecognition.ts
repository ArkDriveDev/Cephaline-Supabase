import * as faceapi from 'face-api.js';

// Load models from public folder
const MODEL_URL = '/models';

export async function loadModels() {
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
}

export async function detectFace(image: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement) {
  const detections = await faceapi
    .detectAllFaces(image, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptors();
  
  if (detections.length === 0) {
    throw new Error('No faces detected');
  }
  
  if (detections.length > 1) {
    throw new Error('Multiple faces detected');
  }
  
  return {
    descriptor: detections[0].descriptor,
    landmarks: detections[0].landmarks
  };
}

export function calculateFaceSimilarity(descriptor1: Float32Array, descriptor2: Float32Array) {
  return faceapi.euclideanDistance(descriptor1, descriptor2);
}