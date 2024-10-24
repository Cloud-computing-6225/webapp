#!/bin/bash

# Load environment variables from .env file if it exists
if [ -f "/opt/webapp/.env" ]; then
    echo "Loading environment variables from .env file."
    export $(grep -v '^#' /opt/webapp/.env | xargs)
else
    echo ".env file not found. Exiting."
    exit 1
fi

# Ensure required variables are set
if [ -z "${DB_USER}" ] || [ -z "${DB_NAME}" ] || [ -z "${DB_PASSWORD}" ] || [ -z "${DB_HOST}" ]; then
    echo "DB_USER, DB_NAME, DB_PASSWORD, and DB_HOST must be set in the .env file."
    exit 1
fi

# Load other DB-related variables from .env
DB_PORT=${DB_PORT:-3306}  # Use a default for port if not specified
PORT=${PORT:-8080}  # Use a default for the app port if not specified

# Debugging: print the loaded environment variables (sensitive info caution)
echo "DB_NAME: ${DB_NAME}"
echo "DB_USER: ${DB_USER}"  # Be cautious about printing sensitive info
echo "DB_PASSWORD: ${DB_PASSWORD}"  # Be cautious about printing sensitive info
echo "DB_HOST: ${DB_HOST}"
echo "DB_PORT: ${DB_PORT}"
echo "PORT: ${PORT}"  # Print the port for debugging

# Update the system
sudo apt-get update
sudo apt-get install -y nodejs npm mysql-client

# Create non-login user
sudo groupadd csye6225 || echo "Group csye6225 already exists."
sudo useradd -r -s /usr/sbin/nologin -g csye6225 csye6225 || echo "User csye6225 already exists."

# Wait for RDS instance to be available
echo "Waiting for the RDS instance to be available..."
for i in {1..10}; do
    if mysqladmin ping -h "${DB_HOST}" --silent; then
        echo "RDS is up and running!"
        break
    fi
    echo "Waiting for RDS... ($i)"
    sleep 10
done

# Create MySQL user and database (for RDS)
echo "Creating database and user if they do not exist..."
mysql -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME};"
mysql -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'%' IDENTIFIED BY '${DB_PASSWORD}';"
mysql -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'%';"
mysql -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" -e "FLUSH PRIVILEGES;"

# Copy application files
sudo mkdir -p /opt/webapp
sudo cp -R /tmp/webapp/* /opt/webapp/
sudo chown -R csye6225:csye6225 /opt/webapp/

# Install app dependencies
cd /opt/webapp/
sudo npm install sequelize mysql2

# Create the systemd service file for the Node.js app
cat <<EOL | sudo tee /etc/systemd/system/webapp.service
[Unit]
Description=Node.js WebApp
After=network.target

[Service]
ExecStart=/usr/bin/node /opt/webapp/server.js
Restart=always
User=csye6225
Group=csye6225
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_ENV=production
Environment=DB_NAME=${DB_NAME}
Environment=DB_USER=${DB_USER}
Environment=DB_PASSWORD=${DB_PASSWORD}
Environment=DB_HOST=${DB_HOST}
Environment=DB_PORT=${DB_PORT}
Environment=PORT=${PORT}
WorkingDirectory=/opt/webapp

[Install]
WantedBy=multi-user.target
EOL

# Enable and start the webapp service
sudo systemctl daemon-reload
sudo systemctl enable webapp.service
sudo systemctl start webapp.service

echo "Web app service started successfully."
