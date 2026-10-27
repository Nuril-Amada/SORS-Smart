import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { OilTransactionsPage } from '../components/overview/OilTransactions';
import { fetchTransactions, fetchProductNames } from '../services/api';

export default function OilTransactions({ onBack }) {
    const location = useLocation();
    const initialFilters = location?.state ?? null;

    const [transactions, setTransactions] = useState([]);
    const [productNames, setProductNames] = useState([]);

    useEffect(() => {
        fetchProductNames().then((names) => {
            if (names && names.length > 0) setProductNames(names);
        });

        fetchTransactions(initialFilters || {}, 1, 0)
            .then(setTransactions)
            .catch(err => {
                console.error('Gagal memuat data transaksi:', err);
                setTransactions([]);
            });
    }, [initialFilters]);

    return (
        <OilTransactionsPage
            onBack={onBack}
            initialFilters={initialFilters}
            transactions={transactions}
            productNames={productNames}
        />
    );
}