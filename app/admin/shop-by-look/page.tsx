import { LookList } from "@/components/admin/LookList";

export const metadata = {
    title: "Shop By Look | Admin",
    description: "Manage shoppable Instagram reels",
};

export default function ShopByLookPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Shop By Look</h2>
            </div>
            <p className="text-sm text-muted-foreground">
                Each look pairs an Instagram reel with a product. Looks appear on the homepage between
                &quot;Find your occasion&quot; and &quot;New Arrivals&quot;.
            </p>
            <div className="h-full flex-1 flex-col space-y-8 flex">
                <LookList />
            </div>
        </div>
    );
}
