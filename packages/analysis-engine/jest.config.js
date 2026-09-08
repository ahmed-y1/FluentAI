module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '@mediapipe/tasks-vision': '<rootDir>/__mocks__/mediapipe.ts',
    'face-api.js':             '<rootDir>/__mocks__/face-api.ts',
  },
};