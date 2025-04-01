#!/bin/bash

rm -rf node_modules/

rm pnpm-lock.yaml

pnpm install

echo "Les dépendances sont à jour: vous pouvez redémarrer le projet avec Nx."
