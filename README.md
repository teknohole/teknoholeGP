# Package Resmi teknohole.com (@teknohole/teknohole)

## Penggunaan WebStorage SDK

Dokumentasi ini menjelaskan cara menggunakan `WebStorage` SDK untuk mengunggah dan menghapus file menggunakan Node.js.

---

### 1. Instalasi

Gunakan `npm` atau `yarn` untuk menginstal paket.

```bash
npm install @teknohole/teknohole
```

atau

```bash
yarn add @teknohole/teknohole
```

---

### 2. Inisialisasi Klien

Pertama, impor (`require`) kelas `WebStorage` dari paket dan buat sebuah *instance* dengan **API Key** dan **Nama Storage** Anda.

```javascript
const WebStorage = require('@teknohole/teknohole');

// Ganti dengan kredensial Anda
const apiKey = "API_KEY_ANDA_YANG_SANGAT_RAHASIA";
const storageName = "NAMA_STORAGE_ANDA";

// Buat instance klien
const client = new WebStorage({ apiKey, storageName });
```

---

### 3. Mengunggah File 🖼️

Gunakan metode `uploadFile()` untuk mengunggah file. Karena metode ini bersifat *asynchronous*, Anda harus menggunakan `await` di dalam sebuah `async function`.

#### Contoh Penggunaan

```javascript
const fs = require('fs');

// Fungsi async untuk menjalankan proses upload
async function unggahGambar() {
    const filePath = 'gambar-produk.jpg';
    // Buat file dummy untuk diunggah
    fs.writeFileSync(filePath, 'ini adalah konten file gambar');

    console.log(`Mencoba mengunggah file: ${filePath}`);
    const hasilUpload = await client.uploadFile(filePath);

    if (hasilUpload.success) {
        const objectKey = hasilUpload.data.key;
        console.log("✅ Upload Berhasil!");
        console.log(`   Pesan: ${hasilUpload.message}`);
        console.log(`   Object Key: ${objectKey}`);
    } else {
        console.log("❌ Upload Gagal!");
        console.log(`   Pesan: ${hasilUpload.message}`);
    }

    // Hapus file dummy setelah selesai
    fs.unlinkSync(filePath);
}

unggahGambar();
```

---
### 4. Menghapus File

Gunakan metode `deleteFile()` untuk menghapus file. Metode ini memerlukan `object_key` yang Anda dapatkan saat berhasil mengunggah file.

#### Contoh Penggunaan

```javascript
async function hapusGambar() {
    const keyUntukDihapus = "[https://cdn.teknohole.com/](https://cdn.teknohole.com/)<id-akun>/<nama-storage>/<nama-file>";

    console.log(`Mencoba menghapus file dengan key: ${keyUntukDihapus}`);
    const hasilHapus = await client.deleteFile(keyUntukDihapus);

    if (hasilHapus.success) {
        console.log("✅ File Berhasil Dihapus!");
    } else {
        console.log("❌ Gagal Menghapus File!");
        console.log(`   Pesan: ${hasilHapus.message}`);
    }
}

hapusGambar();
```
---

### 5. Contoh Lengkap (Upload lalu Delete)

Berikut adalah contoh lengkap yang menggabungkan semua proses dalam satu skrip.

```javascript
const WebStorage = require('@teknohole/teknohole');
const fs = require('fs');

const apiKey = "API_KEY_ANDA";
const storageName = "NAMA_STORAGE_ANDA";
const client = new WebStorage({ apiKey, storageName });

const namaFileTes = "test_file.txt";

// Gunakan IIFE (Immediately Invoked Function Expression) async
(async () => {
    fs.writeFileSync(namaFileTes, "Ini adalah file tes.");

    try {
        console.log("--- Proses Upload ---");
        const uploadResult = await client.uploadFile(namaFileTes);

        if (uploadResult.success) {
            console.log(`Upload berhasil. Key: ${uploadResult.data.key}`);
            
            const objectKey = uploadResult.data.key;
            
            console.log("\n--- Proses Delete ---");
            const deleteResult = await client.deleteFile(objectKey);
            
            if (deleteResult.success) {
                console.log("Penghapusan berhasil.");
            } else {
                console.log(`Penghapusan gagal: ${deleteResult.message}`);
            }
        } else {
            console.log(`Upload gagal: ${uploadResult.message}`);
        }
    } catch (error) {
        console.error("Terjadi error tak terduga:", error);
    } finally {
        console.log("\nMembersihkan file sementara...");
        fs.unlinkSync(namaFileTes);
        console.log("Selesai.");
    }
})();
```