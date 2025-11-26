# 🔍 Railway'de URL Nasıl Bulunur? (Adım Adım)

## ❌ "Not Found" Hatası Neden Oluyor?

Railway'de "Not Found" hatası genellikle şu sebeplerden olur:
1. **Port yanlış** - Railway `$PORT` kullanır, kod sabit port kullanıyor olabilir
2. **Domain henüz provision edilmemiş** - URL oluşturulmamış
3. **Service çalışmıyor** - Deployment başarısız olmuş olabilir

---

## ✅ ÇÖZÜM: Railway'de URL'yi Bulma

### Yöntem 1: Settings > Domains (EN KOLAY)

1. **Railway Dashboard'a gidin**
2. **Projenizi seçin** (sol menüden)
3. **Service'inize tıklayın** (genelde "web" veya servis adınız)
4. **"Settings" sekmesine gidin**
5. **"Domains" bölümünü bulun**
6. **"Generate Domain" butonuna tıklayın** (eğer domain yoksa)
7. **URL'niz görünecek!**

**URL formatı:**
```
https://your-service-name-production.up.railway.app
```

veya
```
https://your-project-name-production.up.railway.app
```

### Yöntem 2: Overview Sayfası

1. **Service'inize tıklayın**
2. **"Overview" sekmesinde** (varsayılan sayfa)
3. **Sağ üstte veya ortada** URL görünebilir
4. **"Open" veya "Visit" butonu** varsa ona tıklayın

### Yöntem 3: Deployments Sekmesi

1. **Service > Deployments** sekmesine gidin
2. **Aktif deployment'ı bulun** (yeşil "Active" etiketi)
3. **Deployment kartında** URL görünebilir
4. **Veya "..." menüsü > "View"** tıklayın

---

## 🔧 URL Yoksa Ne Yapmalı?

### 1. Domain Oluşturma

Eğer Settings > Domains'de domain yoksa:

1. **Settings > Domains** sekmesine gidin
2. **"Generate Domain"** butonuna tıklayın
3. **Railway otomatik domain oluşturur**
4. **Birkaç saniye bekleyin** (DNS propagation)
5. **URL hazır!**

### 2. Service Çalışıyor mu Kontrol

1. **Service > Logs** sekmesine gidin
2. **Logs'u kontrol edin:**
   - "Application startup complete" görünüyor mu?
   - Hata var mı?
3. **Service > Metrics** sekmesinde:
   - CPU/Memory kullanımı var mı?
   - Request'ler geliyor mu?

### 3. Port Kontrolü

Railway `$PORT` environment variable'ı kullanır. Kodunuzda:

**✅ DOĞRU:**
```python
PORT: int = int(os.getenv("PORT", "8082"))
```

**❌ YANLIŞ:**
```python
PORT: int = 8082  # Sabit port
```

---

## 🛠️ Port Sorunu Düzeltme

### config.py Güncelleme:

```python
# web_dashboard/advanced/backend/config.py
import os

class Settings(BaseSettings):
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = int(os.getenv("PORT", "8082"))  # Railway $PORT kullanır
```

### railway.toml Güncelleme:

```toml
[deploy]
startCommand = "cd ../../.. && python -m uvicorn web_dashboard.advanced.backend.main:socket_app --host 0.0.0.0 --port $PORT"
```

**Not:** `$PORT` yerine `${{PORT}}` de kullanılabilir (Railway syntax).

---

## 📋 Railway'de URL Bulma Checklist

- [ ] Railway dashboard'a gittim
- [ ] Projemi seçtim
- [ ] Service'ime tıkladım
- [ ] Settings > Domains'e baktım
- [ ] "Generate Domain" butonuna tıkladım (yoksa)
- [ ] URL'yi kopyaladım
- [ ] Tarayıcıda açtım
- [ ] Health check yaptım: `/health`

---

## 🧪 URL'yi Test Etme

### 1. Health Check:
```bash
curl https://your-app.up.railway.app/health
```

**Beklenen cevap:**
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "timestamp": "..."
}
```

### 2. Ana Sayfa:
```
https://your-app.up.railway.app
```

Dashboard açılmalı!

### 3. API Endpoint:
```
https://your-app.up.railway.app/api/logs
```

---

## 🆘 Hala Çalışmıyorsa

### 1. Logs Kontrol:
```bash
# Railway dashboard'da
Service > Logs
```

**Arayın:**
- "Application startup complete"
- "Server started on 0.0.0.0:XXXX"
- Port numarası doğru mu?

### 2. Environment Variables:
```bash
# Railway dashboard'da
Service > Settings > Variables
```

**Kontrol edin:**
- `PORT` variable var mı? (Railway otomatik ekler)
- `DATABASE_URL` doğru mu?
- `SECRET_KEY` var mı?

### 3. Build Logs:
```bash
# Railway dashboard'da
Service > Deployments > Build Logs
```

**Kontrol edin:**
- Build başarılı mı?
- Dependencies kuruldu mu?
- Hata var mı?

### 4. Service Status:
```bash
# Railway dashboard'da
Service > Overview
```

**Kontrol edin:**
- Status "Active" mi?
- Last deployment başarılı mı?

---

## 📸 Railway Dashboard'da Nerede?

### URL'yi Bulmak İçin:

```
Railway Dashboard
  └── Projects (Sol menü)
      └── Your Project
          └── Services
              └── Your Service (tıkla)
                  ├── Overview (URL burada olabilir)
                  ├── Deployments (URL burada olabilir)
                  ├── Logs
                  ├── Metrics
                  └── Settings
                      └── Domains ⭐ (URL BURADA!)
```

---

## 💡 İpuçları

### 1. URL Formatı:
Railway URL'leri genelde şu formatta:
```
https://[service-name]-[environment].up.railway.app
```

Örnek:
```
https://web-production.up.railway.app
https://dashboard-production.up.railway.app
```

### 2. Custom Domain:
Railway'de custom domain ekleyebilirsiniz:
1. Settings > Domains
2. "Custom Domain" ekle
3. DNS ayarlarını yap
4. SSL otomatik kurulur

### 3. Multiple Environments:
Railway'de farklı environment'lar için farklı URL'ler:
- Production: `https://app-production.up.railway.app`
- Staging: `https://app-staging.up.railway.app`

---

## ✅ Hızlı Çözüm Özeti

1. **Railway Dashboard > Proje > Service > Settings > Domains**
2. **"Generate Domain" tıkla** (yoksa)
3. **URL'yi kopyala**
4. **Tarayıcıda aç**
5. **Çalışmıyorsa:**
   - Logs kontrol et
   - Port kontrol et ($PORT kullanıyor mu?)
   - Environment variables kontrol et

---

## 🎯 Sonuç

Railway'de URL'yi bulmak için:
1. ✅ **Settings > Domains** en kolay yol
2. ✅ **"Generate Domain"** butonuna tıklayın
3. ✅ **Port'u $PORT kullanacak şekilde güncelleyin**
4. ✅ **Logs'u kontrol edin**

**Sorun devam ederse:**
- Railway support'a yazın
- Discord community'ye sorun
- Logs'u paylaşın

---

**Başarılar! 🚂**

