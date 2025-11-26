# 🌐 Network Erişimi İçin Başlatma

## 📱 Aynı Ağdaki Cihazlardan Erişim

Dashboard'a aynı ağdaki diğer cihazlardan (telefon, tablet, laptop) erişmek için:

### 1️⃣ Sunucuyu Başlat

```bash
cd /Users/turkmuhendisi/Documents/teleradyoloji-sim/teleradyoloji
python3 web_dashboard/advanced/backend/run.py
```

Sunucu `0.0.0.0:8082` üzerinde başlayacak - bu tüm network interface'lerinden erişilebilir demektir.

### 2️⃣ Erişim URL'leri

**Bu bilgisayardan:**
- http://localhost:8082
- http://127.0.0.1:8082

**Aynı ağdaki diğer cihazlardan:**
- http://192.168.1.4:8082

### 3️⃣ Firewall Kontrolü

macOS Firewall aktifse, port 8082'yi açmanız gerekebilir:

```bash
# Firewall durumunu kontrol et
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# Port açmak için System Preferences > Security & Privacy > Firewall > Firewall Options
# Python'a gelen bağlantılara izin verin
```

### 4️⃣ IP Adresinizi Öğrenme

Mevcut IP adresinizi öğrenmek için:

```bash
# macOS
ifconfig | grep "inet " | grep -v 127.0.0.1

# veya
ipconfig getifaddr en0
```

### 5️⃣ Mobil Cihazdan Test

1. Telefonunuzu aynı WiFi ağına bağlayın
2. Tarayıcıda açın: `http://192.168.1.4:8082`
3. Dashboard açılacak ve tüm özellikler çalışacak

---

## 🔧 Özelleştirilmiş Ayarlar

Farklı bir IP veya port kullanmak istiyorsanız:

### Backend Config (`backend/config.py`):
```python
HOST: str = "0.0.0.0"  # Tüm interface'lerden erişim
PORT: int = 8082       # İstediğiniz port
```

### CORS (Çapraz kaynak paylaşımı):
`backend/config.py` dosyasında `CORS_ORIGINS` listesine yeni IP'leri ekleyin:
```python
CORS_ORIGINS: list = [
    "http://192.168.1.4:8082",
    "http://192.168.1.5:8082",  # Başka bir cihaz
    "*",  # Veya tüm kaynaklara izin verin (sadece development için)
]
```

---

## 🛡️ Güvenlik Notları

- `*` (wildcard) CORS sadece development ortamında kullanın
- Production'da sadece bilinen IP'leri listeye ekleyin
- Gerekirse SSL/TLS (HTTPS) ekleyin
- Firewall ayarlarını kontrol edin

---

## ✅ Doğrulama

Sunucu çalışıyor mu kontrol edin:

```bash
# Local
curl http://localhost:8082/health

# Network
curl http://192.168.1.4:8082/health
```

Başarılı yanıt:
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "timestamp": "2025-10-20T..."
}
```

---

## 🐛 Sorun Giderme

### Bağlantı Reddedildi?
- Sunucunun çalıştığını kontrol edin
- Firewall'u kontrol edin
- Her iki cihazın da aynı ağda olduğundan emin olun

### CORS Hatası?
- `backend/config.py` dosyasında CORS_ORIGINS ayarlarını kontrol edin
- Sunucuyu yeniden başlatın

### 404 Not Found?
- Port numarasının doğru olduğundan emin olun (8082)
- Browser cache'i temizleyin

