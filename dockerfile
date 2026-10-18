FROM php:8.2-apache

# Copia los archivos al servidor
COPY . /var/www/html/

# Instala la extensión de MySQL para PHP (necesaria para conexion.php)
RUN docker-php-ext-install mysqli pdo pdo_mysql

# Render usa el puerto 10000, configuramos Apache para escuchar ahí
RUN sed -i 's/80/10000/g' /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf

EXPOSE 10000