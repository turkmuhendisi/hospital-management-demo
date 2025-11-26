# 🚂 Railway.app Nedir? Detaylı Rehber

## 📖 Railway.app Nedir?

**Railway.app**, uygulamalarınızı (web app, API, database) buluta deploy etmeyi kolaylaştıran bir **Platform-as-a-Service (PaaS)** platformudur.

### Basit Açıklama:
- **Heroku'nun modern alternatifi**
- **GitHub'dan otomatik deploy**
- **PostgreSQL, Redis gibi servisleri tek tıkla ekle**
- **Otomatik HTTPS/SSL**
- **Kullanım başına ödeme** (ilk $5 ücretsiz)

---

## 🎯 Railway.app Ne İşe Yarar?

### ✅ Yapabilecekleriniz:
1. **Web uygulaması deploy et** (Python, Node.js, Go, vb.)
2. **Database ekle** (PostgreSQL, MySQL, Redis, MongoDB)
3. **API deploy et** (REST API, GraphQL)
4. **Background job çalıştır** (Worker, Cron job)
5. **Microservices deploy et** (Birden fazla servis)

### 🎯 Sizin Projeniz İçin:
- ✅ FastAPI backend'inizi deploy eder
- ✅ PostgreSQL database otomatik ekler
- ✅ HTTPS/SSL otomatik verir
- ✅ GitHub'dan otomatik deploy yapar
- ✅ Environment variables kolayca yönetir

---

## 💰 Fiyatlandırma (2024)

### Hobby Plan (Başlangıç):
- **$5 ücretsiz kredi/ay**
- **Kullanım başına ödeme**
- **Küçük projeler için yeterli**

### Pro Plan:
- **$20/ay**
- **Daha fazla kaynak**
- **Priority support**

### Enterprise:
- **Özel fiyatlandırma**
- **SLA garantisi**

**Not:** İlk $5 her ay ücretsiz, sonrasında kullandığın kadar ödersin.

---

## 🆚 Railway vs Diğer Platformlar

| Özellik | Railway | Heroku | Render | VPS |
|---------|---------|--------|--------|-----|
| **Kurulum** | ⭐️⭐️⭐️⭐️⭐️ Çok kolay | ⭐️⭐️⭐️⭐️ Kolay | ⭐️⭐️⭐️ Orta | ⭐️⭐️ Zor |
| **Fiyat** | $0-5/ay başlangıç | $7/ay minimum | $0-7/ay | $6/ay |
| **GitHub Integration** | ✅ Otomatik | ✅ Var | ✅ Var | ❌ Manuel |
| **Database** | ✅ Tek tıkla | ✅ Var | ✅ Var | ❌ Manuel kurulum |
| **HTTPS/SSL** | ✅ Otomatik | ✅ Otomatik | ✅ Otomatik | ❌ Manuel (Certbot) |
| **Cold Start** | ❌ Yok | ❌ Yok | ⚠️ Free tier'da var | ❌ Yok |
| **Ölçeklenebilirlik** | ✅ İyi | ✅ İyi | ⚠️ Orta | ✅ Tam kontrol |

---

## 🚀 Railway.app Nasıl Kullanılır? (Adım Adım)

### Adım 1: Hesap Oluştur
1. https://railway.app adresine git
2. "Start a New Project" tıkla
3. GitHub hesabınla giriş yap
4. Railway, GitHub repo'larına erişim isteyecek → İzin ver

### Adım 2: Proje Oluştur
1. Dashboard'da "New Project" tıkla
2. "Deploy from GitHub repo" seç
3. Repo'nu seç: `teleradyoloji-sim`
4. Railway otomatik olarak projeyi analiz eder

### Adım 3: Root Directory Ayarla
Railway'e projenin nerede olduğunu söyle:
- **Root Directory:** `teleradyoloji/web_dashboard/advanced`

### Adım 4: PostgreSQL Database Ekle
1. Project dashboard'da "+ New" tıkla
2. "Database" > "Add PostgreSQL" seç
3. Railway otomatik database oluşturur
4. `DATABASE_URL` environment variable otomatik eklenir

### Adım 5: Environment Variables Ayarla
Project > Variables sekmesinde:

