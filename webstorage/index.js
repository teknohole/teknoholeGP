import axios from 'axios';

// Detect environment
const isNode = typeof window === 'undefined' && typeof global !== 'undefined' && typeof process !== 'undefined';
const isBrowser = typeof window !== 'undefined';

// Conditional imports for Node.js only
let fs, path, mime;
if (isNode) {
    fs = await import('fs');
    path = await import('path');
    mime = await import('mime-types');
}

export default class WebStorage {
    /**
     * SDK untuk mengunggah dan menghapus file di layanan WebStorage.
     * @param {{apiKey: string, storageName: string}} params
     */
    constructor({ apiKey, storageName }) {
        if (!apiKey || !storageName) {
            throw new Error('API Key dan Storage Name diperlukan.');
        }
        this.apiKey = apiKey;
        this.storageName = storageName;
        this.serviceUrl = 'https://storage.teknohole.com';
    }

    _getServiceHeaders() {
        return {
            'Authorization': `ApiKey ${this.apiKey}`,
            'Storage': `Storage ${this.storageName}`,
            'Content-Type': 'application/json',
        };
    }

    /**
     * @param {import('axios').AxiosRequestConfig} config
     * @returns {Promise<{success: boolean, data?: any, message?: string, status?: number}>}
     */
    async _requestToService(config) {
        try {
            const response = await axios({
                baseURL: this.serviceUrl,
                ...config,
                headers: {
                    ...this._getServiceHeaders(),
                    ...config.headers
                },
            });
            return { success: true, data: response.data };
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                const responseData = error.response.data;
                const message = responseData?.message || responseData?.detail || 'Terjadi kesalahan HTTP.';
                return { success: false, message, status: error.response.status };
            }
            return { success: false, message: `Koneksi ke server gagal: ${error.message}` };
        }
    }

    /**
     * Browser-compatible request using fetch as fallback
     * @param {Object} config 
     * @returns {Promise<{success: boolean, data?: any, message?: string, status?: number}>}
     */
    async _requestToServiceBrowser(config) {
        try {
            console.log('SDK trying to request URL:', `${this.serviceUrl}${config.url}`);
            const response = await fetch(`${this.serviceUrl}${config.url}`, {
                method: config.method || 'GET',
                headers: {
                    ...this._getServiceHeaders(),
                    ...config.headers
                },
                body: config.data ? JSON.stringify(config.data) : undefined,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const message = errorData?.message || errorData?.detail || 'Terjadi kesalahan HTTP.';
                return { success: false, message, status: response.status };
            }

            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            return { success: false, message: `Koneksi ke server gagal: ${error.message}` };
        }
    }

    /**
     * Get MIME type for browser environment
     * @param {string} fileName 
     * @returns {string}
     */
    _getBrowserMimeType(fileName) {
        const ext = fileName.split('.').pop()?.toLowerCase();
        const mimeTypes = {
            // Images
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'svg': 'image/svg+xml',
            'bmp': 'image/bmp',
            'ico': 'image/x-icon',
            
            // Documents
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'ppt': 'application/vnd.ms-powerpoint',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'txt': 'text/plain',
            'rtf': 'application/rtf',
            
            // Archives
            'zip': 'application/zip',
            'rar': 'application/vnd.rar',
            '7z': 'application/x-7z-compressed',
            'tar': 'application/x-tar',
            'gz': 'application/gzip',
            
            // Audio
            'mp3': 'audio/mpeg',
            'wav': 'audio/wav',
            'ogg': 'audio/ogg',
            'aac': 'audio/aac',
            'flac': 'audio/flac',
            
            // Video
            'mp4': 'video/mp4',
            'avi': 'video/x-msvideo',
            'mov': 'video/quicktime',
            'wmv': 'video/x-ms-wmv',
            'flv': 'video/x-flv',
            'webm': 'video/webm',
            'mkv': 'video/x-matroska',
            
            // Web
            'html': 'text/html',
            'htm': 'text/html',
            'css': 'text/css',
            'js': 'application/javascript',
            'json': 'application/json',
            'xml': 'application/xml',
            
            // Fonts
            'ttf': 'font/ttf',
            'otf': 'font/otf',
            'woff': 'font/woff',
            'woff2': 'font/woff2',
            'eot': 'application/vnd.ms-fontobject',
        };
        
        return mimeTypes[ext] || 'application/octet-stream';
    }

    /**
     * Mengunggah satu file ke storage.
     * Supports both Node.js file paths and browser File objects
     * @param {string|File} filePathOrFile - File path (Node.js) or File object (Browser)
     * @returns {Promise<{success: boolean, data?: {key: string}, message?: string}>}
     */
    async uploadFile(filePathOrFile) {
        // Handle Node.js environment
        if (isNode && typeof filePathOrFile === 'string') {
            return this._uploadFileNode(filePathOrFile);
        }
        
        // Handle browser environment
        if (isBrowser && (filePathOrFile instanceof File)) {
            return this._uploadFileBrowser(filePathOrFile);
        }
        
        // Handle mixed usage - try to detect what we got
        if (typeof filePathOrFile === 'string') {
            if (isNode) {
                return this._uploadFileNode(filePathOrFile);
            } else {
                return { success: false, message: 'File path tidak didukung di browser. Gunakan File object.' };
            }
        } else if (filePathOrFile instanceof File) {
            return this._uploadFileBrowser(filePathOrFile);
        }
        
        return { success: false, message: 'Parameter tidak valid. Gunakan file path (Node.js) atau File object (Browser).' };
    }

    /**
     * Upload file in Node.js environment
     * @param {string} filePath 
     * @returns {Promise<{success: boolean, data?: {key: string}, message?: string}>}
     */
    async _uploadFileNode(filePath) {
        if (!fs.existsSync(filePath)) {
            return { success: false, message: `File tidak ditemukan: ${filePath}` };
        }

        const stats = fs.statSync(filePath);
        const presignPayload = {
            fileName: path.basename(filePath),
            fileType: mime.lookup(filePath) || 'application/octet-stream',
            fileSize: stats.size,
        };

        const presignResult = await this._requestToService({
            method: 'POST',
            url: `/cdn/upload-url/`,
            data: presignPayload,
        });

        if (!presignResult.success) {
            return presignResult;
        }

        const { url: uploadUrl, key: objectKey } = presignResult.data;

        try {
            const fileStream = fs.createReadStream(filePath);
            await axios.put(uploadUrl, fileStream, {
                headers: {
                    'Content-Type': presignPayload.fileType,
                    'Content-Length': presignPayload.fileSize,
                },
            });

            return {
                success: true,
                message: 'File berhasil diunggah.',
                data: { key: objectKey },
            };
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                return {
                    success: false,
                    message: `Gagal mengunggah ke storage: ${error.response.status} - ${error.response.statusText}`,
                };
            }
            return { success: false, message: `Koneksi ke storage gagal: ${error.message}` };
        }
    }

    /**
     * Upload file in browser environment
     * @param {File} file 
     * @returns {Promise<{success: boolean, data?: {key: string}, message?: string}>}
     */
    async _uploadFileBrowser(file) {
        const presignPayload = {
            fileName: file.name,
            fileType: file.type || this._getBrowserMimeType(file.name),
            fileSize: file.size,
        };

        // Use browser-compatible request method if axios fails
        let presignResult;
        try {
            presignResult = await this._requestToService({
                method: 'POST',
                url: `/cdn/upload-url/`,
                data: presignPayload,
            });
        } catch (error) {
            // Fallback to fetch if axios fails in browser
            presignResult = await this._requestToServiceBrowser({
                method: 'POST',
                url: '/cdn/upload-url/',
                data: presignPayload,
            });
        }

        if (!presignResult.success) {
            return presignResult;
        }

        const { url: uploadUrl, key: objectKey } = presignResult.data;

        try {
            // Use fetch for browser upload (better compatibility)
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': presignPayload.fileType,
                },
            });

            if (!uploadResponse.ok) {
                return {
                    success: false,
                    message: `Gagal mengunggah ke storage: ${uploadResponse.status} - ${uploadResponse.statusText}`,
                };
            }

            return {
                success: true,
                message: 'File berhasil diunggah.',
                data: { key: objectKey },
            };
        } catch (error) {
            return { 
                success: false, 
                message: `Koneksi ke storage gagal: ${error.message}` 
            };
        }
    }

    /**
     * Menghapus file dari storage menggunakan object key-nya.
     * @param {string} objectKey
     * @returns {Promise<{success: boolean, data?: any, message?: string}>}
     */
    async deleteFile(objectKey) {
        if (!objectKey) {
            return { success: false, message: "Object key diperlukan." };
        }
        
        // Try axios first, fallback to fetch in browser
        try {
            return await this._requestToService({
                method: 'DELETE',
                url: `/cdn/delete-object/`,
                data: { key: objectKey },
            });
        } catch (error) {
            if (isBrowser) {
                return await this._requestToServiceBrowser({
                    method: 'DELETE',
                    url: '/cdn/delete-object/',
                    data: { key: objectKey },
                });
            }
            throw error;
        }
    }

    /**
     * Get storage info
     * @returns {Promise<{success: boolean, data?: any, message?: string}>}
     */
    async getStorageInfo() {
        try {
            return await this._requestToService({
                method: 'GET',
                url: `/cdn/storages/${this.storageName}/`,
            });
        } catch (error) {
            if (isBrowser) {
                return await this._requestToServiceBrowser({
                    method: 'GET',
                    url: `/cdn/storages/${this.storageName}/`,
                });
            }
            throw error;
        }
    }

    /**
     * List files in storage
     * @param {Object} options - Options for listing files
     * @param {number} options.limit - Number of files to return
     * @param {string} options.prefix - Prefix filter
     * @returns {Promise<{success: boolean, data?: any, message?: string}>}
     */
    async listFiles(options = {}) {
        const queryParams = new URLSearchParams();
        if (options.limit) queryParams.append('limit', options.limit);
        if (options.prefix) queryParams.append('prefix', options.prefix);
        
        const url = `/cdn/storages/${this.storageName}/files/?${queryParams.toString()}`;
        
        try {
            return await this._requestToService({
                method: 'GET',
                url,
            });
        } catch (error) {
            if (isBrowser) {
                return await this._requestToServiceBrowser({
                    method: 'GET',
                    url,
                });
            }
            throw error;
        }
    }

    /**
     * Upload multiple files (batch upload)
     * @param {Array<string|File>} files - Array of file paths or File objects
     * @param {Object} options - Upload options
     * @param {boolean} options.concurrent - Whether to upload concurrently
     * @param {number} options.maxConcurrent - Maximum concurrent uploads
     * @returns {Promise<Array<{success: boolean, data?: {key: string}, message?: string, fileName: string}>>}
     */
    async uploadMultipleFiles(files, options = { concurrent: true, maxConcurrent: 3 }) {
        if (!Array.isArray(files) || files.length === 0) {
            return [{ success: false, message: 'Array file diperlukan dan tidak boleh kosong.', fileName: '' }];
        }

        if (options.concurrent) {
            // Concurrent upload with limit
            const results = [];
            const maxConcurrent = options.maxConcurrent || 3;
            
            for (let i = 0; i < files.length; i += maxConcurrent) {
                const batch = files.slice(i, i + maxConcurrent);
                const batchPromises = batch.map(async (file) => {
                    const fileName = typeof file === 'string' ? file : file.name;
                    try {
                        const result = await this.uploadFile(file);
                        return { ...result, fileName };
                    } catch (error) {
                        return { 
                            success: false, 
                            message: error.message, 
                            fileName 
                        };
                    }
                });
                
                const batchResults = await Promise.all(batchPromises);
                results.push(...batchResults);
            }
            
            return results;
        } else {
            // Sequential upload
            const results = [];
            for (const file of files) {
                const fileName = typeof file === 'string' ? file : file.name;
                try {
                    const result = await this.uploadFile(file);
                    results.push({ ...result, fileName });
                } catch (error) {
                    results.push({ 
                        success: false, 
                        message: error.message, 
                        fileName 
                    });
                }
            }
            return results;
        }
    }
}