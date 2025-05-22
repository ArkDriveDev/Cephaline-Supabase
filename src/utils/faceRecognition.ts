import * as faceapi from 'face-api.js';

const MODEL_URL = '/models';
const SIMILARITY_THRESHOLD = 0.6; // Adjust based on your needs

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

export function isFaceMatching(descriptor1: Float32Array, descriptor2: Float32Array) {
  const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
  return distance <= SIMILARITY_THRESHOLD;
}

// Helper to convert Float32Array to regular array for DB storage
export function descriptorToArray(descriptor: Float32Array): number[] {
  return Array.from(descriptor);
}

// Helper to convert array back to Float32Array
export function arrayToDescriptor(array: number[]): Float32Array {
  return new Float32Array(array);
}