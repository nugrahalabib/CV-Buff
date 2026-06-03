/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "postcss-normalize": {
      allowDuplicates: false
    },
    tailwindcss: {}
  }
};

export default config;
