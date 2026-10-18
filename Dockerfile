FROM php:8.2-apache

# 1. Instalar la librería de desarrollo de PostgreSQL PRIMERO
RUN apt-get update && apt-get install -y libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 2. Instalar la extensión de PHP para PostgreSQL
RUN docker-php-ext-install pdo pdo_pgsql

# 3. Copiar los archivos del proyecto
COPY . /var/www/html/

# 4. Configurar Apache para el puerto 10000
RUN sed -i 's/80/10000/g' /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf

EXPOSE 10000
