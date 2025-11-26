# ⚡ Quick Start Guide - Enterprise Audit Trail Dashboard V2.0

## 🚀 5 Dakikada Başlat!

### **Adım 1: Dependencies Kurulumu**

```bash
cd /Users/turkmuhendisi/Documents/teleradyoloji-sim/teleradyoloji
pip install -r requirements.txt
```

**Yüklenen Ana Paketler:**
- ✅ FastAPI - Modern web framework
- ✅ SQLAlchemy - ORM
- ✅ Faker - Türkçe veri üretimi
- ✅ python-socketio - Real-time WebSocket
- ✅ APScheduler - Background tasks
- ✅ structlog - Structured logging

---

### **Adım 2: Backend Başlat**

```bash
cd web_dashboard/advanced/backend
python run.py
```

**Ekranda göreceksin:**
```
============================================================
🚀 Enterprise Audit Trail Dashboard
============================================================
📊 Version: 2.0.0
🌐 URL: http://0.0.0.0:8082
📖 API Docs: http://0.0.0.0:8082/docs
🔧 Debug Mode: True
🎲 Data Generation: True
============================================================

⏹️  Press Ctrl+C to stop the server

INFO:     Starting database initialization...
INFO:     Seeded 4 hospitals
INFO:     Seeded 100 users
INFO:     Seeded 28 devices
INFO:     Seeded 200 patients
INFO:     Seeded 1500+ historical audit logs
INFO:     Background data generator started (interval: 2s)
INFO:     Uvicorn running on http://0.0.0.0:8082
```

---

### **Adım 3: Dashboard Aç**

```
Tarayıcıda aç: http://localhost:8082
```

**Otomatik olarak:**
- ✅ Frontend yüklenir
- ✅ WebSocket bağlanır
- ✅ Initial data load edilir
- ✅ Charts render edilir
- ✅ Real-time updates başlar

---

## 📊 İlk Bakışta Ne Göreceksin?

### **Dashboard**
- 📈 **Total Events:** ~1500+ (7 günlük historical data)
- 👥 **Active Users:** ~100 (Doktorlar, Teknisyenler, Hemşireler)
- 💻 **Active Devices:** ~28 (CT, MRI, X-Ray, Ultrasound, PACS, NST)
- 🏥 **Patient Count:** ~200
- ⚠️ **Security Events:** ~50-100 (Gerçekçi %2-5 error rate)
- 💚 **System Health:** ~97-99%

### **Charts**
- 📊 **Activity Over Time:** 24 saatlik aktivite grafiği
- 🍩 **Event Types Distribution:** Olay türü dağılımı
- 📈 **Sidebar Mini Chart:** Son aktiviteler

### **Recent Activity**
- 🔄 **Real-time Updates:** Her 2 saniyede yeni event
- 📝 **Turkish Messages:** "Dr. Ahmet Yılmaz sisteme başarıyla giriş yaptı"
- ⏰ **Realistic Timing:** Peak hours (09:00-17:00)

---

## 🎯 Hemen Dene!

### **1. Doktor Ara**
```
1. Sol sidebar'da "Doctor" arama kutusuna "Ahmet" yaz
2. Otomatik olarak ismi içinde "Ahmet" geçen doktorları listeler
3. Birini seç
4. O doktorun tüm aktivitelerini gör
```

### **2. Hastane Filtrele**
```
1. Üst menüden hastane seç: "Ankara Şehir Hastanesi"
2. Dashboard sadece o hastanenin verilerini gösterir
3. İstatistikler güncellenir
```

### **3. Security Events**
```
1. Quick Filters'dan "Security" butonuna tıkla
2. Sadece güvenlik olayları görüntülenir:
   - ACCESS_DENIED
   - SECURITY_ALERT
   - UNAUTHORIZED_ACCESS
   - SUSPICIOUS_ACTIVITY
```

### **4. Real-time İzle**
```
1. Dashboard açıkken bırak
2. Her 2 saniyede bir yeni log event gelir
3. "Recent Activity" otomatik güncellenir
4. Charts real-time update edilir
5. WebSocket bağlantısı: "Connected" (yeşil nokta)
```

