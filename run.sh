#!/bin/sh
set -e  # Exit if any command fails

echo "Setting up crawler..."
python3 -m venv crawler/.venv
crawler/.venv/bin/pip install -q -r crawler/requirements.txt

echo "Setting up frontend..."
cd client
npm install
npm run build
cd ..

echo "Setting up backend..."
cd server
npm install

echo "Starting server..."
npm test
npm run start
