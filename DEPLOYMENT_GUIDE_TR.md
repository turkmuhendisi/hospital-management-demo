# 🚀 Production Deployment Kılavuzu

Bu dashboard'u canlıya almanın farklı yöntemleri ve detaylı adımları.

## 📋 Önemli: Bu React Değil!

Bu proje **React değil**, şunlardan oluşuyor:
- **Backend**: Python FastAPI (REST API + WebSocket)
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Database**: SQLite (geliştirme) / PostgreSQL (production önerilen)
- **Real-time**: Socket.IO

❌ **Sadece frontend'i Netlify/Vercel'e atamazsınız** çünkü backend gerekli!

---

## 🎯 Deployment Seçenekleri

### Seçenek 1: 🐳 Docker ile Deploy (ÖNERİLEN)
**En kolay ve güvenilir yöntem**

### Seçenek 2: ☁️ Cloud Platform (Heroku, Railway, Render)
**Hızlı deployment, yönetim kolay**

### Seçenek 3: 🖥️ VPS/Cloud Server (DigitalOcean, AWS, Linode)
**Tam kontrol, daha ucuz long-term**

### Seçenek 4: 🔀 Split Deployment
**Frontend (Vercel) + Backend (Railway)**

---

## 🐳 Seçenek 1: Docker ile Deploy (ÖNERİLEN)

### Adım 1: Docker Dosyalarını Kullan
Proje için hazırladığım Docker dosyaları:
- `Dockerfile` - Backend container'ı
- `docker-compose.yml` - Tüm servisleri çalıştırır

### Adım 2: Build ve Deploy
```bash
# 1. Docker build
docker build -t audit-dashboard .

# 2. Run container
docker run -d \
  -p 8082:8082 \
  -e DATABASE_URL="sqlite:///./data/audit_production.db" \
  -e SECRET_KEY="your-production-secret-key" \
  -v $(pwd)/data:/app/data \
  --name audit-dashboard \
  audit-dashboard
```

### Adım 3: Docker Hub'a Push (opsiyonel)
```bash
docker tag audit-dashboard yourusername/audit-dashboard:latest
docker push yourusername/audit-dashboard:latest
```

### Cloud'da Deploy
**DigitalOcean App Platform:**
```bash
# doctl ile deploy
doctl apps create --spec .do/app.yaml
```

**AWS ECS/Fargate:**
- ECR'ye image push
- ECS task definition oluştur
- Service deploy et

**Google Cloud Run:**
```bash
gcloud run deploy audit-dashboard \
  --image gcr.io/your-project/audit-dashboard \
  --platform managed \
  --port 8082 \
  --allow-unauthenticated
```

---

## ☁️ Seçenek 2: Cloud Platform Deploy

### A) Railway.app (ÖNERİLEN - ÜCRETSİZ BAŞLANGIÇ)

1. **GitHub'a Push**
```bash
cd /Users/turkmuhendisi/Documents/teleradyoloji-sim/teleradyoloji
git add .
git commit -m "Prepare for deployment"
git push
```

2. **Railway'e Deploy**
   - https://railway.app adresine git
   - "New Project" > "Deploy from GitHub repo"
   - `teleradyoloji-sim` repo'sunu seç
   - Root directory: `teleradyoloji/web_dashboard/advanced`
   - Environment Variables ekle:
     ```
     DATABASE_URL=postgresql://...
     SECRET_KEY=your-secret-key
     DEBUG=false
     HOST=0.0.0.0
     PORT=8082
     ```

3. **Domain Ekle**
   - Railway otomatik domain verir: `yourapp.railway.app`
   - Custom domain da ekleyebilirsiniz

**Maliyet:** 
- İlk $5 ücretsiz/ay
- Sonra ~$5-20/ay

---

### B) Render.com (ÜCRETSİZ PLAN VAR)

1. **Web Service Oluştur**
   - https://render.com adresine git
   - "New Web Service"
   - GitHub repo bağla
   - Build Command: `cd teleradyoloji/web_dashboard/advanced && pip install -r ../../../../requirements.txt`
   - Start Command: `cd teleradyoloji && python -m uvicorn web_dashboard.advanced.backend.main:socket_app --host 0.0.0.0 --port 8082`

