const TEST_REGEX = '(/__tests__/.*|(\\.|/)(test|spec))\\.ts$';

module.exports = {
  testRegex: TEST_REGEX,
  testPathIgnorePatterns: ['<rootDir>/node_modules/'],
  collectCoverage: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
};
