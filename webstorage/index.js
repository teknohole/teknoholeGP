import axios from 'axios';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';

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
                ...config,
                headers: this._getServiceHeaders(),
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
     * Mengunggah satu file ke storage.
     * @param {string} filePath
     * @returns {Promise<{success: boolean, data?: {key: string}, message?: string}>}
     */
    async uploadFile(filePath) {
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
            url: `${this.serviceUrl}/cdn/upload-url/`,
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
     * Menghapus file dari storage menggunakan object key-nya.
     * @param {string} objectKey
     * @returns {Promise<{success: boolean, data?: any, message?: string}>}
     */
    async deleteFile(objectKey) {
        if (!objectKey) {
            return { success: false, message: "Object key diperlukan." };
        }
        
        return this._requestToService({
            method: 'DELETE',
            url: `${this.serviceUrl}/cdn/delete-object/`,
            data: { key: objectKey },
        });
    }
}