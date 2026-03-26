import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    allowedHosts: ['geosg', 'GeoSG', '192.168.0.39', 'localhost']
  }
});