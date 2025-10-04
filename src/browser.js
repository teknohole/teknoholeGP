import WebStorageBase from './common.js';

/**
 * WebStorage implementation for Browser environment
 */
export default class WebStorageBrowser extends WebStorageBase {
    /**
     * Mengunggah satu file ke storage (Browser implementation)
     * @param {File} file - File object from browser
     * @returns {Promise<{success: boolean, data?: {key: string}, message?: string}>}
     */
    async uploadFile(file) {
        if (!(file instanceof File)) {
            return { 
                success: false, 
                message: 'Parameter harus berupa File object di environment Browser.' 
            };
        }

        const presignPayload = {
            fileName: file.name,
            fileType: file.type || this._getBrowserMimeType(file.name),
            fileSize: file.size,
        };

        // Use browser-compatible request method
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
     * Override deleteFile untuk menggunakan fallback fetch
     * @param {string} objectKey
     * @returns {Promise<{success: boolean, data?: any, message?: string}>}
     */
    async deleteFile(objectKey) {
        if (!objectKey) {
            return { success: false, message: "Object key diperlukan." };
        }
        
        try {
            return await this._requestToService({
                method: 'DELETE',
                url: `/cdn/delete-object/`,
                data: { key: objectKey },
            });
        } catch (error) {
            return await this._requestToServiceBrowser({
                method: 'DELETE',
                url: '/cdn/delete-object/',
                data: { key: objectKey },
            });
        }
    }

    /**
     * Override getStorageInfo untuk menggunakan fallback fetch
     * @returns {Promise<{success: boolean, data?: any, message?: string}>}
     */
    async getStorageInfo() {
        try {
            return await this._requestToService({
                method: 'GET',
                url: `/cdn/storages/${this.storageName}/`,
            });
        } catch (error) {
            return await this._requestToServiceBrowser({
                method: 'GET',
                url: `/cdn/storages/${this.storageName}/`,
            });
        }
    }

    /**
     * Override listFiles untuk menggunakan fallback fetch
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
            return await this._requestToServiceBrowser({
                method: 'GET',
                url,
            });
        }
    }
}