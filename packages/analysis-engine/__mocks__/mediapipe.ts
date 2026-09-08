export const FilesetResolver = { forVisionTasks: async () => ({}) };
export const PoseLandmarker = { createFromOptions: async () => ({
  detectForVideo: () => ({ landmarks: [] })
}) };
export const FaceLandmarker = { createFromOptions: async () => ({}) };
export const HandLandmarker  = { createFromOptions: async () => ({}) };