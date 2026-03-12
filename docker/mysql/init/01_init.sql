-- Script de inicialización MySQL para Docker
-- Se ejecuta automáticamente la primera vez que se levanta el contenedor db

-- La base de datos ya la crea docker-compose via MYSQL_DATABASE
-- Aquí podemos agregar configuraciones adicionales

-- Asegurar que el usuario tiene todos los permisos sobre la BD
GRANT ALL PRIVILEGES ON truck_manager.* TO 'truck_user'@'%';
FLUSH PRIVILEGES;
