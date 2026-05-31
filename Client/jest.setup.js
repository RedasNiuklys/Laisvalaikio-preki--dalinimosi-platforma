// Silence console noise from source files during tests
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'debug').mockImplementation(() => {});

// Suppress act() warnings from @expo/vector-icons async font loading —
// these are false positives: the Icon setState fires after test body but tests still pass.
const originalError = console.error;
jest.spyOn(console, 'error').mockImplementation((...args) => {
  if (typeof args[0] === 'string' && args[0].includes('not wrapped in act')) return;
  originalError(...args);
});
