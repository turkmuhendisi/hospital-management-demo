# 🚨 Railway Root Directory Hatası - Çözüm

## ❌ Sorun

Railway "backend" subdirectory'sine girmeye çalışıyor:
```
Using subdirectory "backend"
Nixpacks was unable to generate a build plan
```

## ✅ ÇÖZÜM: Root Directory Düzelt

### Railway Dashboard'da Root Directory Ayarı

1. **Railway.app** → Projenize gidin
2. **Service'inize tıklayın**
3. **Settings** sekmesine gidin
4. **"Root Directory"** bölümünü bulun

#### Doğru Ayar:
```
teleradyoloji/web_dashboard/advanced
```

#### Yanlış Ayarlar (düzeltin):
```
teleradyoloji/web_dashboard/advanced/backend  ❌
backend  ❌
```

5. **Düzeltin**
6. **"Save"** butonuna tıklayın
7. **Redeploy** yapın

---

## 📋 Neden Backend Değil?

Railway root directory'de şunları aramalı:
- ✅ `requirements.txt` - Python projesi algılama
- ✅ `runtime.txt` - Python version
- ✅ `railway.toml` - Railway config

**Backend dizininde bunlar yok!**

```
teleradyoloji/web_dashboard/advanced/    ← ROOT BURASI!
├── requirements.txt   ✅
├── runtime.txt        ✅
├── railway.toml       ✅
├── backend/           ← Subdirectory (root değil!)
│   ├── main.py
│   └── config.py
└── index.html
```

---

## 🔍 Kontrol

Root directory doğru ayarlandıktan sonra build logs'da:

```
✓ Using Nixpacks
✓ Root directory: teleradyoloji/web_dashboard/advanced
✓ Detected Python project (found requirements.txt)
✓ Installing Python 3.9 from runtime.txt
✓ pip install -r requirements.txt
✓ Build successful
```

**"Using subdirectory" görünmemeli!**

---

## 🆘 Hala Backend'e Giriyorsa

### Seçenek 1: .nixpacksignore Ekle

Railway bazen backend klasörünü otomatik algılıyor. Engellemek için:

```bash
# .nixpacksignore dosyası oluştur
echo "backend/" > .nixpacksignore
git add .nixpacksignore
git commit -m "Prevent Nixpacks from using backend subdirectory"
git push
```

### Seçenek 2: Service Yeniden Oluştur

1. **Yeni service oluştur**
2. **GitHub repo'yu bağla**
3. **Root Directory:** `teleradyoloji/web_dashboard/advanced` (dikkatli ayarla)
4. **Environment variables kopyala**
5. **Deploy**

---

## ✅ Checklist

- [ ] Railway Settings'de Root Directory: `teleradyoloji/web_dashboard/advanced`
- [ ] Root directory'de `requirements.txt` var
- [ ] Root directory'de `runtime.txt` var
- [ ] Root directory'de `railway.toml` var
- [ ] Build logs'da "Using subdirectory" görünmüyor
- [ ] Build başarılı

---

**En hızlı çözüm: Railway Settings'de Root Directory'yi düzeltin!**

