import axios from 'axios';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import WebStorageBase from './common.js';

/**
 * WebStorage implementation for Node.js environment
 */
export default class WebStorageNode extends WebStorageBase {
    /**
     * Mengunggah satu file ke storage (Node.js implementation)
     * @param {string} filePath - Path to file
     * @returns {Promise<{success: boolean, data?: {key: string}, message?: string}>}
     */
    async uploadFile(filePath) {
        if (typeof filePath !== 'string') {
            return { 
                success: false, 
                message: 'Parameter harus berupa string (file path) di environment Node.js.' 
            };
        }

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
}