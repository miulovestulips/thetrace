FROM php:8.2-apache

# 1. Borrar los archivos por defecto de Apache para que no estorben
RUN rm -rf /var/www/html/*

# 2. Copiar TODO tu proyecto directamente a la carpeta pública de Apache
COPY . /var/www/html/

# 3. Instalar la extensión de MySQL para PHP
RUN docker-php-ext-install mysqli pdo pdo_mysql

# 4. Configurar Apache para escuchar en el puerto 10000 que exige Render
RUN sed -i 's/80/10000/g' /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf

EXPOSE 10000