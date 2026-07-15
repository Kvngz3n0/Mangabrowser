#!/bin/bash
set -e

echo "=== Setting up Imperious Manga Aggregator ==="

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs nginx sqlite3 git

# Install PM2
sudo npm install -g pm2

# Create app directory
sudo mkdir -p /var/www/manga-aggregator
sudo chown $USER:$USER /var/www/manga-aggregator
cd /var/www/manga-aggregator

# Clone your repo (replace with yours)
git clone https://github.com/yourusername/manga-aggregator.git .
# OR upload via SCP: scp -r manga-aggregator/* user@ip:/var/www/manga-aggregator/

# Install and setup
npm install --production
npm run setup

# Seed demo data
curl -s http://localhost:3000/api/seed || echo "Seed after start"

# Start with PM2
pm2 start server.js --name "manga-aggregator"
pm2 startup
pm2 save

# Setup Nginx
sudo tee /etc/nginx/sites-available/manga-aggregator << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/manga-aggregator /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

echo "=== Done! Visit http://your-server-ip ==="
