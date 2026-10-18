# Usa la imagen oficial de PHP con Apache
FROM php:8.2-apache

# Copia todos los archivos de tu proyecto al directorio web de Apache
COPY . /var/www/html/

# (Opcional pero recomendado) Habilita el módulo de reescritura de Apache
RUN a2enmod rewrite

# Expone el puerto 80 (Render se encarga de mapearlo)
EXPOSE 80