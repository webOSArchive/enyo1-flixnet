#!/bin/sh
# Fetches a snapshot of genres and movies from the live API and saves them
# as bundled fallback data for offline use.
#
# Run this script whenever you want to refresh the bundled data:
#   sh fetch-fallback-data.sh

BASE="http://flixnet.webosarchive.org/api"
OUT="enyo-app/data"

echo "Fetching genres..."
curl -sf "$BASE/genres/" -o "$OUT/genres.json" && echo "OK" || echo "FAILED"

echo "Fetching movies..."
curl -sf "$BASE/movies/?take=100" -o "$OUT/movies.json" && echo "OK" || echo "FAILED"
