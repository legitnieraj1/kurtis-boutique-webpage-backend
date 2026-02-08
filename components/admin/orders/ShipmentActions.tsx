
import { useState } from 'react';
import { useShippingStore } from '@/lib/shippingStore';
import { Button } from '@/components/ui/button';
import { Package, Printer, FileText, Loader2, Truck } from 'lucide-react';
import { AdminOrder } from '@/data/orders';

export function ShipmentActions({ order }: { order: AdminOrder }) {
    const { createShipment, generateAWB, assignCourier, requestPickup, isLoading } = useShippingStore();
    const [pickupDate, setPickupDate] = useState('');

    const COURIERS = ["Delhivery", "Bluedart", "XpressBees"];

    if (!order.shipment.created) {
        return (
            <div className="bg-muted/10 p-4 rounded-lg border border-border">
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-background rounded border border-border">
                        <Truck className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">Create Shipment</h3>
                        <p className="text-xs text-muted-foreground">Prepare this order for shipping assignment.</p>
                    </div>
                </div>
                <Button onClick={() => createShipment(order.id)} disabled={isLoading} className="w-full">
                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Package className="w-4 h-4 mr-2" />}
                    Create Shipment
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Courier Assignment */}
            <div className="p-4 bg-muted/10 rounded-lg border border-border">
                <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
                    1. Courier Assignment
                </h3>
                <div className="flex gap-2">
                    <select
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={order.shipment.courier || ''}
                        onChange={(e) => assignCourier(order.id, e.target.value)}
                        disabled={!!order.shipment.awb || isLoading}
                    >
                        <option value="">Select Courier...</option>
                        {COURIERS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            {/* AWB Generation */}
            <div className={`p-4 rounded-lg border border-border ${order.shipment.courier ? 'bg-muted/10' : 'bg-muted/5 opacity-50'}`}>
                <h3 className="font-semibold mb-3 text-sm">2. AWB Generation</h3>
                {order.shipment.courier ? (
                    !order.shipment.awb ? (
                        <Button onClick={() => generateAWB(order.id)} disabled={isLoading} className="w-full">
                            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Generate AWB"}
                        </Button>
                    ) : (
                        <div className="bg-green-50 text-green-700 p-3 rounded border border-green-200 text-sm font-mono text-center">
                            AWB: {order.shipment.awb}
                        </div>
                    )
                ) : (
                    <p className="text-xs text-muted-foreground">Select a courier to proceed.</p>
                )}
            </div>

            {/* Pickup Request */}
            {order.shipment.awb && (
                <div className={`p-4 rounded-lg border border-border ${!order.shipment.pickupScheduled ? 'bg-muted/10' : 'bg-green-50/50'}`}>
                    <h3 className="font-semibold mb-3 text-sm">3. Schedule Pickup</h3>
                    {!order.shipment.pickupScheduled ? (
                        <div className="flex gap-2">
                            <input
                                type="date"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={pickupDate}
                                onChange={(e) => setPickupDate(e.target.value)}
                            />
                            <Button onClick={() => requestPickup(order.id, pickupDate)} disabled={!pickupDate || isLoading}>
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Request"}
                            </Button>
                        </div>
                    ) : (
                        <div className="text-sm text-green-700 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Pickup scheduled for {order.shipment.pickupDate}
                        </div>
                    )}
                </div>
            )}

            {/* Downloads */}
            {order.shipment.pickupScheduled && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button variant="outline" className="w-full" onClick={() => window.open(order.shipment.labelUrl!, '_blank')}>
                        <Printer className="w-4 h-4 mr-2" /> Label
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => window.open(order.shipment.invoiceUrl!, '_blank')}>
                        <FileText className="w-4 h-4 mr-2" /> Invoice
                    </Button>
                </div>
            )}
        </div>
    );
}

// Helper icon import
import { CheckCircle2 } from "lucide-react";