### **5. Export Data**
```
1. Sağ üst köşede "Export" butonuna tıkla
2. JSON dosyası indirilir
3. İçinde: filtered logs + stats + timestamp
```

---

## 🔍 API Keşfet

### **Swagger UI**
```
http://localhost:8082/docs
```

**Try it out yapabilirsin:**
- `GET /api/logs` - Audit logs listele
- `GET /api/stats/dashboard` - Dashboard stats
- `GET /api/search/doctors?q=Ahmet` - Doktor ara
- `GET /api/analytics/activity?hours=24` - Activity analytics
- `POST /api/auth/demo-token` - Demo token al

---

## 🎨 Gerçekçi Veri Örnekleri

### **Turkish Doctor Names**
```
Dr. Ahmet Yılmaz - Radyoloji
Uzm. Dr. Ayşe Demir - Kardiyoloji
Prof. Dr. Mehmet Kaya - Nöroloji
Doç. Dr. Zeynep Arslan - Ortopedi
```

### **Turkish Patient Names**
```
Ahmet Yılmaz (45y, M) - TC: 12345678901
Ayşe Demir (32y, F) - TC: 98765432109
```

### **Turkish Addresses**
```
Atatürk Bulvarı No:123, Ankara
Cumhuriyet Caddesi Daire:45, İstanbul
```

### **Event Messages (Turkish)**
```
"Dr. Ahmet Yılmaz sisteme başarıyla giriş yaptı"
"P12345 hasta kabulü yapıldı"
"CT-Scanner-01 cihazında görüntüleme tamamlandı - 256 görüntü"
"P12345 raporu Dr. Ayşe Demir raportörüne atandı"
"Güvenlik uyarısı: Multiple failed logins"
```

---

## ⚙️ Configuration (İhtiyaç Halinde)

### **Port Değiştir**
```python
# backend/config.py
PORT = 8083  # Default: 8082
```

### **Data Generation Hızı**
```python
# backend/config.py
DATA_GENERATION_INTERVAL = 5  # Default: 2 seconds
```

### **Historical Data**
```python
# backend/config.py
HISTORICAL_DATA_DAYS = 30  # Default: 7 days
```

### **Database**
```python
# backend/config.py
# SQLite (default - development)
DATABASE_URL = "sqlite:///./data/audit_production.db"

# PostgreSQL (production)
DATABASE_URL = "postgresql://user:password@localhost/audit_trail"
```

---

## 🐛 Sorun mu Var?

### **Port Already in Use**
```bash
# Kill process on port 8082
lsof -ti :8082 | xargs kill -9

# Or change port in config.py
```

### **WebSocket Not Connecting**
```bash
# Check browser console
# Should see: "✅ WebSocket connected"

# If not:
1. Backend running kontrolü
2. CORS settings kontrol
3. Browser console errors
```

### **No Data Showing**
```bash
# Backend logs kontrol:
# "Seeded X hospitals" mesajları var mı?

# Eğer yoksa:
1. Backend'i restart et
2. Delete data/audit_production.db
3. Tekrar başlat (auto-seed yapacak)
```

---

## 📚 Daha Fazla Bilgi

- 📖 **Full Documentation:** README_V2.md
- 🔧 **Backend Code:** backend/
- 🎨 **Frontend Code:** advanced-script-v2.js
- 📊 **API Docs:** http://localhost:8082/docs
- 🐛 **Issues:** Backend console logs

---

## ✅ Checklist

- [x] Dependencies kuruldu (`pip install -r requirements.txt`)
- [x] Backend başladı (`python backend/run.py`)
- [x] Dashboard açıldı (`http://localhost:8082`)
- [x] WebSocket bağlandı (Status: Connected)
- [x] Data yüklendi (1500+ events)
- [x] Charts gösteriliyor
- [x] Real-time updates çalışıyor

---

**🎉 Tebrikler! Enterprise Audit Trail Dashboard V2.0 çalışıyor!**

**Sıradaki:** README_V2.md'yi oku, API'yi keşfet, production deploy et!

