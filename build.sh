#!/bin/bash
cd /workspace/qr-generator
export NODE_ENV=production
./node_modules/.bin/vite build
