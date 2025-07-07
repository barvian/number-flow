module.exports = {
  preset: 'react-native',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    "node_modules/(?!(@?react-native|@react-native-community|number-flow|jest-runner)/)"
    // The jest-runner part is sometimes needed if using a custom jest runner that itself needs compilation.
    // @?react-native covers both react-native and @react-native
  ],
  // moduleNameMapper: {
  //   // If you have path aliases in tsconfig.json, map them here
  //   // For example, if number-flow/lite is imported directly from a sub-path
  //   // "number-flow/lite": "<rootDir>/../number-flow/src/lite.ts"
  // },
};
