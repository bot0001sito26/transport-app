// src/utils/pdfGenerator.js

import { buildTripSummaryPDF } from './pdf/tripPdf';
import { buildTruckExpensesPDF } from './pdf/expensePdf';
import { buildBitacoraPDF } from './pdf/bitacoraPdf';
import { buildFinanzasPDF } from './pdf/finanzasPdf';

export const generateTripSummaryPDF = async (trip, expenses, kms, totalGastos, formatDateTime) => {
    return await buildTripSummaryPDF(trip, expenses, kms, totalGastos, formatDateTime);
};

export const generateTruckExpensesPDF = async (truck, ledger, filterDate, searchTripId, formatDateTime) => {
    return await buildTruckExpensesPDF(truck, ledger, filterDate, searchTripId, formatDateTime);
};

export const generateBitacoraPDF = async (notes, trucks, hasActiveFilters, startDate, endDate, truckIdFilter) => {
    return await buildBitacoraPDF(notes, trucks, hasActiveFilters, startDate, endDate, truckIdFilter);
};

export const generateFinanzasPDF = async (metrics, startDate, endDate) => {
    return await buildFinanzasPDF(metrics, startDate, endDate);
};