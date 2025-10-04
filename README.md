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

### Import dengan Named Export (Recommended)
```javascript
import { WebStorage } from '@teknohole/teknohole';

const storage = new WebStorage({
    apiKey: 'your-api-key',
    storageName: 'your-storage-name'
});
```

### Import Default
```javascript
import WebStorage from '@teknohole/teknohole';
```

### Import Spesifik Node.js
```javascript
// ESM
import WebStorage from '@teknohole/teknohole/node';

// CommonJS
const { WebStorage } = require('@teknohole/teknohole/node');
```

### Import Spesifik Browser
```javascript
import WebStorage from '@teknohole/teknohole/browser';
```

### CommonJS (Legacy Support)
```javascript
const { WebStorage } = require('@teknohole/teknohole');
// atau
const WebStorage = require('@teknohole/teknohole').default;
```

## 🎯 Penggunaan Praktis

### Node.js
```javascript
import { WebStorage } from '@teknohole/teknohole';

const storage = new WebStorage({
    apiKey: process.env.TEKNOHOLE_API_KEY,
    storageName: 'my-storage'
});

// Upload file
const result = await storage.uploadFile('./image.jpg');
console.log(result.data.key); // storage-key-123

// List files
const files = await storage.listFiles({ limit: 10 });
console.log(files.data);

// Delete file
await storage.deleteFile('storage-key-123');
```

### Browser (React)
```javascript
import { WebStorage } from '@teknohole/teknohole';

function FileUploader() {
    const storage = new WebStorage({
        apiKey: 'your-api-key',
        storageName: 'my-storage'
    });

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        const result = await storage.uploadFile(file);
        
        if (result.success) {
            console.log('Uploaded:', result.data.key);
        }
    };

    return <input type="file" onChange={handleUpload} />;
}
```

### Browser (Vanilla JS)
```html
<!DOCTYPE html>
<html>
<body>
    <input type="file" id="fileInput">
    <button onclick="upload()">Upload</button>
    
    <script type="module">
        import { WebStorage } from 'https://unpkg.com/@teknohole/teknohole@1.2.1/dist/browser.js';
        
        const storage = new WebStorage({
            apiKey: 'your-api-key',
            storageName: 'my-storage'
        });
        
        window.upload = async () => {
            const file = document.getElementById('fileInput').files[0];
            const result = await storage.uploadFile(file);
            console.log(result);
        };
    </script>
</body>
</html>
```