```bash
# Railway otomatik ekler:
DATABASE_URL=postgresql://... (PostgreSQL eklediğinde otomatik)

# Sen ekle:
SECRET_KEY=rastgele-32-karakter-string-buraya
DEBUG=false
HOST=0.0.0.0
PORT=8082
CORS_ORIGINS=["https://your-app.railway.app","*"]
GENERATE_REALISTIC_DATA=true
LOG_LEVEL=INFO
```

**SECRET_KEY oluştur:**
```bash
# Terminal'de:
openssl rand -hex 32
# Çıkan string'i SECRET_KEY olarak kullan
```

### Adım 6: Start Command Ayarla
Railway otomatik algılar ama kontrol et:
- **Start Command:**
```bash
cd teleradyoloji && python -m uvicorn web_dashboard.advanced.backend.main:socket_app --host 0.0.0.0 --port $PORT
```

**Not:** Railway `$PORT` environment variable'ı otomatik verir.

### Adım 7: Deploy!
1. Railway otomatik olarak deploy başlatır
2. Build logs'u izle
3. Deploy tamamlandığında URL verir: `https://your-app.railway.app`

### Adım 8: Custom Domain (Opsiyonel)
1. Settings > Domains
2. Custom domain ekle
3. DNS ayarlarını yap (Railway talimat verir)
4. SSL otomatik kurulur

---

## 📋 Railway.app için Proje Hazırlığı

### 1. `railway.toml` Dosyası (Zaten var!)
```toml
[build]
builder = "nixpacks"
buildCommand = "pip install -r ../../../requirements.txt"

[deploy]
startCommand = "cd ../../.. && python -m uvicorn web_dashboard.advanced.backend.main:socket_app --host 0.0.0.0 --port $PORT"
```

### 2. `requirements.txt` Kontrol Et
Railway Python dependencies'i `requirements.txt`'den okur. Dosyanın doğru yerde olduğundan emin ol.

### 3. Port Configuration
Railway `$PORT` environment variable'ı verir. Kodunuzda:
```python
# config.py içinde
PORT: int = int(os.getenv("PORT", "8082"))
```

---

## 🔧 Railway.app Özellikleri

### ✅ Otomatik Deploy
- GitHub'a push yaptığın anda otomatik deploy
- Her commit için yeni deploy (opsiyonel)

### ✅ Environment Variables
- Kolayca ekle/düzenle
- Secret variables (gizli tutar)
- Her servis için ayrı variables

### ✅ Logs
- Real-time logs görüntüleme
- Log search
- Log download

### ✅ Metrics
- CPU kullanımı
- Memory kullanımı
- Network trafiği
- Request sayısı

### ✅ Database Management
- PostgreSQL admin panel
- Database backup
- Database restore
- Connection pooling

### ✅ Custom Domains
- Ücretsiz `.railway.app` domain
- Custom domain ekleme
- Otomatik SSL/HTTPS

---

## 🎯 Sizin Projeniz İçin Railway Setup

### Proje Yapısı:
```
teleradyoloji-sim/
  └── teleradyoloji/
      └── web_dashboard/
          └── advanced/
              ├── backend/
              │   └── main.py
              ├── index.html
              ├── railway.toml  ✅ (Hazır!)
              └── ...
```

### Railway Ayarları:

**Root Directory:** `teleradyoloji/web_dashboard/advanced`

**Build Command:** (Otomatik algılanır)
```bash
pip install -r ../../../requirements.txt
```

**Start Command:**
```bash
cd ../../.. && python -m uvicorn web_dashboard.advanced.backend.main:socket_app --host 0.0.0.0 --port $PORT
```

**Environment Variables:**
```bash
DATABASE_URL=postgresql://... (Railway otomatik ekler)
SECRET_KEY=your-secret-key-here
DEBUG=false
CORS_ORIGINS=["https://your-app.railway.app","*"]
GENERATE_REALISTIC_DATA=true
LOG_LEVEL=INFO
```

---

## ⚠️ Dikkat Edilmesi Gerekenler

### 1. Port Configuration
Railway `$PORT` kullanır, kodunuzda bunu handle etmelisiniz:
```python
import os
PORT = int(os.getenv("PORT", "8082"))
```

### 2. Database Migrations
İlk deploy'da database boş olacak. Migration script'i ekle veya `init_db()` fonksiyonunuz çalışıyor mu kontrol et.

### 3. Static Files
Frontend dosyalarınız (`index.html`, `styles.css`, vb.) doğru yerde mi kontrol et.

### 4. CORS Ayarları
Production'da CORS'u sadece gerçek domain'lerle sınırla:
```python
CORS_ORIGINS=["https://your-app.railway.app"]
```

