#!/bin/bash
# Production build script for ADO-AI Dependency Tracker

echo "Building client and server for production..."
npm run build

echo "Building production server entry point..."
esbuild server/production.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Build complete. Use 'NODE_ENV=production node dist/production.js' to start production server."