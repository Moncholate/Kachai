import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  /* Rutas relativas: el mismo build sirve en GitHub Pages bajo cualquier nombre
     de repo, y el ruteo va por hash (#/host, #/play) así que no hay 404. */
  base: './',
  server: {
    port: 5175,
    /* Expuesto en la red local para probar desde el celular en la misma WiFi. */
    host: true,
  },
})