### 5. Secret Key
**ASLA** `SECRET_KEY`'i kod içine yazma! Environment variable olarak ekle.

---

## 🆘 Sorun Giderme

### Deploy Başarısız Oluyor:
1. **Logs kontrol et:** Railway dashboard > Deployments > Logs
2. **Build command doğru mu?** `requirements.txt` bulunuyor mu?
3. **Python version:** Railway otomatik algılar, ama `.python-version` dosyası ekleyebilirsin

### Database Bağlanamıyor:
1. **DATABASE_URL doğru mu?** Railway otomatik ekler
2. **Database servisi çalışıyor mu?** Dashboard'da kontrol et
3. **Connection pooling:** Railway PostgreSQL connection pooling kullanır

### WebSocket Çalışmıyor:
1. **CORS ayarları:** `CORS_ORIGINS` doğru mu?
2. **Socket.IO path:** Railway reverse proxy kullanır, path'ler doğru mu?

### Uygulama Yavaş:
1. **Resource limits:** Hobby plan'da sınırlı kaynak var
2. **Database queries:** Slow query'ler var mı kontrol et
3. **Cold start:** Railway'de cold start yok ama ilk request yavaş olabilir

---

## 📊 Railway.app Avantajları

### ✅ Artıları:
- **Çok kolay kurulum** (5 dakika)
- **GitHub integration** (otomatik deploy)
- **Otomatik HTTPS/SSL**
- **Database tek tıkla ekleme**
- **İyi dokümantasyon**
- **Modern platform**
- **Kullanım başına ödeme** (ilk $5 ücretsiz)

### ⚠️ Eksileri:
- **Yeni platform** (Heroku kadar mature değil)
- **Bazı kullanıcılar support'tan şikayetçi**
- **Hobby plan'da kaynak sınırlı**
- **Vendor lock-in** (Railway'e bağımlısın)

---

## 🎓 Öğrenme Kaynakları

- **Resmi Dokümantasyon:** https://docs.railway.app
- **GitHub:** https://github.com/railwayapp
- **Discord:** Railway'in Discord community'si var
- **YouTube:** Railway tutorial videoları

---

## 🚀 Hızlı Başlangıç (5 Dakika)

1. **Railway.app'e git:** https://railway.app
2. **GitHub ile giriş yap**
3. **"New Project" > "Deploy from GitHub"**
4. **Repo'nu seç**
5. **Root Directory:** `teleradyoloji/web_dashboard/advanced`
6. **PostgreSQL ekle** (Database > Add PostgreSQL)
7. **Environment Variables ekle:**
   - `SECRET_KEY` (openssl rand -hex 32)
   - `DEBUG=false`
8. **Deploy!**
9. **URL'yi al:** `https://your-app.railway.app`

---

## 💡 İpuçları

### 1. İlk Deploy Sonrası:
- Health check endpoint'i test et: `https://your-app.railway.app/health`
- Database bağlantısını kontrol et
- Logs'u izle

### 2. Production'a Geçerken:
- `DEBUG=false` yap
- `SECRET_KEY` güçlü bir key kullan
- CORS'u sadece gerçek domain'lerle sınırla
- Database backup stratejisi oluştur

### 3. Monitoring:
- Railway dashboard'dan metrics izle
- Logs'u düzenli kontrol et
- Database connection pool'u izle

### 4. Cost Optimization:
- İlk $5 ücretsiz, sonrasında kullandığın kadar öde
- Kullanılmayan servisleri sil
- Database size'ı kontrol et

---

## ✅ Sonuç

**Railway.app**, özellikle **yeni başlayanlar** ve **hızlı deployment** isteyenler için mükemmel bir seçenek. 

**Sizin projeniz için:**
- ✅ FastAPI backend deploy eder
- ✅ PostgreSQL database otomatik ekler
- ✅ HTTPS/SSL otomatik verir
- ✅ GitHub'dan otomatik deploy yapar
- ✅ 5 dakikada canlıya alırsınız

**Alternatifler:**
- **Render.com** - Benzer, free tier var
- **Heroku** - Daha mature ama pahalı
- **Fly.io** - Edge computing
- **DigitalOcean App Platform** - Benzer özellikler

---

**Başarılar! 🚂**

Railway.app ile projenizi 5 dakikada canlıya alabilirsiniz!

