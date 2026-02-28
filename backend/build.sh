#!/usr/bin/env bash
# Render build script — runs during the Build phase
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --noinput
python manage.py migrate --noinput
