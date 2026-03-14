#!/usr/bin/env bash
set -e
APP_ENV=${APP_ENV:-local}
echo "Starting in $APP_ENV mode"

echo "Waiting for postgres..."
while ! nc -z database 5432; do
  sleep 0.1
done
echo "Postgres ready"

echo "Waiting for redis..."
while ! nc -z redis 6379; do
  sleep 0.1
done
echo "Redis ready"

echo "Collecting static files..."
python manage.py collectstatic --noinput

if [ "$APP_ENV" != "production" ]; then
  echo "Making migrations..."
  python manage.py makemigrations --noinput
fi

echo "Applying migrations..."
python manage.py migrate --noinput

exec python manage.py runserver 0.0.0.0:8000
