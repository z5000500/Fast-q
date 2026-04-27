# QuizCraft — Oracle Cloud Free Tier Deployment Guide

Complete step-by-step deployment of the QuizCraft (fast_q) stack on a single Oracle Cloud Always Free VM.

Target architecture on one VM:
- **Nginx** — serves built frontend + reverse proxies `/api` and `/socket.io`
- **PHP-FPM 8.2** — runs the `api/` REST service
- **Node.js 20** — runs the `realtime/` Socket.io service (managed by systemd)
- **MySQL 8** — local database

---

## Phase 1 — Create the Oracle Cloud VM

### 1.1 Sign up
1. Go to https://www.oracle.com/cloud/free/ and create an account (needs a credit card for verification — not charged).
2. Pick a home region close to you. **This cannot be changed later.**
3. Wait for account provisioning (up to 15 min).

### 1.2 Create the VM (Compute Instance)
1. In the OCI console: **Menu → Compute → Instances → Create instance**.
2. Name: `quizcraft-vm`
3. **Image**: Canonical **Ubuntu 22.04** (free tier eligible).
4. **Shape**: Click "Change shape" → pick **Ampere** → **VM.Standard.A1.Flex**.
   - Set **4 OCPUs** and **24 GB memory** (the entire free ARM allowance).
   - If "out of capacity", try a different Availability Domain or retry the next day.
5. **Networking**: leave defaults (creates a new VCN and subnet). Make sure "Assign a public IPv4 address" is checked.
6. **SSH keys**: choose "Generate a key pair for me" and download both the private and public keys. Keep the private key safe — you'll need it to connect.
7. Click **Create**. Wait ~2 min.
8. Copy the **Public IP address** from the instance details page.

### 1.3 Open ports in the Oracle Security List (critical!)
Oracle has TWO firewalls. Open ports at the cloud level first.
1. On the instance page → **Virtual cloud network** link → **Security Lists** → **Default Security List**.
2. Click **Add Ingress Rules** and add these (Source CIDR = `0.0.0.0/0`, IP Protocol = TCP):
   - Destination port **80** (HTTP)
   - Destination port **443** (HTTPS)
3. Port 22 (SSH) is already open.

---

## Phase 2 — Connect & Prepare the VM

### 2.1 SSH in
From your computer (Mac/Linux):
```bash
chmod 400 ~/Downloads/ssh-key-2026-04-18.key
ssh -i ~/Downloads/ssh-key-2026-04-18.key ubuntu@<YOUR_PUBLIC_IP>
```
On Windows use PuTTY or the Windows OpenSSH client.

### 2.2 Update the system
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git unzip ufw
```

### 2.3 Open ports on the VM's firewall
Ubuntu images on Oracle ship with `iptables` rules that block everything except SSH. Fix this:
```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

---

## Phase 3 — Install the Stack

### 3.1 Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl enable --now nginx
```
Visit `http://<YOUR_PUBLIC_IP>` — you should see the Nginx welcome page. If not, revisit Phase 1.3 and 2.3.

### 3.2 Install PHP 8.2 + extensions + Composer
```bash
sudo apt install -y software-properties-common
sudo add-apt-repository -y ppa:ondrej/php
sudo apt update
sudo apt install -y php8.2-fpm php8.2-cli php8.2-mysql php8.2-mbstring \
  php8.2-xml php8.2-curl php8.2-zip php8.2-bcmath
sudo systemctl enable --now php8.2-fpm

# Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
```

### 3.3 Install Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # should print v20.x
```

### 3.4 Install MySQL 8
```bash
sudo apt install -y mysql-server
sudo systemctl enable --now mysql
sudo mysql_secure_installation
# Answer: y for VALIDATE PASSWORD (choose level 1), set a strong root password,
# y to remove anon users, y to disallow remote root, y to remove test DB, y to reload.
```

---

## Phase 4 — Deploy the Code

### 4.1 Clone your project
```bash
cd /var/www
sudo mkdir -p quizcraft
sudo chown ubuntu:ubuntu quizcraft
cd quizcraft
git clone <YOUR_GITHUB_REPO_URL> .
```
If the repo is private, set up a deploy key or use an HTTPS token.

### 4.2 Create the database
```bash
sudo mysql -u root -p
```
Inside the MySQL prompt:
```sql
CREATE DATABASE fast_q CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'quizcraft'@'localhost' IDENTIFIED BY 'A_STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON fast_q.* TO 'quizcraft'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```
Load schema + (optional) seed:
```bash
mysql -u quizcraft -p fast_q < database/schema.sql
mysql -u quizcraft -p fast_q < database/seed.sql
```

### 4.3 Configure the `.env`
```bash
cp .env.example .env
nano .env
```
Edit to match:
```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=fast_q
DB_USER=quizcraft
DB_PASS=A_STRONG_PASSWORD_HERE

JWT_SECRET=<run `openssl rand -hex 32` and paste the result>
JWT_ACCESS_LIFETIME=900
JWT_REFRESH_LIFETIME=604800

PHP_PORT=8000
REALTIME_PORT=3001
FRONTEND_PORT=8080

# Replace with your domain (or http://<IP> for now)
FRONTEND_URL=http://<YOUR_PUBLIC_IP>
```

### 4.4 Install API dependencies
```bash
cd /var/www/quizcraft/api
composer install --no-dev --optimize-autoloader
```

