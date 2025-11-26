# 🏥 Enterprise Audit Trail Dashboard

Gelişmiş, enterprise-grade audit trail monitoring ve analiz dashboard'u.

## 🚀 Özellikler

### 🔍 **Gelişmiş Arama ve Filtreleme**
- **Doktor Arama**: İsim, departman, hastane bazlı arama
- **Cihaz Arama**: İsim, IP, tip bazlı arama  
- **Hasta Arama**: ID, isim, yaş bazlı arama
- **Tarih Aralığı**: Özel tarih aralığı filtreleme
- **Hastane Bazlı**: Hastane seçerek logları filtreleme

### 📊 **Gerçek Zamanlı Analytics**
- **Activity Charts**: Zaman bazlı aktivite grafikleri
- **Event Distribution**: Olay türü dağılım grafikleri
- **Performance Metrics**: Sistem performans metrikleri
- **Security Trends**: Güvenlik trend analizi
- **User Heatmaps**: Kullanıcı aktivite haritaları

### 🎯 **Multi-Tab Interface**
- **Audit Logs**: Ana audit log görüntüleme
- **HL7 Messages**: HL7 mesaj görüntüleyici
- **DICOM Images**: DICOM görüntü yönetimi
- **PDF Reports**: Rapor görüntüleyici
- **Security Alerts**: Güvenlik uyarıları

### 📈 **Dashboard Views**
- **Dashboard**: Ana istatistik ve grafikler
- **Timeline**: Zaman çizelgesi görünümü
- **Analytics**: Detaylı analiz sayfası
- **Reports**: Rapor oluşturma ve görüntüleme

### 🏥 **Hastane Yönetimi**
- **Multi-Hospital Support**: Çoklu hastane desteği
- **Hospital Selection**: Hastane seçimi
- **Hospital-based Filtering**: Hastane bazlı filtreleme
- **Cross-Hospital Analytics**: Hastaneler arası analiz

## 🛠️ Kurulum ve Başlatma

### 1. Gereksinimler
```bash
# Python paketleri
pip install sqlite3  # Built-in
pip install pathlib  # Built-in
```

### 2. Server'ı Başlat
```bash
cd web_dashboard/advanced
python advanced-server.py
```

### 3. Dashboard'u Aç
```
http://localhost:8081
```

## 📊 API Endpoints

### **Ana API'ler**
- `GET /api/logs` - Audit logları
- `GET /api/stats/dashboard` - Dashboard istatistikleri
- `GET /api/hospitals` - Hastane listesi
- `GET /api/users` - Kullanıcı listesi
- `GET /api/devices` - Cihaz listesi
- `GET /api/patients` - Hasta listesi

### **Arama API'leri**
- `GET /api/search/doctors?q=query` - Doktor arama
- `GET /api/search/devices?q=query` - Cihaz arama
- `GET /api/search/patients?q=query` - Hasta arama

### **Analytics API'leri**
- `GET /api/analytics/activity` - Aktivite analizi
- `GET /api/analytics/security` - Güvenlik analizi
- `GET /api/analytics/performance` - Performans analizi

### **Media API'leri**
- `GET /api/timeline` - Timeline verileri
- `GET /media/hl7/{id}` - HL7 dosya
- `GET /media/dicom/{id}` - DICOM bilgileri
- `GET /media/pdf/{id}` - PDF rapor

## 🎯 Kullanım Senaryoları

### **1. Doktor Bazlı İzleme**
```javascript
// Doktor arama
GET /api/search/doctors?q=Dr. Ahmet

// Doktor aktiviteleri
GET /api/logs?user_id=user-1
```

### **2. Cihaz Performans Analizi**
```javascript
// Cihaz arama
GET /api/search/devices?q=CT-Scanner

// Cihaz operasyonları
GET /api/logs?device_id=device-2
```

### **3. Hasta Veri Erişimi İzleme**
```javascript
// Hasta arama
GET /api/search/patients?q=P12345

// Hasta erişim logları
GET /api/logs?patient_id=P12345
```

### **4. Hastane Bazlı Analiz**
```javascript
// Hastane logları
GET /api/logs?hospital_id=hospital-1

// Hastane istatistikleri
GET /api/stats/dashboard?hospital_id=hospital-1
```

## 📊 Dashboard Bileşenleri

### **Sol Sidebar**
- **Advanced Search**: Doktor, cihaz, hasta arama
- **Date Range Filter**: Tarih aralığı seçimi
- **Quick Filters**: Hızlı filtre butonları
- **Media Tabs**: HL7, DICOM, PDF, Alerts
- **Analytics Widget**: Mini aktivite grafiği

### **Ana İçerik Alanı**
- **Content Tabs**: Dashboard, Timeline, Analytics, Reports
- **Stats Grid**: Ana istatistik kartları
- **Charts Row**: Aktivite ve olay dağılım grafikleri
- **Recent Activity**: Son aktiviteler listesi

### **Üst Navigasyon**
- **Hospital Selector**: Hastane seçici
- **Live Stats**: Canlı istatistikler
- **Control Buttons**: Refresh, Settings, Export

