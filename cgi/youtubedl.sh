#!/usr/bin/env bash

set -e
set -o pipefail

if [[ "$QUERY_STRING" != "pw=$PW" ]]; then
  echo "Content-Type: text/plain"
  echo "Status: 401 Unauthorized"
  echo
  echo "Password was incorrect"
  exit 0
fi

cd /app
read -N $CONTENT_LENGTH url

cd $(mktemp -d)
youtube-dl -f mp4 --no-playlist $url &>>logs


echo "Content-Type: application/octet-stream "
echo "Content-Disposition: attachment; filename=\"$(ls *.mp4)\""
echo "Content-Length: $(stat --format="%s" *.mp4)"
echo
cat *.mp4
