module.exports = {
    roots: ["<rootDir>/src/test"],
    testEnvironment: 'node',
    transform: {
        "^.+\\.(t|j)sx?$": "ts-jest"
    },
    testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$",
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
};