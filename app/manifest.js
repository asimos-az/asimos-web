export default function manifest() {
  return {
    name: 'Asimos',
    short_name: 'Asimos',
    description: 'Azərbaycanda iş elanları, vakansiyalar və xəritə ilə yaxın iş imkanları.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f8fbff',
    theme_color: '#3c7df0',
    lang: 'az',
    icons: [
      {
        src: '/logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
