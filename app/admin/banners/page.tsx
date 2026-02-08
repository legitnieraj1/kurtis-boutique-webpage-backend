import { BannerList } from "@/components/admin/BannerList";

export const metadata = {
    title: "Banner Management | Admin",
    description: "Manage hero carousel banners",
};

export default function BannersPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Banner Management</h2>
            </div>
            <div className="h-full flex-1 flex-col space-y-8 flex">
                <BannerList />
            </div>
        </div>
    );
}
