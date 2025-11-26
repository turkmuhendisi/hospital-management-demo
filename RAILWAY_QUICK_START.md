# ⚡ Railway Quick Start - 5 Dakikada Deploy

## 🚀 Hızlı Başlangıç

### 1. Railway'e Giriş
- https://railway.app → GitHub ile giriş

### 2. Proje Oluştur
- "New Project" → "Deploy from GitHub repo"
- Repo'yu seç: `teleradyoloji-sim`

### 3. Root Directory
- Service > Settings > Root Directory:
  ```
  teleradyoloji/web_dashboard/advanced
  ```

### 4. PostgreSQL Ekle
- Project > "+ New" → "Database" → "Add PostgreSQL"
- `DATABASE_URL` otomatik eklenir ✅

### 5. Environment Variables
Service > Settings > Variables:

```bash
SECRET_KEY=openssl-rand-hex-32-ile-oluştur
DEBUG=false
CORS_ORIGINS=["*"]
GENERATE_REALISTIC_DATA=true
```

### 6. Domain Oluştur
- Service > Settings > Domains → "Generate Domain"
- URL'yi kopyala

### 7. CORS Güncelle
- Variables > CORS_ORIGINS:
  ```json
  ["https://your-app.up.railway.app","*"]
  ```

### 8. Test Et
```bash
curl https://your-app.up.railway.app/health
```

**✅ Hazır!**

---

## 📋 Environment Variables Özeti

### Zorunlu:
- `SECRET_KEY` - openssl rand -hex 32
- `DEBUG=false`
- `CORS_ORIGINS=["https://your-app.up.railway.app","*"]`

### Otomatik (Railway):
- `DATABASE_URL` - PostgreSQL eklediğinizde
- `PORT` - Railway otomatik verir

### Opsiyonel:
- `GENERATE_REALISTIC_DATA=true`
- `DATA_GENERATION_INTERVAL=5`
- `HISTORICAL_DATA_DAYS=30`
- `LOG_LEVEL=INFO`

---

## 🆘 Hızlı Sorun Giderme

### "Not Found"
→ Domain oluşturdunuz mu? Settings > Domains

### Database Hatası
→ PostgreSQL eklediniz mi? Project > "+ New" > Database

### Port Hatası
→ Railway otomatik `$PORT` verir, kod zaten hazır ✅

### CORS Hatası
→ CORS_ORIGINS'e Railway URL'nizi eklediniz mi?

---

**Detaylı kılavuz:** `RAILWAY_SETUP.md`

