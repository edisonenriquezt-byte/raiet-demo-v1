#!/usr/bin/env sh
# Paquete web estático para un ORIGEN INDEPENDIENTE (Cloudflare Pages).
set -eu
rm -rf dist
mkdir -p dist
cp index.html activar.html manifest.json sw.js icon-192.png icon-512.png dist/
cp acceso-esabas.js edicion-financiera.js mejoras.js raiet-interacciones.js dist/
cp raiet-respaldo.js raiet-gestion.js raiet-inventario.js raiet-historia-clinica.js dist/
cp raiet-native.js dist/
cat > dist/_headers <<'EOF'
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
EOF
printf '%s\n' 'RAIET DEMO PRO: carpeta dist/ preparada para Cloudflare Pages.'
