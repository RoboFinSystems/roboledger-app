/** @type {import('prettier').Config} */
module.exports = {
  // prettier-plugin-organize-imports
  plugins: ['prettier-plugin-organize-imports', 'prettier-plugin-tailwindcss'],
  // tailwindcss
  tailwindAttributes: ['theme'],
  tailwindFunctions: ['twMerge', 'createTheme'],
  // options
  trailingComma: 'es5',
  tabWidth: 2,
  semi: false,
  singleQuote: true,
}
