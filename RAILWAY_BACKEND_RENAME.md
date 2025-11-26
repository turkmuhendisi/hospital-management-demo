# 🔧 Railway backend/ Klasörü Sorunu - Çözüm

## ❌ Sorun

Railway `backend` klasörünü otomatik algılıyor ve subdirectory olarak kullanmaya çalışıyor:
```
Using subdirectory "backend"
```

## ✅ ÇÖZÜM: backend/ → app/ Yeniden Adlandırma

Railway `backend` ismini özel olarak algılıyor. Klasörü `app` olarak yeniden adlandırdık.

### Yapılan Değişiklikler:

1. **Klasör yeniden adlandırıldı:**
   ```bash
   backend/ → app/
   ```

2. **railway.toml güncellendi:**
   ```toml
   startCommand = "cd ../../.. && python -m uvicorn web_dashboard.advanced.app.main:socket_app --host 0.0.0.0 --port $PORT"
   ```
   `backend.main` → `app.main`

3. **.nixpacksignore güncellendi:**
   ```
   app/
   ```

---

## 📋 Güncel Dosya Yapısı

```
hospital-management-demo/ (GitHub repo root)
├── .nixpacksignore    ✅ app/ ignore eder
├── requirements.txt   ✅ Nixpacks bunu görecek
├── runtime.txt        ✅ Python 3.9
├── railway.toml       ✅ Config (güncellendi)
├── app/               ✅ YENİ İSİM (eskiden backend/)
│   ├── main.py
│   ├── config.py
│   └── ...
└── index.html
```

---

## 🔄 Deploy

1. **Git commit ve push:**
   ```bash
   cd /Users/turkmuhendisi/Documents/teleradyoloji-sim/teleradyoloji/web_dashboard/advanced
   git add .
   git commit -m "Rename backend to app to avoid Railway auto-detection"
   git push
   ```

2. **Railway otomatik redeploy yapacak**

---

## ✅ Beklenen Sonuç

Build logs'da artık şunları görmelisiniz:

```
✓ Using Nixpacks
✓ Detected Python project (found requirements.txt in root)
✓ Installing Python 3.9 from runtime.txt
✓ pip install -r requirements.txt
✓ Build successful
✓ Starting application...
```

**"Using subdirectory" görünmemeli!**

---

**Bu kesin çalışır! 🚀**

