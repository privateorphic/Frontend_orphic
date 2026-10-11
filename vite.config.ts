import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

function cleanCorruptedPath(p: string): string {
  const first = p.indexOf('#');
  const last = p.lastIndexOf('#');
  if (first !== -1 && first !== last) {
    return p.substring(0, last);
  }
  return p;
}

function resolveWithExtensions(): Plugin {
  return {
    name: 'resolve-with-extensions',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!importer) return null;

      const cleanSource = cleanCorruptedPath(source);
      const cleanImporter = cleanCorruptedPath(importer);

      // If source is absolute path
      if (path.isAbsolute(cleanSource) && fs.existsSync(cleanSource) && fs.statSync(cleanSource).isFile()) {
        return path.normalize(cleanSource);
      }

      // If relative path starting with '.'
      if (/^\./.test(cleanSource)) {
        const resolvedPath = path.resolve(path.dirname(cleanImporter), cleanSource);
        const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
        for (const ext of extensions) {
          const fullPath = resolvedPath + ext;
          if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
            return path.normalize(fullPath);
          }
        }
      }

      // If package specifier e.g. victory-vendor/es/d3-shape or lodash/upperFirst
      if (!/^\./.test(cleanSource) && !path.isAbsolute(cleanSource)) {
        const nodeModulesPath = path.resolve(path.dirname(cleanImporter), '..', cleanSource);
        const rootNodeModules = path.resolve('.', 'node_modules', cleanSource);
        const extensions = ['', '.js', '.mjs', '.cjs', '.ts', '.tsx', '/index.js', '/index.mjs'];
        for (const basePath of [nodeModulesPath, rootNodeModules]) {
          for (const ext of extensions) {
            const fullPath = basePath + ext;
            if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
              return path.normalize(fullPath);
            }
          }
        }
      }

      return null;
    },
    load(id) {
      const cleanId = cleanCorruptedPath(id);
      if (cleanId !== id) {
        const normalized = path.normalize(cleanId);
        if (fs.existsSync(normalized)) {
          return fs.readFileSync(normalized, 'utf-8');
        }
      }
      return null;
    }
  };
}

export default defineConfig({
  plugins: [resolveWithExtensions(), react()],
  resolve: {
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      'axios': path.resolve(__dirname, './node_modules/axios/dist/esm/axios.js'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
