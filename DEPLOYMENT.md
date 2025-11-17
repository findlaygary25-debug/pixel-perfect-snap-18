# Hetzner Deployment Guide

## Quick Start (5 minutes)

### Prerequisites
- A Hetzner server (Ubuntu 20.04 or later recommended)
- SSH access to your server
- Your GitHub repository URL (export your project to GitHub first)
- A domain name (optional, but recommended)

### Step 1: Export to GitHub
1. In Lovable, click the **GitHub** button (top right)
2. Click **Connect to GitHub** and authorize
3. Click **Create Repository** to export your code

### Step 2: Prepare the Deployment Script
1. Download `deploy.sh` from your project
2. Open it and replace these values:
   ```bash
   REPO_URL="YOUR_GITHUB_REPO_URL"  # Your GitHub repo URL
   DOMAIN="your-domain.com"          # Your domain or server IP
   ```

### Step 3: Run on Your Server
```bash
# SSH into your Hetzner server
ssh root@YOUR_SERVER_IP

# Upload the script (from your local machine)
scp deploy.sh root@YOUR_SERVER_IP:~/

# On the server, make it executable and run
chmod +x deploy.sh
./deploy.sh
```

The script will automatically:
- ✅ Install Node.js, Nginx, and dependencies
- ✅ Clone your repository
- ✅ Build your application
- ✅ Configure Nginx
- ✅ Start serving your app

### Step 4: Point Your Domain
Add an **A record** in your domain DNS settings:
```
Type: A
Name: @
Value: YOUR_SERVER_IP
TTL: 3600
```

Also add a **www** subdomain:
```
Type: A
Name: www
Value: YOUR_SERVER_IP
TTL: 3600
```

### Step 5: Enable HTTPS (Recommended)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Certbot will automatically configure SSL and set up auto-renewal.

---

## Future Updates

After making changes in Lovable:
1. Changes automatically sync to GitHub (if connected)
2. SSH into your server
3. Run the update script:
   ```bash
   ./update.sh
   ```

That's it! Your changes are live.

---

## Troubleshooting

### Check if your app is running:
```bash
curl http://localhost
```

### Check Nginx status:
```bash
sudo systemctl status nginx
```

### View Nginx error logs:
```bash
sudo tail -f /var/log/nginx/error.log
```

### Rebuild manually:
```bash
cd /var/www/lovable-app
npm install
npm run build
sudo systemctl reload nginx
```

### Check firewall:
```bash
sudo ufw status
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
```

---

## File Locations

- **App files**: `/var/www/lovable-app`
- **Built files**: `/var/www/lovable-app/dist`
- **Nginx config**: `/etc/nginx/sites-available/lovable-app`
- **Nginx logs**: `/var/log/nginx/`

---

## Common Issues

### "502 Bad Gateway"
- Check if the build completed: `ls /var/www/lovable-app/dist`
- Rebuild: `cd /var/www/lovable-app && npm run build`

### "Connection refused"
- Check Nginx: `sudo systemctl status nginx`
- Restart: `sudo systemctl restart nginx`

### Domain not resolving
- DNS can take up to 48 hours to propagate
- Test with server IP first: `http://YOUR_SERVER_IP`

---

## Cost Optimization

For a small app, the cheapest Hetzner server (CX11 - €4.15/month) is sufficient:
- 2 GB RAM
- 1 vCPU
- 20 GB SSD

Upgrade if you need more resources as your app grows.

---

## Need Help?

1. Check the troubleshooting section above
2. Review Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Check if the app builds locally: `npm run build`
