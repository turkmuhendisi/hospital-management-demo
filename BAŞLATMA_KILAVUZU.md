# 🚀 Dashboard Başlatma Kılavuzu

## ✅ En Kolay Yöntem (Önerilen)

### **Yöntem 1: Bash Script ile**

```bash
# Teleradyoloji sim dizinine git
cd /Users/turkmuhendisi/Documents/teleradyoloji-sim

# Script'i çalıştır (tek komut!)
./teleradyoloji/web_dashboard/advanced/START_DASHBOARD.sh
```

✅ **Otomatik olarak:**
- Dependencies kontrol eder (yoksa yükler)
- Doğru dizine gider
- Backend'i başlatır
- http://localhost:8082 açılır

---

## 🔧 Manuel Başlatma Yöntemleri

### **Yöntem 2: Uvicorn ile Direkt (Terminal)**

```bash
# Project root'a git
cd /Users/turkmuhendisi/Documents/teleradyoloji-sim

# Uvicorn ile başlat
cd teleradyoloji
python3 -m uvicorn web_dashboard.advanced.backend.main:socket_app \
    --host 0.0.0.0 \
    --port 8082 \
    --reload
```

### **Yöntem 3: Python Module Olarak**

```bash
# Project root'a git
cd /Users/turkmuhendisi/Documents/teleradyoloji-sim

# Python module olarak çalıştır
cd teleradyoloji/web_dashboard/advanced/backend
python3 run.py
```

---

## ⚠️ Yaygın Hatalar ve Çözümleri

### **Hata 1: ModuleNotFoundError**
```
ModuleNotFoundError: No module named 'web_dashboard'
```

**Çözüm:**
```bash
# __init__.py dosyaları eklenmiş olmalı
# Eğer yoksa:
touch /Users/turkmuhendisi/Documents/teleradyoloji-sim/teleradyoloji/web_dashboard/__init__.py
touch /Users/turkmuhendisi/Documents/teleradyoloji-sim/teleradyoloji/web_dashboard/advanced/__init__.py
```

### **Hata 2: Port Already in Use**
```
ERROR: [Errno 48] Address already in use
```

**Çözüm:**
```bash
# Port'u kullanan process'i öldür
lsof -ti :8082 | xargs kill -9

# Ya da config.py'de portu değiştir
# backend/config.py → PORT = 8083
```

### **Hata 3: Import Errors (fastapi, etc.)**
```
ModuleNotFoundError: No module named 'fastapi'
```

**Çözüm:**
```bash
# Dependencies'i yükle
cd /Users/turkmuhendisi/Documents/teleradyoloji-sim/teleradyoloji
pip3 install -r requirements.txt

# Eğer hala sorun varsa:
pip3 install --upgrade pip
pip3 install -r requirements.txt --force-reinstall
```

### **Hata 4: pydantic_settings Import Error**
```
ModuleNotFoundError: No module named 'pydantic_settings'
```

**Çözüm:**
```bash
# Pydantic v2 gerekli
pip3 install "pydantic>=2.0" pydantic-settings
```

---

## 🧪 Test Et

### **Backend Çalışıyor mu?**
```bash
# Health check
curl http://localhost:8082/health

# Başarılı yanıt:
{
  "status": "healthy",
  "version": "2.0.0"
}
```

### **API Docs**
```
http://localhost:8082/docs
```

### **Dashboard**
```
http://localhost:8082
```

---

## 📝 Başarılı Başlatma Örneği

```bash
$ ./teleradyoloji/web_dashboard/advanced/START_DASHBOARD.sh

============================================================
🚀 Starting Enterprise Audit Trail Dashboard
============================================================

🌐 Dashboard will be available at: http://localhost:8082
📖 API Documentation at: http://localhost:8082/docs

⏹️  Press Ctrl+C to stop the server

INFO:     Will watch for changes in these directories: ['/Users/...']
INFO:     Uvicorn running on http://0.0.0.0:8082 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using StatReload
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

---

## 🎯 Hangi Yöntemi Kullanmalıyım?

| Yöntem | Ne Zaman Kullan | Avantaj |
|--------|----------------|---------|
| **Bash Script** | Her zaman (önerilen) | En kolay, otomatik setup |
| **Uvicorn Direkt** | Development sırasında | Daha fazla kontrol, reload aktif |
| **Python Module** | Production'da | Daha yapılandırılmış |

---

## 💡 Pro Tips

### **Auto-reload Devre Dışı (Production)**
```bash
python3 -m uvicorn web_dashboard.advanced.backend.main:socket_app \
    --host 0.0.0.0 \
    --port 8082
    # --reload yok!
```

### **Background'da Çalıştır**
```bash
# Nohup ile
nohup ./START_DASHBOARD.sh > dashboard.log 2>&1 &

# Process ID
echo $! > dashboard.pid

# Durdur
kill $(cat dashboard.pid)
```

### **Logs İzle**
```bash
# Terminal'de logs göster
tail -f dashboard.log

# Ya da direkt terminal'de çalıştır (log'ları görürsün)
```

---

## ✅ Checklist

Başlatmadan önce kontrol et:

- [ ] Python 3.9+ kurulu (`python3 --version`)
- [ ] Dependencies kurulu (`pip3 list | grep fastapi`)
- [ ] Port 8082 boş (`lsof -i :8082` boş dönmeli)
- [ ] Doğru dizindesin (`pwd` teleradyoloji-sim göstermeli)

Başlattıktan sonra kontrol et:

- [ ] Backend başladı (terminal'de "Uvicorn running" görünür)
- [ ] Health check çalışıyor (`curl http://localhost:8082/health`)
- [ ] Dashboard açılıyor (`http://localhost:8082`)
- [ ] WebSocket bağlandı (browser console'da "✅ WebSocket connected")
- [ ] Data yüklendi (Dashboard'da rakamlar görünür)

---

## 🆘 Hala Sorun mu Var?

1. **Terminal output'u kontrol et** - Hata mesajları var mı?
2. **Browser console'u kontrol et** - JavaScript hataları var mı?
3. **Port çakışması** - Başka bir uygulama 8082 kullanıyor mu?
4. **Dependencies** - Tüm paketler kurulu mu?
5. **Python version** - 3.9+ mı?

**Destek için:** 
- Backend logs'u kontrol et
- Browser console errors
- Terminal error messages

---

**🎉 Başarılı başlatma için: `./START_DASHBOARD.sh` komutunu çalıştır!**