2. **Environment Variables**
   ```
   DATABASE_URL=postgresql://...
   SECRET_KEY=random-secret-key
   DEBUG=false
   PYTHON_VERSION=3.9
   ```

**Maliyet:**
- Free tier: Yavaş, sleep sonrası cold start
- Paid: $7/ay başlangıç

---

### C) Heroku (KOLAY AMA ÜCRETLÝ)

1. **Procfile oluştur** (hazırladım)
2. **Deploy**
```bash
heroku login
heroku create audit-dashboard-app
heroku addons:create heroku-postgresql:mini
git push heroku main
```

**Maliyet:** $5-7/ay başlangıç

---

## 🖥️ Seçenek 3: VPS/Cloud Server

### DigitalOcean Droplet (Ubuntu)

#### 1. Droplet Oluştur
- Ubuntu 22.04 LTS
- $6/ay plan (1GB RAM)
- SSH key ekle

#### 2. Server Setup
```bash
# SSH ile bağlan
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install dependencies
apt install -y python3 python3-pip nginx certbot python3-certbot-nginx git

# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Create database
sudo -u postgres psql
CREATE DATABASE audit_db;
CREATE USER audit_user WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE audit_db TO audit_user;
\q
```

#### 3. Deploy Application
```bash
# Clone repo
cd /opt
git clone https://github.com/yourusername/teleradyoloji-sim.git
cd teleradyoloji-sim/teleradyoloji

# Install Python dependencies
pip3 install -r requirements.txt

# Create .env file
cat > web_dashboard/advanced/.env << EOF
DATABASE_URL=postgresql://audit_user:your-password@localhost/audit_db
SECRET_KEY=$(openssl rand -hex 32)
DEBUG=false
HOST=0.0.0.0
PORT=8082
EOF
```

#### 4. Systemd Service (Auto-restart)
```bash
# Create service file
cat > /etc/systemd/system/audit-dashboard.service << EOF
[Unit]
Description=Audit Dashboard
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/teleradyoloji-sim/teleradyoloji
ExecStart=/usr/local/bin/python3 -m uvicorn web_dashboard.advanced.backend.main:socket_app --host 0.0.0.0 --port 8082
Restart=always
RestartSec=10

Environment="DATABASE_URL=postgresql://audit_user:your-password@localhost/audit_db"
Environment="SECRET_KEY=your-secret-key"
Environment="DEBUG=false"

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
systemctl daemon-reload
systemctl enable audit-dashboard
systemctl start audit-dashboard
systemctl status audit-dashboard
```

#### 5. Nginx Reverse Proxy
```bash
# Create nginx config
cat > /etc/nginx/sites-available/audit-dashboard << EOF
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8082;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # WebSocket support
    location /socket.io {
        proxy_pass http://localhost:8082;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/audit-dashboard /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

#### 6. SSL Certificate (HTTPS)
```bash
certbot --nginx -d your-domain.com
```

**Maliyet:** $6/ay DigitalOcean

---

## 🔀 Seçenek 4: Split Deployment

### Frontend → Vercel/Netlify
### Backend → Railway/Render

#### Frontend Deploy (Vercel)
```bash
# Frontend'i ayrı klasöre çıkar
mkdir -p deploy/frontend
cp web_dashboard/advanced/index.html deploy/frontend/
cp web_dashboard/advanced/styles.css deploy/frontend/
cp web_dashboard/advanced/advanced-script-v2.js deploy/frontend/
cp web_dashboard/advanced/AsrınGlobalLogo.svg deploy/frontend/

# vercel.json oluştur
cat > deploy/frontend/vercel.json << EOF
{
  "version": 2,
  "builds": [
    {
      "src": "index.html",
      "use": "@vercel/static"
    }
  ]
}
EOF

# Deploy
cd deploy/frontend
vercel --prod
```

#### Backend Deploy (Railway)
- Railway'e sadece backend'i deploy et
- Environment variables ayarla

#### Frontend'de API URL'ini güncelle
```javascript
// advanced-script-v2.js içinde
const API_BASE_URL = 'https://your-backend.railway.app';
const SOCKET_URL = 'https://your-backend.railway.app';
```

---

## ⚙️ Production Ayarları

### 1. Environment Variables (.env)
```bash
# Production .env
APP_NAME="Enterprise Audit Trail Dashboard"
APP_VERSION="2.0.0"
DEBUG=false

