/** Domain logic is pure TypeScript; tests run under jest-expo so React Native modules resolve too. */
module.exports = {
  preset: 'jest-expo',
  globalSetup: '<rootDir>/jest.global-setup.js',
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts?(x)'],
  collectCoverageFrom: ['src/domain/**/*.ts'],
};
