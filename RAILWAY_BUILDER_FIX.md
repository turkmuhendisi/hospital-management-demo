# 🚨 Railway Dockerfile Hatası - Hızlı Çözüm

## ❌ Hata Mesajı

```
ERROR: failed to build: failed to solve: failed to compute cache key: 
failed to calculate checksum of ref: "/requirements.txt": not found
```

## 🔍 Sorun

Railway Dockerfile'ı kullanmaya çalışıyor ama path yanlış. Railway'de **nixpacks builder** kullanmalıyız.

## ✅ ÇÖZÜM (2 Yöntem)

### Yöntem 1: Railway Dashboard'da Builder Seçimi (EN HIZLI)

1. **Railway Dashboard'a gidin**
2. **Service'inize tıklayın**
3. **Settings** sekmesine gidin
4. **"Build"** veya **"Deploy"** bölümünü bulun
5. **"Builder"** seçeneğini bulun
6. **"Nixpacks"** seçin (Dockerfile değil!)
7. **Save** butonuna tıklayın
8. **Redeploy** yapın

### Yöntem 2: Dockerfile'ı Geçici Olarak Yeniden Adlandırın

Eğer Railway hala Dockerfile'ı görüyorsa:

```bash
# Terminal'de:
cd /Users/turkmuhendisi/Documents/teleradyoloji-sim/teleradyoloji/web_dashboard/advanced
mv Dockerfile Dockerfile.backup
git add .
git commit -m "Temporarily disable Dockerfile for Railway"
git push
```

Railway artık Dockerfile'ı görmeyecek ve `railway.toml`'daki nixpacks builder'ı kullanacak.

---

## 📋 Railway Build Ayarları

Railway'de şu ayarlar olmalı:

- **Builder:** Nixpacks (Dockerfile değil!)
- **Build Command:** `pip install -r ../../../requirements.txt`
- **Start Command:** `cd ../../.. && python -m uvicorn web_dashboard.advanced.backend.main:socket_app --host 0.0.0.0 --port $PORT`
- **Root Directory:** `teleradyoloji/web_dashboard/advanced`

---

## 🔄 Yeniden Deploy

1. **Builder'ı "Nixpacks" olarak ayarlayın** (Yöntem 1)
2. **Veya Dockerfile'ı yeniden adlandırın** (Yöntem 2)
3. **Git push yapın**
4. **Railway otomatik redeploy yapacak**

---

## ✅ Kontrol

Build logs'da şunları görmelisiniz:

```
✓ Using nixpacks builder
✓ Build command: pip install -r ../../../requirements.txt
✓ Installing dependencies...
✓ Start command: cd ../../.. && python -m uvicorn ...
```

**"Dockerfile" veya "docker build" görünmemeli!**

---

## 🆘 Hala Çalışmıyorsa

1. **Railway dashboard'da** Service > Settings > Build
2. **"Clear build cache"** butonuna tıklayın
3. **Redeploy** yapın

---

**En hızlı çözüm: Railway dashboard'da builder'ı "Nixpacks" olarak seçin!**

