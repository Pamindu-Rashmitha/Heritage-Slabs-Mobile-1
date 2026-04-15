#!/bin/bash
PROJ="/mnt/c/Users/aloka/Mine/Projects/Heritage-Slabs-Mobile/Heritage-Slabs-Mobile-1/granite-system-mobile"
WSL_MODS="/home/aloka/wsl-node-modules/granite-system-mobile"

echo "Step 1: Remove old node_modules..."
rm -rf "$PROJ/node_modules" "$PROJ/package-lock.json"

echo "Step 2: Create WSL-native directory..."
mkdir -p "$WSL_MODS"

echo "Step 3: Create symlink..."
ln -s "$WSL_MODS" "$PROJ/node_modules"

echo "Step 4: Verify symlink..."
ls -la "$PROJ/" | grep node_modules

echo "Step 5: npm install..."
cd "$PROJ" && npm install

echo "DONE"
