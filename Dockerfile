FROM php:8.2-apache

# 1. Copiar archivos del proyecto
COPY . /var/www/html/

# 2. Instalar dependencias del sistema y el driver de PostgreSQL para PHP
RUN apt-get update && apt-get install -y libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql

# 3. Configurar Apache para el puerto 10000 de Render
RUN sed -i 's/80/10000/g' /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf

EXPOSE 10000
