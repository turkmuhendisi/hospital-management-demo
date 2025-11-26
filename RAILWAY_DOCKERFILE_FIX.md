# 🔧 Railway Dockerfile Hatası Çözümü

## ❌ Hata

```
ERROR: failed to build: failed to solve: failed to compute cache key: 
failed to calculate checksum of ref: "/requirements.txt": not found
```

## 🔍 Sorun

Railway Dockerfile'ı kullanmaya çalışıyor ama:
- Railway root directory: `teleradyoloji/web_dashboard/advanced`
- Dockerfile path: `COPY ../../../requirements.txt .` (yanlış path)
- Railway build context farklı

## ✅ Çözüm

Railway'de **Dockerfile kullanmayın**, `railway.toml`'daki **nixpacks builder** kullanın.

### Seçenek 1: Dockerfile'ı Ignore Et (ÖNERİLEN)

`.railwayignore` dosyasına Dockerfile zaten eklendi. Railway artık Dockerfile'ı görmezden gelecek ve `railway.toml`'daki buildCommand'ı kullanacak.

### Seçenek 2: Railway'de Builder Seçimi

Railway dashboard'da:
1. **Service > Settings** sekmesine gidin
2. **"Build"** bölümünü bulun
3. **Builder:** "Nixpacks" seçin (Dockerfile değil)
4. **Build Command:** `pip install -r ../../../requirements.txt`
5. **Start Command:** `cd ../../.. && python -m uvicorn web_dashboard.advanced.backend.main:socket_app --host 0.0.0.0 --port $PORT`

### Seçenek 3: Dockerfile'ı Düzelt (Eğer Dockerfile Kullanmak İstiyorsanız)

Eğer Railway'de Dockerfile kullanmak istiyorsanız:

1. **Railway'de root directory'yi değiştirin:**
   - Root directory: `teleradyoloji` (advanced değil)

2. **Dockerfile'ı düzeltin:**
   ```dockerfile
   # Root directory: teleradyoloji olduğunda
   COPY requirements.txt .
   ```

3. **Start command'ı güncelleyin:**
   ```bash
   cd web_dashboard/advanced && python -m uvicorn backend.main:socket_app --host 0.0.0.0 --port $PORT
   ```

**NOT:** Bu yaklaşım önerilmez çünkü `railway.toml` zaten doğru ayarlanmış.

---

## 🎯 Önerilen Çözüm

**Seçenek 1'i kullanın:**
- `.railwayignore` dosyası Dockerfile'ı zaten ignore ediyor
- Railway otomatik olarak `railway.toml`'daki nixpacks builder'ı kullanacak
- Build command: `pip install -r ../../../requirements.txt` ✅
- Start command: `cd ../../.. && python -m uvicorn web_dashboard.advanced.backend.main:socket_app --host 0.0.0.0 --port $PORT` ✅

---

## 🔄 Railway'de Yeniden Deploy

1. **Git push yapın** (`.railwayignore` güncellendi)
2. **Railway otomatik redeploy yapacak**
3. **Build logs'u kontrol edin:**
   - "Using nixpacks builder" görünmeli
   - "Dockerfile" görünmemeli

---

## ✅ Kontrol

Deploy sonrası build logs'da şunları görmelisiniz:
```
✓ Using nixpacks builder
✓ Build command: pip install -r ../../../requirements.txt
✓ Start command: cd ../../.. && python -m uvicorn ...
```

**Dockerfile hatası artık görünmemeli!**

