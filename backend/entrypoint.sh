#!/bin/sh
set -e
python manage.py migrate --noinput
python manage.py ensure_admin
python manage.py ensure_seed_data
exec gunicorn config.wsgi:application --bind "0.0.0.0:${PORT:-8000}" --workers 2 --threads 2 --preload --timeout 90