# Server
HOST=0.0.0.0
PORT=8082

# Database (PostgreSQL ÖNERİLEN)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Security
SECRET_KEY=your-very-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# CORS
CORS_ORIGINS=["https://yourdomain.com","https://www.yourdomain.com"]

# Data Generation
GENERATE_REALISTIC_DATA=true
DATA_GENERATION_INTERVAL=5
HISTORICAL_DATA_DAYS=30

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json
```

### 2. config.py Güncellemesi
Production için `web_dashboard/advanced/backend/config.py` içinde:
```python
DEBUG: bool = False  # Production'da false
CORS_ORIGINS: list = [
    "https://yourdomain.com",  # Sadece gerçek domain'ler
]
```

### 3. Güvenlik Checklist
- [ ] `DEBUG=false`
- [ ] Güçlü `SECRET_KEY` (32+ karakter)
- [ ] CORS sadece gerçek domain'ler
- [ ] PostgreSQL kullan (SQLite production'da yavaş)
- [ ] HTTPS aktif (SSL certificate)
- [ ] Environment variables güvenli sakla
- [ ] Database backup stratejisi
- [ ] Rate limiting ekle
- [ ] Input validation aktif

---

## 📊 Database Migration (SQLite → PostgreSQL)

```bash
# 1. PostgreSQL veritabanı oluştur
# 2. SQLite'dan export et
sqlite3 data/audit_production.db .dump > backup.sql

# 3. PostgreSQL'e import et (manuel düzenleme gerekebilir)
psql postgresql://user:pass@host:5432/dbname < backup.sql
```

Ya da ORM migration kullan (Alembic).

---

## 🔍 Monitoring ve Maintenance

### Health Check
```bash
curl https://yourdomain.com/health
```

### Logs
```bash
# Systemd logs
journalctl -u audit-dashboard -f

# Application logs
tail -f logs/audit.log
```

### Auto-Update Script
```bash
#!/bin/bash
cd /opt/teleradyoloji-sim
git pull
systemctl restart audit-dashboard
```

---

## 💰 Maliyet Karşılaştırması

| Platform | Başlangıç | Avantaj | Dezavantaj |
|----------|-----------|---------|------------|
| **Railway** | $0-5/ay | Kolay, otomatik SSL | Limit sonrası ücretli |
| **Render** | $0-7/ay | Free tier var | Cold start |
| **Heroku** | $7/ay | Çok kolay | Pahalı scale |
| **DigitalOcean** | $6/ay | Tam kontrol, ucuz | Manuel setup |
| **AWS/GCP** | Değişken | Profesyonel, scalable | Karmaşık, pahalı olabilir |
| **Vercel+Railway** | $0-10/ay | Modern stack | Split deployment |

---

## 🚀 Hızlı Başlangıç Önerileri

### Yeni Başlıyorsanız:
✅ **Railway.app** - En kolay, 5 dakika deploy

### Öğrenmek İstiyorsanız:
✅ **DigitalOcean VPS** - Tam kontrol, DevOps öğrenme

### Profesyonel Proje:
✅ **Docker + AWS ECS** ya da **Kubernetes**

### Düşük Bütçe:
✅ **Render Free Tier** (cold start kabul edilebilirse)

---

## 📞 Yardım

Deployment sırasında sorun yaşarsanız:
1. `systemctl status audit-dashboard` (VPS)
2. Platform logs (Railway/Render)
3. `docker logs audit-dashboard` (Docker)

---

## ✅ Deployment Checklist

- [ ] Production environment variables ayarlandı
- [ ] DEBUG=false
- [ ] PostgreSQL configured (production)
- [ ] HTTPS/SSL aktif
- [ ] CORS production domains
- [ ] Güçlü SECRET_KEY
- [ ] Database backup strategy
- [ ] Monitoring setup
- [ ] Health check endpoint test edildi
- [ ] WebSocket çalışıyor
- [ ] Static files serve ediliyor
- [ ] Error handling ve logging aktif

---

**Başarılar! 🎉**

