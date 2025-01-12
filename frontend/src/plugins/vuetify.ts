/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';

// Composables
import { createVuetify, type ThemeDefinition } from 'vuetify';

const daTheme: ThemeDefinition = {
  dark: false,
  colors: {
    background: '#FFFFFF',
    surface: '#FFFFFF',
    'surface-bright': '#FFFFFF',
    'surface-light': '#EEEEEE',
    'surface-variant': '#424242',
    'on-surface-variant': '#EEEEEE',
    primary: '#003f88',
    'primary-darken-1': '#00296b',
    secondary: '#ffd500',
    'secondary-darken-1': '#fdc500',
    error: '#B00020',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FB8C00',
  },
  variables: {
    'border-color': '#000000',
    'border-opacity': 0.12,
    'high-emphasis-opacity': 0.87,
    'medium-emphasis-opacity': 0.60,
    'disabled-opacity': 0.38,
    'idle-opacity': 0.04,
    'hover-opacity': 0.04,
    'focus-opacity': 0.12,
    'selected-opacity': 0.08,
    'activated-opacity': 0.12,
    'pressed-opacity': 0.12,
    'dragged-opacity': 0.08,
    'theme-kbd': '#212529',
    'theme-on-kbd': '#FFFFFF',
    'theme-code': '#F5F5F5',
    'theme-on-code': '#000000',
  }
};

const ducklab: ThemeDefinition = {
  dark: false,
  colors: {
    background: '#fff',
    surface: '#024959',
    primary: '#024873',
    secondary: '#F2B56B',
    'primary-contrast': '#fff', // contrast primary
    shadow: '#000'
  },
};


// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: 'ducklab',
    themes: {
      daTheme,
      ducklab,
      dark: {
        colors: {
          primary: '#1867C0',
          secondary: '#5CBBF6',
          background: '#171d1f',
        },
      },
    },
  },
});
