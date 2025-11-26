# 🚂 Railway.app Kullanım Rehberi - Deploy Sonrası

## 🎉 Tebrikler! Deployment Başarılı!

Görselde görüldüğü gibi deployment'ınız başarılı. Şimdi uygulamanıza nasıl erişeceğinizi ve yöneteceğinizi öğrenelim.

---

## 🌐 Uygulamanıza Nasıl Erişirsiniz?

### 1. **URL'yi Bulma**

Railway dashboard'da:

1. **Project sayfasına git** (sol menüden projenizi seçin)
2. **Service'in üzerine tıklayın** (genelde "web" veya servis adınız)
3. **Settings** sekmesine gidin
4. **"Generate Domain"** butonuna tıklayın (eğer yoksa)
5. **Domain URL'yi kopyalayın**

**URL formatı:**
```
https://your-app-name.up.railway.app
```

veya custom domain:
```
https://yourdomain.com
```

### 2. **Hızlı Erişim**

Railway dashboard'da:
- **Deployment kartında** sağ üstte **"Open"** veya **"Visit"** butonu var
- Bu butona tıklayarak direkt uygulamanıza gidebilirsiniz

---

## 📊 Railway Dashboard'u Nasıl Kullanılır?

### Ana Dashboard Özellikleri:

#### 1. **Deployments Sekmesi**
- ✅ Tüm deployment geçmişi
- ✅ Her deployment'ın durumu (Active, Failed, vb.)
- ✅ Commit hash'leri
- ✅ Deploy zamanları

#### 2. **Metrics Sekmesi**
- 📈 CPU kullanımı
- 💾 Memory kullanımı
- 🌐 Network trafiği
- 📊 Request sayıları
- ⚡ Response time

#### 3. **Logs Sekmesi**
- 📝 Real-time logs
- 🔍 Log search
- 📥 Log download
- 🎨 Renkli log görüntüleme

#### 4. **Settings Sekmesi**
- ⚙️ Environment variables
- 🔐 Secrets management
- 🌍 Domain ayarları
- 🔄 Build & deploy ayarları
- 💰 Billing & usage

---

## 🔍 Uygulamanızı Test Etme

### 1. **Health Check**
Tarayıcıda veya terminal'de:
```bash
curl https://your-app-name.up.railway.app/health
```

**Beklenen cevap:**
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "timestamp": "2025-11-26T16:16:00"
}
```

### 2. **Ana Sayfa**
Tarayıcıda açın:
```
https://your-app-name.up.railway.app
```

Dashboard'unuz açılmalı!

### 3. **API Endpoints Test**
```bash
# Logs endpoint
curl https://your-app-name.up.railway.app/api/logs

# Analytics endpoint
curl https://your-app-name.up.railway.app/api/analytics
```

---

## 📝 Logs Nasıl Görüntülenir?

### Railway Dashboard'dan:
1. **Service'inize tıklayın**
2. **"Logs" sekmesine gidin**
3. **Real-time logs** görüntülenir
4. **Search box** ile log arayabilirsiniz

### Terminal'den (Railway CLI):
```bash
# Railway CLI kurulumu
npm i -g @railway/cli

# Login
railway login

# Logs izleme
railway logs
```

---

## ⚙️ Environment Variables Yönetimi

### Değişken Ekleme/Düzenleme:

1. **Service'inize tıklayın**
2. **"Variables" sekmesine gidin**
3. **"+ New Variable"** butonuna tıklayın
4. **Key** ve **Value** girin
5. **"Add"** butonuna tıklayın

### Önemli Variables:

```bash
# Database (Railway otomatik ekler)
DATABASE_URL=postgresql://...

# Security
SECRET_KEY=your-secret-key-here

# Application
DEBUG=false
HOST=0.0.0.0
PORT=8082

# CORS
CORS_ORIGINS=["https://your-app.up.railway.app","*"]