### 4.5 Install + start the realtime service as a systemd service
```bash
cd /var/www/quizcraft/realtime
npm install --omit=dev
```
Create the systemd unit:
```bash
sudo nano /etc/systemd/system/quizcraft-realtime.service
```
Paste:
```ini
[Unit]
Description=QuizCraft Realtime (Socket.io)
After=network.target mysql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/var/www/quizcraft/realtime
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```
Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now quizcraft-realtime
sudo systemctl status quizcraft-realtime    # should be "active (running)"
```

### 4.6 Build the frontend
Before building, update the frontend to point to production URLs (relative paths work if everything is behind the same Nginx — which is what we'll do, so **no code changes needed**):
```bash
cd /var/www/quizcraft/frontend
npm ci
npm run build
```
The build output will be in `frontend/dist/`.

---

## Phase 5 — Configure Nginx (the glue)

### 5.1 Set permissions so Nginx can read the frontend
```bash
sudo chown -R www-data:www-data /var/www/quizcraft/frontend/dist
```

### 5.2 Create the Nginx site config
```bash
sudo nano /etc/nginx/sites-available/quizcraft
```
Paste (replace `<YOUR_PUBLIC_IP>` or later your domain):
```nginx
server {
    listen 80;
    server_name <YOUR_PUBLIC_IP>;

    root /var/www/quizcraft/frontend/dist;
    index index.html;

    # PHP REST API  →  /api/*
    location /api/ {
        root /var/www/quizcraft/api/public;
        rewrite ^/api/(.*)$ /index.php?/$1 last;

        try_files $uri $uri/ /index.php?$query_string;

        location ~ \.php$ {
            include snippets/fastcgi-php.conf;
            fastcgi_pass unix:/run/php/php8.2-fpm.sock;
            fastcgi_param SCRIPT_FILENAME /var/www/quizcraft/api/public/index.php;
        }
    }

    # Socket.io (WebSocket upgrade)
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # React SPA — everything else falls through to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    client_max_body_size 10M;
}
```

### 5.3 Enable and reload
```bash
sudo ln -sf /etc/nginx/sites-available/quizcraft /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t               # should say "syntax is ok"
sudo systemctl reload nginx
```

Visit `http://<YOUR_PUBLIC_IP>` — you should see the QuizCraft frontend. Sign in with `demo@quizcraft.com / password123` if you seeded the DB.

---

## Phase 6 — (Optional but recommended) Domain + Free HTTPS

### 6.1 Point a domain at the VM
Any domain works. If you don't own one, use a free subdomain service:
- **DuckDNS** (https://duckdns.org) — creates `yourname.duckdns.org` pointing to your IP.
- Or buy a cheap `.xyz` for ~$1/year on Namecheap.

Create an **A record** pointing to your Oracle public IP.

### 6.2 Update `server_name` and re-run
```bash
sudo nano /etc/nginx/sites-available/quizcraft     # change server_name to your domain
sudo nginx -t && sudo systemctl reload nginx
```

### 6.3 Install free SSL with Let's Encrypt
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```
Certbot auto-edits your Nginx config, redirects HTTP→HTTPS, and renews every 90 days automatically.

### 6.4 Update `.env`
```bash
nano /var/www/quizcraft/.env
# Change: FRONTEND_URL=https://yourdomain.com
sudo systemctl restart quizcraft-realtime
sudo systemctl reload php8.2-fpm
```

---

## Phase 7 — Post-Deploy Checklist

Run these to confirm everything is working:
```bash
# All services up?
systemctl is-active nginx php8.2-fpm mysql quizcraft-realtime

# Frontend loads?
curl -I http://localhost

# API responds?
curl http://localhost/api/stats/global

# Socket health?
curl http://localhost/socket.io/?EIO=4&transport=polling

# Watch realtime logs if something's off
journalctl -u quizcraft-realtime -f
```

---

## Common Troubleshooting

**Browser shows Nginx default page, not your app**
Make sure you removed `sites-enabled/default`:
```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo systemctl reload nginx
```

**Can't reach site from the internet**
Check BOTH firewalls:
1. Oracle Security List has ingress rules for 80/443 (Phase 1.3).
2. VM iptables has the ACCEPT rules (Phase 2.3): `sudo iptables -L INPUT -n --line-numbers`.

**PHP returns 502 Bad Gateway**
Check PHP-FPM socket path:
```bash
ls /run/php/          # should show php8.2-fpm.sock
sudo systemctl status php8.2-fpm
sudo tail /var/log/nginx/error.log
```

**Socket.io fails to connect (CORS error)**
Verify `.env` `FRONTEND_URL` matches the domain/IP the browser is using (http vs https matters) and restart:
```bash
sudo systemctl restart quizcraft-realtime
```

**DB connection refused**
Make sure the DB user password in `.env` matches what you set in Phase 4.2, and that it's `localhost` not `127.0.0.1` (MySQL auth plugins differ).

---

## Updating Your App Later

Push to GitHub, then on the VM:
```bash
cd /var/www/quizcraft
git pull

# If API changed:
cd api && composer install --no-dev --optimize-autoloader

# If realtime changed:
cd ../realtime && npm ci --omit=dev
sudo systemctl restart quizcraft-realtime

# If frontend changed:
cd ../frontend && npm ci && npm run build
sudo systemctl reload nginx
```

---

## Estimated Time
- Phase 1 (account + VM): **20–30 min**
- Phase 2–3 (install stack): **15 min**
- Phase 4 (deploy code + DB): **20 min**
- Phase 5 (Nginx): **10 min**
- Phase 6 (domain + SSL): **15 min**

Total: ~90 minutes for a complete, free, production-grade deployment.
