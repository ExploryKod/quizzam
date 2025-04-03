#!/bin/bash
rm -rf node_modules/
rm pnpm-lock.yaml
pnpm install
echo "Les commandes ont été exécutées avec succès."