# Data Generation
GENERATE_REALISTIC_DATA=true
LOG_LEVEL=INFO
```

### Secret Variables:
- 🔒 **Sensitive data** için "Secret" olarak işaretleyin
- Secret variables değerleri gizlenir (görünmez)

---

## 🔄 Yeni Deploy Nasıl Yapılır?

### Otomatik Deploy (Önerilen):
1. **GitHub'a push yapın:**
```bash
git add .
git commit -m "Update dashboard"
git push origin main
```

2. **Railway otomatik deploy başlatır**
3. **Deployments sekmesinden** ilerlemeyi izleyin

### Manuel Deploy:
1. **Service'inize tıklayın**
2. **"Deployments" sekmesine gidin**
3. **"Redeploy"** butonuna tıklayın
4. **Hangi commit'i deploy etmek istediğinizi seçin**

---

## 🗄️ Database Yönetimi

### PostgreSQL'e Erişim:

1. **Project dashboard'da** PostgreSQL servisini bulun
2. **"Data" sekmesine** tıklayın
3. **"Query"** butonuna tıklayın
4. **SQL sorguları** çalıştırabilirsiniz

### Database Connection String:
- **Settings > Variables** içinde `DATABASE_URL` otomatik eklenir
- Bu URL'yi kopyalayıp local'de de kullanabilirsiniz

### Database Backup:
1. **PostgreSQL servisine tıklayın**
2. **"Data" sekmesine gidin**
3. **"Backup"** butonuna tıklayın
4. **SQL dump** indirin

---

## 📊 Metrics ve Monitoring

### CPU & Memory:
- **Metrics sekmesinde** gerçek zamanlı kullanım görünür
- **Alarm** ayarlayabilirsiniz (Pro plan)

### Network:
- **Request sayıları**
- **Bandwidth kullanımı**
- **Response time**

### Cost Tracking:
- **Settings > Usage** sekmesinde
- **Aylık kullanım** görüntülenir
- **$5 ücretsiz kredi** takibi

---

## 🔧 Sorun Giderme

### Uygulama Açılmıyor:

1. **Logs kontrol edin:**
   - Service > Logs sekmesi
   - Hata mesajlarını okuyun

2. **Health check yapın:**
```bash
curl https://your-app.up.railway.app/health
```

3. **Environment variables kontrol:**
   - Tüm gerekli variables var mı?
   - `DATABASE_URL` doğru mu?

4. **Build logs kontrol:**
   - Deployments > Build Logs
   - Build başarılı mı?

### Database Bağlanamıyor:

1. **DATABASE_URL kontrol:**
   - Settings > Variables
   - `DATABASE_URL` doğru mu?

2. **PostgreSQL servisi çalışıyor mu:**
   - Project dashboard'da PostgreSQL servisini kontrol edin
   - Status "Active" olmalı

3. **Connection pool:**
   - Railway PostgreSQL connection pooling kullanır
   - Max connections kontrol edin

### WebSocket Çalışmıyor:

1. **CORS ayarları:**
   - `CORS_ORIGINS` doğru domain'leri içeriyor mu?

2. **Socket.IO path:**
   - Railway reverse proxy kullanır
   - Path'ler doğru mu?

3. **Logs kontrol:**
   - WebSocket connection hataları var mı?

---

## 🌍 Custom Domain Ekleme

### 1. Domain Satın Alın:
- Namecheap, GoDaddy, vb.

### 2. Railway'de Domain Ekle:
1. **Service > Settings > Domains**
2. **"Custom Domain"** ekle
3. **Domain adını** girin

### 3. DNS Ayarları:
Railway size DNS kayıtlarını verir:
```
Type: CNAME
Name: @ (veya www)
Value: your-app.up.railway.app
```

### 4. SSL Otomatik:
- Railway otomatik SSL sertifikası verir
- Birkaç dakika sürebilir

---

## 📱 Railway Mobile App

### Station App:
- **iOS/Android** için Railway'in mobil uygulaması var
- **Projelerinizi** mobil cihazdan yönetin
- **Logs** görüntüleyin
- **Metrics** izleyin

**İndir:** App Store veya Google Play'de "Railway Station" ara

---

## 🔄 Rollback (Geri Alma)

### Önceki Versiyona Dönme:

1. **Deployments sekmesine gidin**
2. **Önceki başarılı deployment'ı bulun**
3. **"..." menüsüne tıklayın**
4. **"Redeploy"** seçin

---

## 💰 Cost Management

### Kullanım Takibi:
1. **Settings > Usage**
2. **Aylık kullanım** görüntülenir
3. **$5 ücretsiz kredi** takibi

### Cost Optimization:
- **Kullanılmayan servisleri silin**
- **Database size'ı kontrol edin**
- **Resource limits** ayarlayın

---

## 🎯 Hızlı Komutlar

### Railway CLI ile:

```bash
# Login
railway login

# Proje seç
railway link

# Logs izle
railway logs

# Variables görüntüle
railway variables

# Deploy
railway up

# Shell aç
railway shell
```

---

## ✅ Checklist - Deployment Sonrası

- [ ] Uygulama URL'si çalışıyor mu?
- [ ] Health check endpoint çalışıyor mu?
- [ ] Database bağlantısı başarılı mı?
- [ ] Environment variables doğru mu?
- [ ] Logs görüntüleniyor mu?
- [ ] WebSocket çalışıyor mu?
- [ ] Static files serve ediliyor mu?
- [ ] CORS ayarları doğru mu?
- [ ] Custom domain eklendi mi? (opsiyonel)
- [ ] Monitoring aktif mi?

---

## 🆘 Yardım ve Destek

### Railway Support:
- **Docs:** https://docs.railway.app
- **Discord:** Railway Discord community
- **GitHub:** Railway GitHub discussions

### Yaygın Sorunlar:
1. **"Application Error"** → Logs kontrol et
2. **"Database connection failed"** → DATABASE_URL kontrol
3. **"Build failed"** → Build logs kontrol
4. **"Port already in use"** → PORT variable kontrol

---

## 🎉 Başarılar!

Artık Railway'de uygulamanız çalışıyor! 

**Sonraki Adımlar:**
1. ✅ Uygulamanızı test edin
2. ✅ Custom domain ekleyin (opsiyonel)
3. ✅ Monitoring ayarlayın
4. ✅ Backup stratejisi oluşturun

**Sorularınız varsa Railway docs'a bakın veya Discord community'ye katılın!**

