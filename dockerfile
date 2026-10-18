FROM php:8.2-apache

# Asegurarnos de copiar el contenido al directorio correcto
COPY . /var/www/html/

# Instalar la extensión de MySQL
RUN docker-php-ext-install mysqli pdo pdo_mysql

# Configurar Apache para el puerto 10000
RUN sed -i 's/80/10000/g' /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf

EXPOSE 10000