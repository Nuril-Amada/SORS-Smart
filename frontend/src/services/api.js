import api from './axios';

// GET /products/names — daftar nama produk unik dari tabel product (untuk dropdown filter)
export async function fetchProductNames() {
    try {
        const res = await api.get('/products/names');
        return res.data?.data || [];
    } catch (e) {
        console.error('Error fetchProductNames:', e);
        return [];
    }
}

// ---- USER MANAGEMENT API ----
export async function fetchUsers() {
    try {
        const res = await api.get('/users');
        return res.data?.data || [];
    } catch (e) {
        console.error('Error fetchUsers:', e);
        return [];
    }
}

export async function createUser(userData) {
    try {
        const res = await api.post('/users', userData);
        if (!res.data?.success) throw new Error(res.data?.message || 'Gagal menambahkan user baru.');
        return res.data;
    } catch (e) {
        console.error('Error createUser:', e);
        throw e;
    }
}

export async function updateUserRole(id, role, fullName) {
    try {
        const res = await api.put(`/users/${id}`, { role, full_name: fullName });
        if (!res.data?.success) throw new Error(res.data?.message || 'Gagal memperbarui role user.');
        return res.data;
    } catch (e) {
        console.error('Error updateUserRole:', e);
        throw e;
    }
}

export async function updateUserPassword(id, password) {
    try {
        const res = await api.put(`/users/${id}/password`, { password });
        if (!res.data?.success) throw new Error(res.data?.message || 'Gagal mengubah password user.');
        return res.data;
    } catch (e) {
        console.error('Error updateUserPassword:', e);
        throw e;
    }
}

export async function deleteUser(id) {
    try {
        const res = await api.delete(`/users/${id}`);
        if (!res.data?.success) throw new Error(res.data?.message || 'Gagal menghapus user.');
        return res.data;
    } catch (e) {
        console.error('Error deleteUser:', e);
        throw e;
    }
}


export async function fetchKpi(filters = {}) {
    try {
        const params = {};
        if (filters.dateFrom) params.dateFrom = filters.dateFrom;
        if (filters.dateTo) params.dateTo = filters.dateTo;
        if (filters.product && filters.product !== 'Semua Produk') params.product = filters.product;
        if (filters.cluster && filters.cluster !== 'Semua Cluster') params.cluster = filters.cluster;

        const res = await api.get('/dashboard/kpi', { params });
        return res.data?.data || {};
    } catch (e) {
        console.error('Error fetchKpi:', e);
        return {};
    }
}

export async function fetchDailyTrend(filters = {}) {
    try {
        const params = {};
        if (filters.dateFrom) params.dateFrom = filters.dateFrom;
        if (filters.dateTo) params.dateTo = filters.dateTo;
        if (filters.product && filters.product !== 'Semua Produk') params.product = filters.product;
        if (filters.cluster && filters.cluster !== 'Semua Cluster') params.cluster = filters.cluster;

        const res = await api.get('/dashboard/daily-trend', { params });
        return res.data?.data || [];
    } catch (e) {
        console.error('Error fetchDailyTrend:', e);
        return [];
    }
}

export async function fetchGainLossTrend(filters = {}) {
    try {
        const params = {};
        if (filters.dateFrom) params.dateFrom = filters.dateFrom;
        if (filters.dateTo) params.dateTo = filters.dateTo;
        if (filters.product && filters.product !== 'Semua Produk') params.product = filters.product;
        if (filters.cluster && filters.cluster !== 'Semua Cluster') params.cluster = filters.cluster;

        const res = await api.get('/dashboard/gain-loss', { params });
        return res.data?.data || [];
    } catch (e) {
        console.error('Error fetchGainLossTrend:', e);
        return [];
    }
}

