#!/bin/sh
set -eu
cd "$(dirname "$0")"
python3 -m pip install -r requirements.txt
npm ci
npm test
npm run build:visuals
python3 build.py --public-only --package
