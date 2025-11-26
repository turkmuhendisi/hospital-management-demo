# 🚂 Railway.app Setup Kılavuzu - Advanced Dashboard

## ✅ Railway'e Deploy Etme Adımları

### 1. Railway'e Giriş ve Proje Oluşturma

1. **https://railway.app** adresine gidin
2. **GitHub hesabınızla giriş yapın**
3. **"New Project"** butonuna tıklayın
4. **"Deploy from GitHub repo"** seçin
5. **Repository'nizi seçin:** `teleradyoloji-sim` (veya repo adınız)

### 2. Root Directory Ayarlama

Railway'e projenin nerede olduğunu söyleyin:

1. **Service'inize tıklayın**
2. **Settings** sekmesine gidin
3. **"Root Directory"** bölümünü bulun
4. **Şunu yazın:**
   ```
   teleradyoloji/web_dashboard/advanced
   ```

### 3. PostgreSQL Database Ekleme

1. **Project dashboard'da** **"+ New"** butonuna tıklayın
2. **"Database"** > **"Add PostgreSQL"** seçin
3. Railway otomatik olarak:
   - PostgreSQL database oluşturur
   - `DATABASE_URL` environment variable'ı ekler

### 4. Environment Variables Ayarlama

**Service > Settings > Variables** sekmesinde şunları ekleyin:

#### Zorunlu Variables:

```bash
# SECRET_KEY (mutlaka değiştirin!)
SECRET_KEY=your-very-secret-key-min-32-characters-here

# DEBUG (production için false)
DEBUG=false

# CORS (Railway URL'nizi ekleyin)
CORS_ORIGINS=["https://your-app.up.railway.app","*"]

# Data Generation
GENERATE_REALISTIC_DATA=true
DATA_GENERATION_INTERVAL=5
HISTORICAL_DATA_DAYS=30

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json
```

#### Otomatik Eklenen Variables (Railway tarafından):

- `DATABASE_URL` - PostgreSQL database URL (PostgreSQL eklediğinizde otomatik)
- `PORT` - Railway'in verdiği port (otomatik)

#### SECRET_KEY Oluşturma:

Terminal'de:
```bash
openssl rand -hex 32
```

Çıkan string'i `SECRET_KEY` olarak kullanın.

### 5. Domain Oluşturma

1. **Service > Settings > Domains** sekmesine gidin
2. **"Generate Domain"** butonuna tıklayın
3. Railway otomatik domain oluşturur:
   ```
   https://your-service-production.up.railway.app
   ```
4. **URL'yi kopyalayın**

### 6. CORS URL'sini Güncelleme

Domain oluşturduktan sonra:

1. **Settings > Variables** sekmesine gidin
2. **CORS_ORIGINS** variable'ını bulun
3. **Değeri güncelleyin:**
   ```json
   ["https://your-service-production.up.railway.app","*"]
   ```
4. **Save** butonuna tıklayın
5. Railway otomatik redeploy yapar

### 7. Deploy Kontrolü

1. **Service > Deployments** sekmesine gidin
2. **Son deployment'ın durumunu kontrol edin:**
   - ✅ "Active" olmalı
   - ✅ Build başarılı olmalı
   - ✅ Deploy başarılı olmalı

