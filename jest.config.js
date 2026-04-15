module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/*.test.ts', '**/*.spec.ts'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.model.ts',
        '!src/**/*.test.ts',
        '!src/**/*.spec.ts',
        '!src/main.ts',
        '!src/vite-env.d.ts',
    ],
};