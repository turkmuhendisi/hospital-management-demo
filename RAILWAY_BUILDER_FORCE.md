# 🚨 Railway Hala Dockerfile Kullanıyor - Zorla Nixpacks

## ❌ Sorun

Railway hala Dockerfile kullanmaya çalışıyor:
```
ERROR: failed to build: failed to solve: process "/bin/bash -ol pipefail -c pip install -r ../../../requirements.txt" did not complete successfully: exit code: 127
```

## ✅ ÇÖZÜM: Railway Dashboard'da Builder'ı Manuel Seçin

Railway bazen `railway.toml`'daki builder ayarını görmezden geliyor. **Manuel olarak ayarlamanız gerekiyor:**

### Adım 1: Railway Dashboard'a Gidin

1. **Railway.app** → Projenize gidin
2. **Service'inize tıklayın**
3. **Settings** sekmesine gidin

### Adım 2: Builder'ı Değiştirin

1. **"Build"** bölümünü bulun
2. **"Builder"** seçeneğini bulun
3. **Şu anda "Dockerfile" seçili olabilir**
4. **"Nixpacks" seçin** (dropdown'dan)
5. **"Save"** butonuna tıklayın

### Adım 3: Build Cache Temizle

1. **Settings** sayfasında
2. **"Clear build cache"** veya **"Clear cache"** butonunu bulun
3. **Tıklayın** (eğer varsa)

### Adım 4: Redeploy

1. **Deployments** sekmesine gidin
2. **"Redeploy"** butonuna tıklayın
3. **Veya yeni bir commit push edin**

---

## 🔍 Kontrol

Build logs'da şunları görmelisiniz:

```
✓ Using nixpacks builder
✓ Detected Python project
✓ Build command: pip install -r ../../../requirements.txt
✓ Installing dependencies...
```

**"Dockerfile" veya "docker build" görünmemeli!**

---

## 🆘 Hala Çalışmıyorsa

### Seçenek 1: Railway CLI ile Builder Ayarla

```bash
# Railway CLI kur
npm i -g @railway/cli

# Login
railway login

# Projeyi link et
railway link

# Builder'ı nixpacks olarak ayarla
railway variables set RAILWAY_BUILDER=nixpacks
```

### Seçenek 2: Service'i Yeniden Oluştur

1. **Yeni bir service oluşturun**
2. **Aynı GitHub repo'yu bağlayın**
3. **Root directory:** `teleradyoloji/web_dashboard/advanced`
4. **Builder:** "Nixpacks" seçin
5. **Environment variables'ı kopyalayın**

### Seçenek 3: railway.toml'u Root'a Taşı

Eğer Railway root directory'yi yanlış algılıyorsa:

1. **Root directory'yi değiştirin:**
   - Root: `teleradyoloji` (advanced değil)
2. **railway.toml'u root'a kopyalayın:**
   ```bash
   cp web_dashboard/advanced/railway.toml railway.toml
   ```
3. **railway.toml'u güncelleyin:**
   ```toml
   [build]
   builder = "nixpacks"
   buildCommand = "cd web_dashboard/advanced && pip install -r ../../requirements.txt"
   
   [deploy]
   startCommand = "cd web_dashboard/advanced && cd ../.. && python -m uvicorn web_dashboard.advanced.backend.main:socket_app --host 0.0.0.0 --port $PORT"
   ```

---

## 📋 Railway Settings Kontrol Listesi

Settings sayfasında şunlar olmalı:

- ✅ **Builder:** Nixpacks (Dockerfile değil!)
- ✅ **Build Command:** `pip install -r ../../../requirements.txt`
- ✅ **Start Command:** `cd ../../.. && python -m uvicorn web_dashboard.advanced.backend.main:socket_app --host 0.0.0.0 --port $PORT`
- ✅ **Root Directory:** `teleradyoloji/web_dashboard/advanced`

---

## 🎯 En Hızlı Çözüm

**Railway Dashboard'da:**
1. Settings > Build
2. Builder: **"Nixpacks"** seçin
3. Save
4. Redeploy

**Bu kesin çalışır!**

---

## ✅ Başarı Kontrolü

Deploy sonrası build logs'da:

```
✓ Using nixpacks builder
✓ Python detected
✓ Installing dependencies from requirements.txt
✓ Build successful
✓ Starting application...
```

**Artık Dockerfile hatası görünmemeli!**