export async function fetchStockDistribution(filters = {}) {
    try {
        const params = {};
        if (filters.dateFrom) params.dateFrom = filters.dateFrom;
        if (filters.dateTo) params.dateTo = filters.dateTo;
        if (filters.product && filters.product !== 'Semua Produk') params.product = filters.product;
        if (filters.cluster && filters.cluster !== 'Semua Cluster') params.cluster = filters.cluster;

        const res = await api.get('/dashboard/stock-distribution', { params });
        return res.data?.data || { product: [], cluster: [], tank: [] };
    } catch (e) {
        console.error('Error fetchStockDistribution:', e);
        return { product: [], cluster: [], tank: [] };
    }
}

export async function fetchTransactionByUnit(filters = {}) {
    try {
        const params = {};
        if (filters.dateFrom) params.dateFrom = filters.dateFrom;
        if (filters.dateTo) params.dateTo = filters.dateTo;
        if (filters.product && filters.product !== 'Semua Produk') params.product = filters.product;
        if (filters.cluster && filters.cluster !== 'Semua Cluster') params.cluster = filters.cluster;

        const res = await api.get('/dashboard/transaction-by-unit', { params });
        return res.data?.data || { unit: [], cluster: [], tank: [] };
    } catch (e) {
        console.error('Error fetchTransactionByUnit:', e);
        return { unit: [], cluster: [], tank: [] };
    }
}

export async function fetchTransactions(filters = {}, page = 1, limit = 0) {
    try {
        const params = { page, limit };
        if (filters.dateFrom) params.dateFrom = filters.dateFrom;
        if (filters.dateTo) params.dateTo = filters.dateTo;
        if (filters.product && filters.product !== 'Semua Produk') params.product = filters.product;
        if (filters.cluster && filters.cluster !== 'Semua Cluster') params.cluster = filters.cluster;
        if (filters.tankSearch) params.tankSearch = filters.tankSearch;

        const res = await api.get('/transactions', { params });
        return res.data?.data?.items || [];
    } catch (e) {
        console.error('Error fetchTransactions:', e);
        return [];
    }
}

export async function deleteTransactions(filters = {}) {
    try {
        const res = await api.delete('/data/transactions', { data: filters });
        if (!res.data?.success) throw new Error(res.data?.message || 'Gagal menghapus data.');
        return res.data?.message || 'Data berhasil dihapus.';
    } catch (e) {
        console.error('Error deleteTransactions:', e);
        throw e;
    }
}

export async function uploadImportFile(file) {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await api.post('/import/transactions', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
        if (!res.data?.success) throw new Error(res.data?.message || 'Gagal mengimpor file.');
        return res.data?.message || `Dokumen "${file.name}" berhasil diimpor.`;
    } catch (e) {
        console.error('Error uploadImportFile:', e);
        throw e;
    }
}

export function getExportCsvUrl(filters = {}) {
    const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';
    const params = new URLSearchParams();
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.product && filters.product !== 'Semua Produk') params.append('product', filters.product);
    if (filters.cluster && filters.cluster !== 'Semua Cluster') params.append('cluster', filters.cluster);

    return `${baseURL}/export/csv?${params.toString()}`;
}

export async function fetchExportPdfData(filters = {}) {
    try {
        const params = {};
        if (filters.dateFrom) params.dateFrom = filters.dateFrom;
        if (filters.dateTo) params.dateTo = filters.dateTo;
        if (filters.product && filters.product !== 'Semua Produk') params.product = filters.product;
        if (filters.cluster && filters.cluster !== 'Semua Cluster') params.cluster = filters.cluster;

        const res = await api.get('/export/pdf-data', { params });
        return res.data;
    } catch (e) {
        console.error('Error fetchExportPdfData:', e);
        return { success: false, message: e.message };
    }
}

export async function loginUser(username, password) {
    try {
        const res = await api.post('/auth/login', { username, password });
        return res.data;
    } catch (e) {
        console.error('Error loginUser:', e);
        return e.response?.data || { success: false, message: e.message };
    }
}

export async function registerUser(fullName, username, password, confirmPassword) {
    try {
        const res = await api.post('/auth/register', {
            full_name: fullName,
            username,
            password,
            confirm_password: confirmPassword
        });
        return res.data;
    } catch (e) {
        console.error('Error registerUser:', e);
        return e.response?.data || { success: false, message: e.message };
    }
}

