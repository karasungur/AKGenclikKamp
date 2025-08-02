# Kurulum ve Çalıştırma

1. **Depoyu klonlayın:**

   ```bash
   git clone <repo-url>
   cd AKGenclikKamp
   ```

2. **Bağımlılıkları yükleyin:**

   ```bash
   npm install
   ```

3. **Ortam değişkenlerini ayarlayın:** Proje kökünde bir `.env` dosyası oluşturun ve aşağıdaki bilgileri girin:

   ```env
   DATABASE_URL=postgresql://neondb_owner:npg_UyCdK29IOeRZ@ep-small-thunder-a23na84r-pooler.eu-central-1.aws.neon.tech/akkamp?sslmode=require&channel_binding=require
   PGDATABASE=akkamp
   PGHOST=ep-small-thunder-a23na84r-pooler.eu-central-1.aws.neon.tech
   PGPORT=5432
   PGUSER=neondb_owner
   PGPASSWORD=npg_UyCdK29IOeRZ
   ```

4. **Veritabanı şemasını uygulayın:**

   ```bash
   npm run db:push
   ```

5. **Geliştirme ortamında çalıştırın:**

   ```bash
   npm run dev
   ```

6. **Not:** Komutlar `cross-env` kullanılarak tanımlandığı için hem Windows hem de Linux'ta aynı şekilde çalışır.

Uygulama varsayılan olarak `http://localhost:5000` adresinde çalışacaktır.
