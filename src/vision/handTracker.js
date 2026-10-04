import {
  FilesetResolver,
  HandLandmarker,
} from "@mediapipe/tasks-vision";

let handLandmarker = null;

export async function createHandTracker() {
  // Already created
  if (handLandmarker) {
    return handLandmarker;
  }

  // Load MediaPipe WASM
  const vision =
    await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm"
    );

  // Create hand tracker
  handLandmarker =
    await HandLandmarker.createFromOptions(
      vision,
      {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        },

        runningMode: "VIDEO",

        // IMPORTANT
        // Thunder + Invisible need two hands.
        numHands: 2,

        minHandDetectionConfidence:
          0.5,

        minHandPresenceConfidence:
          0.5,

        minTrackingConfidence:
          0.5,
      }
    );

  return handLandmarker;
}

export function resetHandTracker() {
  if (handLandmarker) {
    handLandmarker.close();
    handLandmarker = null;
  }
}