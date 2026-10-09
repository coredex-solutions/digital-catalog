# Deploying Coredex to a VPS

This sets up the app on an Ubuntu server (22.04 or 24.04) with:

- **Node.js 22**: runs the app
- **PM2**: keeps it running and restarts it after a crash or reboot
- **nginx**: receives web traffic and passes it to the app
- **Let's Encrypt**: free HTTPS certificate

The database stays on Turso and images stay on Cloudflare R2, so the server holds no data and can be rebuilt at any time.

Replace `example.com` with your domain everywhere below.

---

## 1. Before you start

- A VPS with at least **2 GB RAM** (1 GB works if you add swap, step 2).
- Your domain's DNS: add an **A record** for `example.com` and `www.example.com` pointing to the server's IP. It can take a few minutes to update.
- Your code pushed to GitHub (`coredex-solutions/digital-catalog`).

## 2. Prepare the server (once)

Log in with `ssh root@YOUR_SERVER_IP`, then:

```bash
# System packages
apt update && apt upgrade -y
apt install -y git nginx certbot python3-certbot-nginx ufw

# Node.js 22 and PM2
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
npm install -g pm2

# Firewall: allow SSH and web traffic only
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# Only on a 1 GB server: add 2 GB of swap so the build doesn't run out of memory
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

## 3. Get the code

```bash
mkdir -p /var/www && cd /var/www
git clone https://github.com/coredex-solutions/digital-catalog.git coredex
cd coredex
git checkout main   # or the branch you deploy from
```

The repository is private, so GitHub asks for a login. Use your GitHub username and a **personal access token** (GitHub → Settings → Developer settings → Fine-grained tokens, with read access to this repository's contents) as the password.

## 4. Add the settings

Create `/var/www/coredex/.env.local` with `nano .env.local` and fill in:

```bash
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...

R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...

# Generate with: openssl rand -base64 32   (keep it the same across deploys, or everyone is logged out)
JWT_SECRET=...

# Your public address: used in QR codes and links. Set it before building.
NEXT_PUBLIC_BASE_URL=https://example.com

# Email for signup verification codes
SMTP_HOST=...
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=info@example.com
SMTP_PASS=...

# AI features (menu wizard, AI waiter, voice): add the keys you use
GOOGLE_API_KEY=...
GROQ_API_KEY=...
OPENAI_API_KEY=...
```

Then lock the file down: `chmod 600 .env.local`.

## 5. Build and start

```bash
npm ci --legacy-peer-deps
node scripts/init-db.mjs          # creates or updates the database tables; safe to re-run
npm run build
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup                       # prints one command: copy and run it, so the app starts after a reboot
```

Check it: `curl -I http://127.0.0.1:3000` should answer `200`.

## 6. Connect the domain

```bash
cp deploy/nginx.conf /etc/nginx/sites-available/coredex
sed -i 's/example.com/YOUR-DOMAIN.com/g' /etc/nginx/sites-available/coredex
ln -s /etc/nginx/sites-available/coredex /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# HTTPS (also sets up automatic renewal and redirects http → https)
certbot --nginx -d YOUR-DOMAIN.com -d www.YOUR-DOMAIN.com
```

Open `https://YOUR-DOMAIN.com`.

## 7. First-time content

```bash
npm run create-superadmin          # your platform admin login
npx tsx scripts/seed-demo.ts       # optional: the live demo menu at /c/demo (prints its admin password once)
```

---

## Updating after you push new code

```bash
cd /var/www/coredex && bash deploy/update.sh
```

It pulls the code, installs packages, updates the database tables, builds, and restarts without downtime.

## Useful commands

| What | Command |
|---|---|
| See if the app is running | `pm2 status` |
| Live logs (errors, verification codes) | `pm2 logs coredex` |
| Restart | `pm2 restart coredex` |
| After editing `.env.local` | `npm run build && pm2 reload coredex --update-env` |
| nginx errors | `tail -f /var/log/nginx/error.log` |

`NEXT_PUBLIC_*` values are built into the pages, so changing `NEXT_PUBLIC_BASE_URL` needs a rebuild, not just a restart.
