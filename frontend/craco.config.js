const path = require('path');

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  // Si Tailwind a besoin d'être configuré ici, on laisse le style vide pour que postcss.config.js prenne le relais
  style: {
    postcss: {
      loaderOptions: {
        postcssOptions: {
          ident: 'postcss',
          plugins: [
            require('tailwindcss'),
            require('autoprefixer'),
          ],
        },
      },
    },
  },
};