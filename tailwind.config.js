module.exports = {
  future: {
    removeDeprecatedGapUtilities: true,
    purgeLayersByDefault: true
  },
  purge: {
    // Learn more on https://tailwindcss.com/docs/controlling-file-size/#removing-unused-css
    enabled: process.env.NODE_ENV === 'production',
    content: ['views/**/*.ejs']
  },
  theme: {
    extend: {
      colors: {
        priamry: {
          100: '#ced0d6',
          200: '#9da1ad',
          300: '#6b7385',
          400: '#3a445c',
          500: '#091533',
          600: '#071129',
          700: '#050d1f',
          800: '#040814',
          900: '#02040a'
        },
        secondary: {
          100: '#cceefb',
          200: '#99def8',
          300: '#66cdf4',
          400: '#33bdf1',
          500: '#00aced',
          600: '#008abe',
          700: '#00678e',
          800: '#00455f',
          900: '#00222f'
        }
      }
    }
  },
  variants: {},
  plugins: []
};