## 🎨 UI/UX Özellikleri

### **Modern Tasarım**
- **Glassmorphism**: Modern cam efekti
- **Gradient Backgrounds**: Gradient arka planlar
- **Smooth Animations**: Akıcı animasyonlar
- **Responsive Design**: Mobil uyumlu

### **Renk Kodlaması**
- **INFO**: Mavi (#1e40af)
- **WARNING**: Turuncu (#d97706)
- **ERROR**: Kırmızı (#dc2626)
- **CRITICAL**: Koyu kırmızı (#b91c1c)
- **SUCCESS**: Yeşil (#059669)

### **Interaktif Özellikler**
- **Real-time Updates**: Gerçek zamanlı güncelleme
- **Hover Effects**: Hover efektleri
- **Click Animations**: Tıklama animasyonları
- **Loading States**: Yükleme durumları

## 🔧 Gelişmiş Özellikler

### **SQLite Database**
```sql
-- Audit logs tablosu
CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    level TEXT NOT NULL,
    event_type TEXT NOT NULL,
    message TEXT NOT NULL,
    user_id TEXT,
    device_id TEXT,
    patient_id TEXT,
    hospital_id TEXT,
    source_ip TEXT,
    details TEXT
);

-- Hastaneler tablosu
CREATE TABLE hospitals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    type TEXT,
    status TEXT DEFAULT 'active'
);
```

### **Real-time Features**
- **WebSocket Support**: Gerçek zamanlı veri akışı
- **Live Statistics**: Canlı istatistikler
- **Auto Refresh**: Otomatik yenileme
- **Push Notifications**: Anlık bildirimler

### **Export Capabilities**
- **JSON Export**: JSON formatında dışa aktarma
- **CSV Export**: CSV formatında dışa aktarma
- **PDF Reports**: PDF rapor oluşturma
- **Selected Export**: Seçili logları dışa aktarma

## 📱 Responsive Design

### **Desktop (1200px+)**
- Grid layout: 320px sidebar + flexible main
- Full feature set available
- Multiple columns for charts

### **Tablet (768px - 1199px)**
- Stacked layout
- Collapsible sidebar
- Single column charts

### **Mobile (< 768px)**
- Full-width layout
- Bottom navigation
- Simplified interface
- Touch-friendly controls

## 🔒 Güvenlik Özellikleri

### **Access Control**
- **Role-based Access**: Rol bazlı erişim
- **Hospital Isolation**: Hastane izolasyonu
- **IP Whitelisting**: IP beyaz liste
- **Session Management**: Oturum yönetimi

### **Data Protection**
- **Encryption**: Veri şifreleme
- **Audit Trail**: Audit trail koruması
- **Data Retention**: Veri saklama politikaları
- **Backup**: Otomatik yedekleme

## 🚀 Performans Optimizasyonu

### **Frontend**
- **Lazy Loading**: Gecikmeli yükleme
- **Virtual Scrolling**: Sanal kaydırma
- **Caching**: Önbellekleme
- **CDN**: İçerik dağıtım ağı

### **Backend**
- **Database Indexing**: Veritabanı indeksleme
- **Query Optimization**: Sorgu optimizasyonu
- **Connection Pooling**: Bağlantı havuzlama
- **Response Compression**: Yanıt sıkıştırma

## 🔧 Geliştirme

### **Yeni Özellik Ekleme**
1. **Database Schema**: Yeni tablo/sütun ekle
2. **API Endpoint**: Yeni API endpoint oluştur
3. **Frontend Component**: UI bileşeni ekle
4. **Integration**: Entegrasyon yap

### **Customization**
```javascript
// Yeni filtre tipi ekleme
const customFilters = {
    'custom-filter': (logs) => {
        return logs.filter(log => /* custom logic */);
    }
};

// Yeni chart tipi ekleme
const customCharts = {
    'custom-chart': {
        type: 'line',
        options: { /* chart options */ }
    }
};
```

## 📊 Monitoring ve Alerting

### **Health Checks**
- **Database Health**: Veritabanı sağlık kontrolü
- **API Response Time**: API yanıt süresi
- **Memory Usage**: Bellek kullanımı
- **Error Rate**: Hata oranı

### **Alerting**
- **Critical Events**: Kritik olay uyarıları
- **Performance Issues**: Performans sorunları
- **Security Breaches**: Güvenlik ihlalleri
- **System Failures**: Sistem hataları

## 🎯 Gelecek Özellikler

### **Planned Features**
- **Machine Learning**: ML tabanlı anomali tespiti
- **Advanced Analytics**: Gelişmiş analitik
- **Mobile App**: Mobil uygulama
- **API Integration**: 3. parti API entegrasyonu

### **Roadmap**
- **Q4 2025**: ML Analytics
- **Q1 2026**: Mobile App
- **Q2 2026**: Advanced Reporting
- **Q3 2026**: AI-powered Insights

---

**🏥 Enterprise Audit Trail Dashboard ile teleradiology sisteminizi profesyonel seviyede izleyin ve analiz edin!**
