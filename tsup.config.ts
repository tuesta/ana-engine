import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'], // Genera ambos formatos para máxima compatibilidad
  dts: true,              // Genera los archivos de definición de tipos (.d.ts)
  splitting: false,
  sourcemap: true,
  clean: true,            // Limpia la carpeta /dist antes de cada build
  minify: true,           // Comprime el código para el frontend
  treeshake: true,
});
