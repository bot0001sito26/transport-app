// src/utils/pdfGenerator.js

import { buildTripSummaryPDF } from './pdf/tripPdf';
import { buildTruckExpensesPDF } from './pdf/expensePdf';

export const generateTripSummaryPDF = async (trip, expenses, kms, totalGastos, formatDateTime) => {
    return await buildTripSummaryPDF(trip, expenses, kms, totalGastos, formatDateTime);
};

export const generateTruckExpensesPDF = async (truck, ledger, filterDate, searchTripId, formatDateTime) => {
    return await buildTruckExpensesPDF(truck, ledger, filterDate, searchTripId, formatDateTime);
};