FROM php:8.2-apache

RUN apt-get update && apt-get install -y libpq-dev \
    && rm -rf /var/lib/apt/lists/*
RUN docker-php-ext-install pdo pdo_pgsql

# Copia el contenido de la carpeta actual al directorio de Apache
COPY . /var/www/html/

RUN sed -i 's/80/10000/g' /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf

EXPOSE 10000