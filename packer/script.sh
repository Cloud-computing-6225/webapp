#!/bin/bash

# Update the system
sudo apt-get update
sudo apt-get install -y nodejs npm mysql-client

# Create non-login user
sudo groupadd csye6225 || echo "Group csye6225 already exists."
sudo useradd -r -s /usr/sbin/nologin -g csye6225 csye6225 || echo "User csye6225 already exists."




# Copy application files
sudo mkdir -p /opt/webapp
sudo cp -R /tmp/webapp/* /opt/webapp/
sudo chown -R csye6225:csye6225 /opt/webapp/

# Install app dependencies
cd /opt/webapp/
sudo npm install sequelize mysql2 dotenv

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
EnvironmentFile=/opt/webapp/.env 
WorkingDirectory=/opt/webapp

[Install]
WantedBy=multi-user.target
EOL

# Enable and start the webapp service
sudo systemctl daemon-reload
sudo systemctl enable webapp.service
sudo systemctl start webapp.service

echo "Web app service started successfully."
