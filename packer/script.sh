#!/bin/bash

# Update the system
sudo apt-get update
sudo apt-get install -y nodejs npm

# Install CloudWatch Agent
sudo wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb
sudo systemctl enable amazon-cloudwatch-agent

# Load environment variables from .env file
source /opt/webapp/.env

# Create the CloudWatch configuration directory if it doesn't exist
sudo mkdir -p /opt/aws/amazon-cloudwatch-agent/bin/

# Write the CloudWatch configuration file to the AMI
cat <<EOL | sudo tee /opt/aws/amazon-cloudwatch-agent/bin/config.json
{
  "agent": {
      "metrics_collection_interval": 10,
      "logfile": "/var/log/amazon-cloudwatch-agent.log"
  },
  "logs": {
      "logs_collected": {
          "files": {
              "collect_list": [
                  {
                      "file_path": "/opt/webapp/app.log",
                      "log_group_name": "${project_name}-logs",
                      "log_stream_name": "webapp",
                      "timestamp_format": "%Y-%m-%d %H:%M:%S"
                  }
              ]
          }
      }
  },
  "metrics": {
    "metrics_collected": {
      "statsd": {
        "service_address": ":8125",
        "metrics_collection_interval": 10,
        "metrics_aggregation_interval": 60
      }
    }
  }
}
EOL

# Create non-login user for the application
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