3. **Service > Logs** sekmesinde:
   - "Application startup complete" görünmeli
   - "Database initialized" görünmeli
   - "Initial data seeded" görünmeli
   - Port numarası doğru olmalı (Railway'in verdiği port)

### 8. Test Etme

#### Health Check:
```bash
curl https://your-service-production.up.railway.app/health
```

**Beklenen cevap:**
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "timestamp": "..."
}
```

#### Ana Sayfa:
Tarayıcıda açın:
```
https://your-service-production.up.railway.app
```

Dashboard açılmalı!

---

## 📋 Railway Configuration Dosyaları

### railway.toml
Bu dosya Railway'e projenin nasıl build ve deploy edileceğini söyler:
- **Root Directory:** `teleradyoloji/web_dashboard/advanced`
- **Build Command:** `pip install -r ../../../requirements.txt`
- **Start Command:** `python -m uvicorn web_dashboard.advanced.backend.main:socket_app --host 0.0.0.0 --port $PORT`

### .railwayignore
Bu dosya Railway'e hangi dosyaların deploy edilmeyeceğini söyler (gitignore gibi).

---

## 🔧 Önemli Ayarlar

### Port Configuration
Railway `$PORT` environment variable'ı kullanır. Kod otomatik olarak bunu okur:
```python
PORT: int = int(os.getenv("PORT", "8082"))
```

### Database Configuration
Railway PostgreSQL eklediğinizde `DATABASE_URL` otomatik eklenir. Kod bunu otomatik okur:
```python
DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./data/audit_production.db")
```

### CORS Configuration
Railway URL'nizi CORS'a eklemelisiniz:
```json
["https://your-app.up.railway.app","*"]
```

---

## 🆘 Sorun Giderme

### "Not Found" Hatası

1. **Domain oluşturdunuz mu?**
   - Settings > Domains > Generate Domain

2. **Port doğru mu?**
   - Logs'da port numarasını kontrol edin
   - Railway'in verdiği port ile eşleşiyor mu?

3. **Service çalışıyor mu?**
   - Logs'da "Application startup complete" görünüyor mu?

### Database Bağlanamıyor

1. **PostgreSQL servisi ekli mi?**
   - Project dashboard'da PostgreSQL servisi görünüyor mu?

2. **DATABASE_URL doğru mu?**
   - Settings > Variables > DATABASE_URL kontrol edin
   - Railway otomatik ekler, manuel değiştirmeyin

3. **Database migration çalıştı mı?**
   - Logs'da "Database initialized" görünüyor mu?

### Build Başarısız

1. **Requirements.txt doğru yerde mi?**
   - Root: `teleradyoloji/requirements.txt`
   - Build command: `pip install -r ../../../requirements.txt`

2. **Python version doğru mu?**
   - Railway otomatik algılar (Python 3.9+)

3. **Dependencies eksik mi?**
   - Build logs'u kontrol edin
   - Hangi package kurulamadı?

### CORS Hatası

1. **CORS_ORIGINS doğru mu?**
   - Railway URL'nizi eklediniz mi?
   - JSON format doğru mu?

2. **Frontend URL doğru mu?**
   - Frontend'iniz Railway'de mi yoksa başka yerde mi?

---

## 📊 Monitoring

### Logs
- **Service > Logs** - Real-time logs
- **Service > Deployments > Build Logs** - Build logs

### Metrics
- **Service > Metrics** - CPU, Memory, Network kullanımı

### Health Check
- **Service > Settings > Healthcheck** - `/health` endpoint'i otomatik kontrol edilir

---

## 🔄 Yeni Deploy

### Otomatik Deploy (Önerilen)
1. **GitHub'a push yapın:**
   ```bash
   git add .
   git commit -m "Update dashboard"
   git push origin main
   ```
2. **Railway otomatik deploy başlatır**
3. **Deployments sekmesinden** ilerlemeyi izleyin

### Manuel Deploy
1. **Service > Deployments** sekmesine gidin
2. **"Redeploy"** butonuna tıklayın
3. **Hangi commit'i deploy etmek istediğinizi seçin**

---

## 💰 Maliyet

- **İlk $5/ay ücretsiz**
- **Sonrasında kullandığın kadar öde**
- **Küçük projeler için genelde $5-10/ay yeterli**

### Cost Optimization:
- Kullanılmayan servisleri silin
- Database size'ı kontrol edin
- Resource limits ayarlayın

---

## ✅ Checklist

Deployment öncesi:
- [ ] Railway hesabı oluşturuldu
- [ ] GitHub repo bağlandı
- [ ] Root directory ayarlandı: `teleradyoloji/web_dashboard/advanced`
- [ ] PostgreSQL database eklendi
- [ ] SECRET_KEY oluşturuldu ve eklendi
- [ ] DEBUG=false ayarlandı
- [ ] Domain oluşturuldu
- [ ] CORS_ORIGINS güncellendi (Railway URL eklendi)
- [ ] Deploy başarılı
- [ ] Health check çalışıyor
- [ ] Dashboard açılıyor

---

## 🎯 Sonuç

Railway'e deploy etmek için:
1. ✅ **GitHub repo bağla**
2. ✅ **Root directory ayarla**
3. ✅ **PostgreSQL ekle**
4. ✅ **Environment variables ayarla**
5. ✅ **Domain oluştur**
6. ✅ **CORS güncelle**
7. ✅ **Test et**

**Başarılar! 🚂**

