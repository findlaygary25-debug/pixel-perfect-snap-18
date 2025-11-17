# Hetzner Deployment Guide - Step by Step

## Prerequisites Checklist

Before starting, make sure you have:
- ✅ A Hetzner server (any plan - CX11 for €4.15/month is enough)
- ✅ Your server's IP address
- ✅ Root or sudo access to your server
- ✅ A domain name (optional but recommended for production)
- ✅ SSH client installed on your computer (built-in on Mac/Linux, use PuTTY on Windows)

---

## Step 1: Export Your Project to GitHub

### 1.1 Connect to GitHub
1. Open your project in Lovable
2. Look for the **GitHub** button in the top-right corner
3. Click it and select **Connect to GitHub**
4. Authorize the Lovable GitHub App when prompted
5. Choose which GitHub account/organization to use

### 1.2 Create the Repository
1. Click **Create Repository** in Lovable
2. Wait for the export to complete (usually takes 30-60 seconds)
3. Click **View on GitHub** to confirm your code is there
4. **Copy the repository URL** - you'll need it soon
   - Example: `https://github.com/yourusername/your-project-name.git`

---

## Step 2: Prepare the Deployment Script

### 2.1 Download the Script
1. In your Lovable project, find the file called `deploy.sh`
2. Download it to your computer

### 2.2 Edit Configuration
1. Open `deploy.sh` in any text editor (Notepad, TextEdit, VS Code, etc.)
2. Find line 17: `REPO_URL="YOUR_GITHUB_REPO_URL"`
3. Replace `YOUR_GITHUB_REPO_URL` with your actual GitHub URL from Step 1.2
4. Find line 19: `DOMAIN="your-domain.com"`
5. Replace with:
   - Your domain name if you have one: `"mywebsite.com"`
   - OR your server IP: `"123.45.67.89"`
6. Save the file

**Example of edited lines:**
```bash
REPO_URL="https://github.com/johndoe/my-awesome-app.git"
DOMAIN="mywebsite.com"  # or "123.45.67.89"
```

---

## Step 3: Connect to Your Hetzner Server

### 3.1 Get Your Server's IP Address
1. Log into your Hetzner Cloud Console
2. Click on your server
3. Copy the IPv4 address (looks like: 123.45.67.89)

### 3.2 SSH into the Server

**On Mac/Linux:**
```bash
ssh root@YOUR_SERVER_IP
```

**On Windows (using Command Prompt or PowerShell):**
```bash
ssh root@YOUR_SERVER_IP
```

**On Windows (using PuTTY):**
1. Open PuTTY
2. Enter your server IP in "Host Name"
3. Click "Open"

When prompted:
- Type `yes` to accept the server fingerprint
- Enter your root password (from Hetzner email)

---

## Step 4: Upload the Deployment Script

### 4.1 Upload from Your Computer

**Open a NEW terminal/command prompt** (keep your SSH connection open) and run:

**On Mac/Linux/Windows:**
```bash
scp deploy.sh root@YOUR_SERVER_IP:~/
```

Replace `YOUR_SERVER_IP` with your actual IP address.

When prompted, enter your root password again.

**Alternative: Manual Copy-Paste**
If `scp` doesn't work:
1. In your SSH session, type: `nano deploy.sh`
2. Copy the entire contents of your edited `deploy.sh` file
3. Paste into the nano editor
4. Press `Ctrl+X`, then `Y`, then `Enter` to save

---

## Step 5: Run the Deployment Script

### 5.1 Make the Script Executable

In your SSH session, type:
```bash
chmod +x deploy.sh
```

Press Enter.

### 5.2 Run the Script

```bash
./deploy.sh
```

Press Enter and wait. The script will:
- ✅ Install Node.js (1-2 minutes)
- ✅ Install Nginx web server (30 seconds)
- ✅ Clone your GitHub repository (30 seconds)
- ✅ Install project dependencies (2-3 minutes)
- ✅ Build your application (1-2 minutes)
- ✅ Configure Nginx (10 seconds)
- ✅ Start serving your app

**Total time: 5-8 minutes**

You'll see colored output showing progress. Green checkmarks ✅ mean success.

---

## Step 6: Verify Your App is Running

### 6.1 Test with Server IP

Open your browser and go to:
```
http://YOUR_SERVER_IP
```

You should see your app! 🎉

**If you see an error:**
- Wait 1-2 minutes and try again (DNS might be propagating)
- Check troubleshooting section below

---

## Step 7: Connect Your Domain (Optional but Recommended)

### 7.1 Point Your Domain to Hetzner

Log into your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.) and add these DNS records:

**Record 1: Root Domain**
```
Type: A
Name: @
Value: YOUR_SERVER_IP
TTL: 3600
```

**Record 2: WWW Subdomain**
```
Type: A
Name: www
Value: YOUR_SERVER_IP
TTL: 3600
```

**Important:** DNS changes can take 1-72 hours to propagate worldwide, but usually work within 10-30 minutes.

### 7.2 Wait for DNS Propagation

Check if your domain is ready:
```bash
ping your-domain.com
```

If it shows your server IP, you're ready!

You can also use https://dnschecker.org to check propagation globally.

---

## Step 8: Enable HTTPS (Strongly Recommended)

Once your domain is working (Step 7.2), add SSL encryption:

### 8.1 Install Certbot

In your SSH session:
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 8.2 Get Free SSL Certificate

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Replace `your-domain.com` with your actual domain.

When prompted:
1. Enter your email address
2. Type `Y` to agree to terms
3. Type `N` to decline marketing emails (or `Y` if you want them)
4. Type `2` to redirect HTTP to HTTPS

**Done!** Your site now has `https://` and is secure. 🔒

Certbot will automatically renew your certificate before it expires.

---

## Updating Your App (After Initial Deployment)

Whenever you make changes in Lovable, they automatically sync to GitHub.

To update your live site:

### Method 1: Use the Update Script

```bash
ssh root@YOUR_SERVER_IP
./update.sh
```

That's it! Takes about 2-3 minutes.

### Method 2: Manual Update

```bash
ssh root@YOUR_SERVER_IP
cd /var/www/lovable-app
git pull origin main
npm install
npm run build
sudo systemctl reload nginx
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
