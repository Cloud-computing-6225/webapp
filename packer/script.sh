#!/bin/bash

# Load environment variables from .env file if it exists
if [ -f "/tmp/webapp/.env" ]; then
    echo "Loading environment variables from .env file."
    export $(grep -v '^#' /tmp/webapp/.env | xargs)
else
    echo ".env file not found, using environment variables passed by Packer/GitHub secrets."
   
    DB_NAME=${DB_NAME:-default_db_name}
    DB_USER=${DB_USER:-default_db_user}
    DB_PASSWORD=${DB_PASSWORD:-default_db_password}
    DB_HOST=${DB_HOST_BUILD:-default_db_host}
    DB_PORT=${DB_PORT:-3306}
    PORT=${PORT:-8080}  # Add this line for the PORT variable
fi

# Debugging: print the loaded environment variables
echo "DB_NAME: ${DB_NAME}"
echo "DB_USER: ${DB_USER}"
echo "DB_PASSWORD: ${DB_PASSWORD}"
echo "DB_HOST: ${DB_HOST}"
echo "DB_PORT: ${DB_PORT}"
echo "PORT: ${PORT}"  # Print the port for debugging

# Update the system
sudo apt-get update
# sudo apt-get install -y mysql-server nodejs npm
sudo apt-get install -y nodejs npm

# Create non-login user
sudo groupadd csye6225
sudo useradd -r -s /usr/sbin/nologin -g csye6225 csye6225

# # Create MySQL user and database (instead of root)
# sudo mysql -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME};"
# sudo mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';"
# sudo mysql -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';"
# sudo mysql -e "FLUSH PRIVILEGES;"

# Copy application files
sudo mkdir -p /opt/webapp
sudo cp -R /tmp/webapp/* /opt/webapp/
sudo chown -R csye6225:csye6225 /opt/webapp/

# Install app dependencies
cd /opt/webapp/
sudo npm install

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
Environment=PORT=${PORT}  # Add the PORT variable here
WorkingDirectory=/opt/webapp

[Install]
WantedBy=multi-user.target
EOL

# Enable and start the webapp service
sudo systemctl daemon-reload
sudo systemctl enable webapp.service
sudo systemctl start webapp.service
