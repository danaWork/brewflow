'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getPastOrdersAction } from '@/app/actions/orders';
import { ReceiptText, Printer, Download, ChevronLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import { buildReceiptEscPosFromOrder } from '@/lib/receipt-thermal';
import { connectAndPrint } from '@/lib/bluetooth-thermal-print';

const formatCurrency = (val: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val);

export default function ReceiptsClient({ branchId }: { branchId: string }) {
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [receiptModal, setReceiptModal] = useState<any>(null);

    const LIMIT = 15;

    useEffect(() => {
        let isMounted = true;
        const fetchOrders = async () => {
            setIsLoading(true);
            try {
                const res = await getPastOrdersAction(branchId, { page, limit: LIMIT });
                if (res.success && isMounted) {
                    setOrders(res.orders || []);
                    setTotalCount(res.totalCount || 0);
                } else if (!res.success) {
                    toast.error(res.error || 'Failed to fetch receipts');
                }
            } catch (err) {
                console.error(err);
                if (isMounted) toast.error('An error occurred.');
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchOrders();
        return () => { isMounted = false; };
    }, [branchId, page]);

    const totalPages = Math.ceil(totalCount / LIMIT);

    const storeName = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_RECEIPT_STORE_NAME
        ? process.env.NEXT_PUBLIC_RECEIPT_STORE_NAME
        : 'BrewFlow';

    async function handleBluetoothPrint() {
        if (!receiptModal) return;
        const bytes = buildReceiptEscPosFromOrder(receiptModal, { storeName });
        const result = await connectAndPrint(bytes);
        if (result.ok) {
            toast.success('Receipt sent to printer');
        } else {
            if (result.reason === 'unsupported') {
                toast.info('Bluetooth printing requires Chrome or Edge.');
            } else if (result.reason === 'cancelled') {
                toast.info('Printer selection cancelled.');
            } else {
                toast.warning('Could not print receipt.');
            }
        }
    }

    function handleSaveToPDF() {
        window.print();
    }

    return (
        <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-gray-50/50 print:bg-white print:p-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 print:hidden">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <ReceiptText className="text-[#D95D1E]" />
                        Order Receipts
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">View, reprint, and export previous completed order receipts.</p>
                </div>
            </div>

            {/* Table wrapper */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden print:hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64 text-gray-400">Loading receipts...</div>
                    ) : orders.length === 0 ? (
                        <div className="flex flex-col justify-center items-center h-64 text-gray-400 gap-2">
                            <ReceiptText size={48} className="opacity-20 mb-2" />
                            <p>No completed or cancelled orders found.</p>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y text-left divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order #</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Table</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {orders.map((order) => {
                                    const rawTimestamp = order.completedAt || order.createdAt;
                                    const orderDate = new Date(rawTimestamp);
                                    
                                    return (
                                        <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                                #{order.orderNumber}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {orderDate.toLocaleDateString()} {orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className="bg-gray-100 px-2 py-1 rounded text-gray-700 font-medium">{order.tableNumber}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {order.status === 'COMPLETED' ? (
                                                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-100">
                                                        <CheckCircle size={12} />
                                                        Completed
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2.5 py-1 rounded-full text-xs font-bold border border-red-100">
                                                        <XCircle size={12} />
                                                        Cancelled
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[#D95D1E]">
                                                {formatCurrency(order.totalAmount)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                                <button
                                                    onClick={() => setReceiptModal({
                                                        ...order,
                                                        timestamp: orderDate,
                                                        total: order.totalAmount, // Map UI expectation
                                                    })}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors"
                                                >
                                                    <ReceiptText size={14} /> View Receipt
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination Controls */}
                {!isLoading && totalCount > LIMIT && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                        <span className="text-sm text-gray-500">
                            Showing <span className="font-semibold text-gray-900">{(page - 1) * LIMIT + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(page * LIMIT, totalCount)}</span> of <span className="font-semibold text-gray-900">{totalCount}</span> orders
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Receipt Modal & Printable Area */}
            {receiptModal && (
                <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 print:static print:bg-transparent print:block print:p-0">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 print:shadow-none print:max-w-none print:p-0 print:border-none">
                        
                        {/* Receipt Header */}
                        <div className="bg-gray-50 border-b border-gray-100 p-6 text-center print:bg-white print:border-none print:p-2">
                            <h3 className="text-xl font-black text-gray-900 mb-1">{storeName}</h3>
                            <p className="text-sm text-gray-500 font-medium tracking-wide">RECEIPT / POINT OF SALE</p>
                        </div>
                        
                        {/* Receipt Body */}
                        <div className="p-6 bg-white space-y-5 flex-1 overflow-y-auto max-h-[60vh] custom-scrollbar print:overflow-visible print:max-h-none print:p-2">
                            <div className="flex justify-between items-center text-sm font-semibold text-gray-700 pb-4 border-b border-dashed border-gray-200">
                                <span>Order #{receiptModal.orderNumber}</span>
                                <span>{receiptModal.timestamp.toLocaleDateString()} {receiptModal.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            
                            <div className="space-y-3">
                                {receiptModal.items.map((item: any, idx: number) => (
                                    <div key={idx} className="text-sm">
                                        <div className="flex justify-between items-start font-medium text-gray-900">
                                            <span className="flex-1 pr-2">{item.quantity} x {item.name}</span>
                                            <span>{formatCurrency(item.price * item.quantity)}</span>
                                        </div>
                                        {/* Modifiers / Options */}
                                        {item.options && Object.keys(item.options).length > 0 && (
                                            <div className="pl-4 mt-1 text-xs text-gray-500 space-y-0.5">
                                                {Object.entries(item.options).map(([key, val]) => {
                                                    if (key === 'tag' || key === 'bundleLabel' || key === '__optionIds' || key === 'itemDiscount') return null;
                                                    return <div key={key}>- {key}: {String(val)}</div>;
                                                })}
                                                {item.options.itemDiscount?.label ? <div>- Discount: {String(item.options.itemDiscount.label)}</div> : null}
                                                {item.options.tag ? <div>- Tag: {String(item.options.tag)}</div> : null}
                                                {item.options.bundleLabel ? <div>- Bundle: {String(item.options.bundleLabel)}</div> : null}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            <div className="pt-4 border-t border-dashed border-gray-200 space-y-1.5">
                                {receiptModal.discountAmount ? (
                                    <>
                                        <div className="flex justify-between text-sm text-gray-600 font-medium">
                                            <span>Subtotal</span>
                                            <span>{formatCurrency(receiptModal.total + receiptModal.discountAmount)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-green-600 font-medium">
                                            <span>Discount ({receiptModal.discountName || 'Manual'})</span>
                                            <span>-{formatCurrency(receiptModal.discountAmount)}</span>
                                        </div>
                                    </>
                                ) : null}
                                {receiptModal.note ? (
                                    <div className="pb-3 border-b border-dashed border-gray-200 mb-3 text-xs text-gray-600">
                                        <strong>Note:</strong> {receiptModal.note}
                                    </div>
                                ): null}
                                <div className="flex justify-between items-center text-lg font-black text-gray-900 pt-2">
                                    <span>Total</span>
                                    <span>{formatCurrency(receiptModal.total)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-semibold text-gray-500 uppercase tracking-widest pt-2">
                                    <span>Payment</span>
                                    <span>{receiptModal.paymentMethod}</span>
                                </div>
                            </div>
                        </div>

                        {/* Modal Actions (Hidden from Print) */}
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row gap-3 print:hidden">
                            <button
                                onClick={() => setReceiptModal(null)}
                                className="flex-1 order-3 md:order-1 py-3 px-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={handleSaveToPDF}
                                className="flex-1 order-2 py-3 px-4 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                            >
                                <Download size={18} />
                                PDF
                            </button>
                            <button
                                onClick={handleBluetoothPrint}
                                className="flex-1 order-1 py-3 px-4 bg-[#D95D1E] hover:bg-[#c25016] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                            >
                                <Printer size={18} />
                                Print
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
