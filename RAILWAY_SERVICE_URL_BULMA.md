# 🎯 Railway'de Service URL'si Nasıl Bulunur?

## 📍 Şu Anda Neredesiniz?

Görselde **Project Settings** sayfasındasınız. URL'yi bulmak için **Service Settings** sayfasına gitmeniz gerekiyor.

---

## ✅ URL'yi Bulmak İçin Adımlar

### Adım 1: Project'ten Service'e Geçiş

1. **Sol üstteki breadcrumb'a tıklayın:**
   ```
   pleasant-radiance / production
   ```
   veya
   ```
   < Project Name
   ```

2. **Veya sol menüden:**
   - "Services" veya "Deployments" sekmesine tıklayın
   - Service'inizi bulun (genelde "web" veya servis adınız)

### Adım 2: Service Sayfasına Git

1. **Service kartına tıklayın** (genelde "web" veya başka bir isim)
2. **Service'in detay sayfası açılacak**

### Adım 3: Settings > Domains

1. **Service sayfasında** üst menüden **"Settings"** sekmesine tıklayın
2. **"Domains"** bölümünü bulun
3. **Eğer domain yoksa:**
   - **"Generate Domain"** butonuna tıklayın
   - Railway otomatik domain oluşturur
4. **URL'niz görünecek!**

**URL formatı:**
```
https://your-service-name-production.up.railway.app
```

---

## 🗺️ Railway Navigation Yapısı

```
Railway Dashboard
  │
  ├── Projects (Ana sayfa)
  │   └── Your Project: "pleasant-radiance"
  │       │
  │       ├── Services ⭐ (BURAYA GİDİN!)
  │       │   └── Your Service (tıkla)
  │       │       ├── Overview
  │       │       ├── Deployments
  │       │       ├── Logs
  │       │       ├── Metrics
  │       │       └── Settings ⭐ (URL BURADA!)
  │       │           └── Domains ⭐ (URL BURADA!)
  │       │
  │       ├── Settings (Project Settings - ŞU ANDA BURADASINIZ)
  │       ├── Members
  │       └── ...
  │
  └── ...
```

---

## 🎯 Hızlı Yol

### Yöntem 1: Breadcrumb Kullan

1. **Sol üstte** proje adına tıklayın
2. **Service listesini** görün
3. **Service'inize tıklayın**
4. **Settings > Domains**

### Yöntem 2: Sol Menü

1. **Sol menüden** "Services" veya "Deployments" sekmesine tıklayın
2. **Service kartına tıklayın**
3. **Settings > Domains**

### Yöntem 3: Overview Sayfası

1. **Project ana sayfasına** dönün
2. **Service'in Overview** sayfasında URL görünebilir
3. **Veya "Open" butonu** varsa ona tıklayın

---

## 🔍 Service'i Nasıl Tanırsınız?

Service genelde şu isimlerden biri olur:
- `web`
- `api`
- `backend`
- `dashboard`
- `app`
- Proje adınızla aynı: `pleasant-radiance`

**Service kartında:**
- ✅ Status: "Active" veya "Deployed"
- ✅ Son deployment zamanı
- ✅ CPU/Memory kullanımı

---

## 📝 Domain Oluşturma

Eğer Settings > Domains'de domain yoksa:

1. **"Generate Domain"** butonuna tıklayın
2. **Railway otomatik oluşturur:**
   ```
   https://your-service-production.up.railway.app
   ```
3. **Birkaç saniye bekleyin** (DNS propagation)
4. **URL hazır!**

---

## 🧪 URL'yi Test Etme

Domain oluşturduktan sonra:

### 1. Health Check:
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

### 2. Ana Sayfa:
Tarayıcıda açın:
```
https://your-service-production.up.railway.app
```

Dashboard açılmalı!

---

## ⚠️ Önemli Notlar

### Project Settings vs Service Settings

- **Project Settings** (şu anda buradasınız):
  - Proje genel ayarları
  - Members, Tokens, Webhooks
  - **URL BURADA YOK!**

- **Service Settings** (gitmeniz gereken yer):
  - Service özel ayarları
  - Domains, Variables, Build
  - **URL BURADA!**

### Service Bulamıyorsanız

1. **Project ana sayfasına** dönün
2. **"New" veya "+" butonuna** tıklayın
3. **"Empty Service"** oluşturun
4. **GitHub repo'yu bağlayın**
5. **Root directory:** `teleradyoloji/web_dashboard/advanced`
6. **Deploy edin**

---

## 🆘 Hala Bulamıyorsanız

### 1. Service Var mı Kontrol:

**Project ana sayfasında:**
- Service kartları görünüyor mu?
- Yoksa yeni service oluşturmanız gerekir

### 2. Deployment Başarılı mı:

**Deployments sekmesinde:**
- Son deployment "Active" mi?
- Hata var mı?

### 3. Logs Kontrol:

**Service > Logs:**
- "Application startup complete" görünüyor mu?
- Port doğru mu?

---

## ✅ Checklist

- [ ] Project Settings'den çıktım
- [ ] Service sayfasına gittim
- [ ] Settings > Domains'e baktım
- [ ] "Generate Domain" butonuna tıkladım (yoksa)
- [ ] URL'yi kopyaladım
- [ ] Tarayıcıda test ettim
- [ ] Health check yaptım

---

## 🎯 Sonuç

**URL'yi bulmak için:**
1. ✅ **Project Settings'den çıkın**
2. ✅ **Service'inize gidin**
3. ✅ **Settings > Domains**
4. ✅ **"Generate Domain" tıklayın**
5. ✅ **URL hazır!**

**Şu anda Project Settings'desiniz, Service Settings'e gitmeniz gerekiyor!**

---

**Başarılar! 🚂**

