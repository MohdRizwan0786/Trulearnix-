# TruLearnix Deployment Guide (VPS + Ubuntu + Nginx + PM2)

## Prerequisites
- Ubuntu 22.04 VPS (min 4 vCPUs, 8GB RAM)
- Domain: trulearnix.com + admin.trulearnix.com + api.trulearnix.com
- MongoDB Atlas or self-hosted MongoDB
- AWS S3 bucket
- Razorpay account
- Zoom developer account

---

## 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Install Redis
sudo apt install redis-server -y
sudo systemctl enable redis
```

---

## 2. Project Deployment

```bash
# Clone repo
git clone https://github.com/your-org/trulearnix.git /var/www/trulearnix
cd /var/www/trulearnix

# Install dependencies
npm install

# Setup API env
cp apps/api/.env.example apps/api/.env
nano apps/api/.env   # Fill all values

# Setup web env
cp apps/web/.env.local.example apps/web/.env.local
nano apps/web/.env.local

# Build API
cd apps/api && npm run build && cd ../..

# Build web
cd apps/web && npm run build && cd ../..

# Build admin
cd apps/admin && npm run build && cd ../..

# Create logs dir
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 3. Nginx Setup

```bash
sudo cp nginx/trulearnix.conf /etc/nginx/sites-available/trulearnix
sudo ln -s /etc/nginx/sites-available/trulearnix /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 4. SSL Certificate

```bash
sudo certbot --nginx -d trulearnix.com -d www.trulearnix.com -d admin.trulearnix.com -d api.trulearnix.com
```

---

## 5. DNS Settings (Cloudflare/Hostinger)

| Record | Name | Value |
|--------|------|-------|
| A | @ | YOUR_VPS_IP |
| A | www | YOUR_VPS_IP |
| A | admin | YOUR_VPS_IP |
| A | api | YOUR_VPS_IP |

---

## 6. MongoDB Setup (Atlas)

1. Create account at mongodb.com/atlas
2. Create cluster (M10 recommended)
3. Get connection string
4. Add to `MONGODB_URI` in .env

---

## 7. AWS S3 Setup

1. Create bucket: `trulearnix-media`
2. Region: `ap-south-1`
3. CORS config:
```json
[{
  "AllowedHeaders": ["*"],
  "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
  "AllowedOrigins": ["https://trulearnix.com", "https://admin.trulearnix.com"],
  "MaxAgeSeconds": 3000
}]
```
4. Create IAM user with S3 full access
5. Copy keys to .env

---

## 8. Create Admin User

```bash
# Connect to MongoDB and create admin
cd apps/api
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI);
const User = require('./dist/models/User').default;
User.create({ name: 'Admin', email: 'admin@trulearnix.com', password: 'Admin@123', role: 'admin', isVerified: true, affiliateCode: 'ADMIN001' }).then(() => { console.log('Admin created'); process.exit(); })
"
```

---

## 9. Monitoring

```bash
# Check all processes
pm2 status

# View logs
pm2 logs trulearnix-api
pm2 logs trulearnix-web

# Monitor
pm2 monit
```

---

## Architecture

```
Internet → Cloudflare → Nginx (SSL Termination)
                           ├── trulearnix.com → Next.js (port 3000)
                           ├── admin.trulearnix.com → Next.js Admin (port 3001)
                           └── api.trulearnix.com → Express API (port 5000)
                                                         ├── MongoDB Atlas
                                                         ├── Redis
                                                         └── AWS S3
```
