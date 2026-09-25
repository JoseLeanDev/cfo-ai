/**
 * Sistema de diseño Qora.
 *
 * Los valores vienen del Brand & Design System v1.0. La distribución objetivo
 * del color es 70 neutro · 22 tinta · 6 cobalto · 2 cobre: el cobalto se
 * reserva para acción primaria y salida de agente, y el cobre para juicio
 * humano (anotación, override, revisión).
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    // Escala de 4px. Se sustituye la escala por defecto de Tailwind para que
    // no existan pasos fuera del ritmo (4 · 8 · 12 · 16 · 24 · 32 · 48 · 72).
    extend: {
      colors: {
        ink: {
          DEFAULT: '#17181B',
          900: '#17181B',
          800: '#1F2125',
          700: '#33373D', // graphite
        },
        graphite: '#33373D',
        slate: {
          // DEFAULT es la variante segura para texto: el valor de marca
          // (#6C7278) queda 4.47:1 sobre papel, por debajo del mínimo AA.
          DEFAULT: '#636970',
          500: '#6C7278', // valor del brandbook, para filetes e iconos
        },
        mist: '#C7CBD0',
        fog: '#E9EAEC',
        paper: '#F6F5F3',
        /*
         * Acentos.
         *
         * `500` es el valor exacto del brandbook: rellenos, puntos de estado,
         * filetes y series de gráfica. `DEFAULT` es la variante oscurecida
         * para TEXTO, porque los valores de marca no alcanzan 4.5:1 sobre
         * blanco ni sobre papel en tamaños de interfaz. Es un ajuste de
         * legibilidad, no un cambio de paleta: el tono se conserva.
         */
        cobalt: {
          DEFAULT: '#3D56C9', // texto y enlaces  · 6.23:1 sobre blanco
          300: '#8FA2F2', // texto sobre tinta · 7.29:1
          500: '#4F6BE8', // marca · rellenos, foco, series
          700: '#3D56C9',
          100: '#E4E8FB',
          50: '#F1F3FE',
        },
        copper: {
          DEFAULT: '#8A5A24', // texto · 5.88:1 sobre blanco
          300: '#D9A566', // texto sobre tinta · 8.05:1
          500: '#B87A34', // marca
          700: '#996328',
          100: '#F5E9DA',
          50: '#FBF5ED',
        },
        verified: {
          DEFAULT: '#1F6B45', // texto · 6.47:1 sobre blanco
          300: '#4FB183', // texto sobre tinta · 6.72:1
          500: '#2F8F5F', // marca
          700: '#26754D',
          100: '#DCEFE5',
          50: '#EFF8F3',
        },
        breach: {
          DEFAULT: '#9B3320', // texto · 7.27:1 sobre blanco
          300: '#E0705A', // texto sobre tinta · 5.61:1
          500: '#C2452F', // marca
          700: '#A13726',
          100: '#F7DFDB',
          50: '#FCF0EE',
        },
      },

      fontFamily: {
        display: ['Archivo', 'Helvetica Neue', 'Arial', 'sans-serif'],
        sans: ['IBM Plex Sans', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },

      // Escala tipográfica del brandbook. D1 y H2/H3 son Archivo; body y small
      // son Plex Sans; mono lleva tracking 0.12em en mayúsculas.
      fontSize: {
        mono: ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.12em' }],
        small: ['0.8125rem', { lineHeight: '1.6' }],
        body: ['1rem', { lineHeight: '1.7' }],
        h3: ['1.375rem', { lineHeight: '1.3', letterSpacing: '-0.02em' }],
        h2: ['2.125rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        d1: ['4.75rem', { lineHeight: '1.04', letterSpacing: '-0.03em' }],
      },

      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        6: '24px',
        8: '32px',
        12: '48px',
        18: '72px',
        22: '88px', // ritmo de sección
      },

      // 0 para placas, 2px para controles, 4px para tarjetas, pill solo estado.
      borderRadius: {
        none: '0',
        control: '2px',
        card: '4px',
        pill: '9999px',
      },

      borderColor: {
        DEFAULT: '#E9EAEC',
      },

      // Plano por defecto. La sombra existe solo para superposiciones y menús.
      boxShadow: {
        none: 'none',
        overlay: '0 12px 32px -8px rgba(23, 24, 27, 0.18), 0 2px 8px -2px rgba(23, 24, 27, 0.10)',
        menu: '0 6px 20px -6px rgba(23, 24, 27, 0.16)',
      },

      maxWidth: {
        measure: '72ch', // medida máxima de texto corrido
        shell: '1440px',
      },

      transitionDuration: {
        DEFAULT: '120ms',
      },

      keyframes: {
        'qora-fade': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'none' },
        },
        'qora-sweep': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'qora-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
      animation: {
        'qora-fade': 'qora-fade 160ms ease-out both',
        'qora-sweep': 'qora-sweep 1.4s ease-in-out infinite',
        'qora-pulse': 'qora-pulse 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
