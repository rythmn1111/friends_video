# Backend Deployment Guide (VPS + PM2)

## Prerequisites

- A VPS running Ubuntu/Debian (any cloud provider works)
- SSH access to the VPS
- A domain or just the raw IP address

---

## 1. Connect to your VPS

```bash
ssh root@YOUR_VPS_IP
```

---

## 2. Install Bun

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
bun --version  # verify
```

---

## 3. Install Node.js + PM2

PM2 is a Node.js tool, so Node is required even though the app runs on Bun.

```bash
# Install Node.js (LTS)
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt install -y nodejs

# Install PM2 globally
npm install -g pm2

pm2 --version  # verify
```

---

## 4. Clone the repo

```bash
git clone https://github.com/rythmn1111/friends_video.git
cd friends_video/backend
```

---

## 5. Start the server with PM2

```bash
pm2 start --interpreter bun --name friends-signal index.ts
```

Check it's running:

```bash
pm2 status
pm2 logs friends-signal
```

You should see:

```
Signaling server running on port 3001
Local:   ws://localhost:3001/signal
Network: ws://YOUR_VPS_IP:3001/signal
```

---

## 6. Open the firewall port

```bash
# If using ufw
ufw allow 3001/tcp
ufw status
```

If your VPS provider has a separate firewall panel (DigitalOcean, AWS, etc.), add an inbound rule for **TCP port 3001**.

---

## 7. Auto-start on reboot

```bash
pm2 startup
# PM2 will print a command — copy and run it, looks like:
# sudo env PATH=... pm2 startup systemd -u root --hp /root

pm2 save  # save current process list
```

Now the signaling server will restart automatically if the VPS reboots.

---

## 8. Test it

From your local machine:

```bash
curl http://YOUR_VPS_IP:3001
# Should return: Friends Video Signaling Server
```

---

## Useful PM2 commands

```bash
pm2 status                    # see all running processes
pm2 logs friends-signal       # live logs
pm2 restart friends-signal    # restart after code changes
pm2 stop friends-signal       # stop
pm2 delete friends-signal     # remove from PM2

# Update to latest code
cd ~/friends_video
git pull
pm2 restart friends-signal
```

---

## Connecting from the app

In the join screen, click **Advanced (server URL)** and enter:

```
ws://YOUR_VPS_IP:3001/signal
```

Everyone in the call uses this same URL. The actual video/audio is peer-to-peer — the server only handles the initial handshake.

---

## Optional: use a domain + HTTPS (wss://)

If you have a domain pointing to your VPS, you can run the signaling server behind Nginx with SSL so the URL is `wss://signal.yourdomain.com`.

### Install Nginx + Certbot

```bash
apt install -y nginx certbot python3-certbot-nginx
```

### Nginx config

Create `/etc/nginx/sites-available/friends-signal`:

```nginx
server {
    server_name signal.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/friends-signal /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Get SSL cert
certbot --nginx -d signal.yourdomain.com
```

Now use `wss://signal.yourdomain.com` in the app.
