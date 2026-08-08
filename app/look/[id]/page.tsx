import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { LookViewer } from "@/components/home/LookViewer";
import { createSupabasePublic } from "@/lib/supabase/server";
import { LOOK_FIELDS, lookThumbnail, type Look } from "@/lib/shopByLook";

// ISR: looks change rarely; re-generate in the background every 10 minutes.
export const revalidate = 600;

async function getLooks(): Promise<Look[]> {
    const supabase = createSupabasePublic();
    const { data } = await supabase
        .from("shop_by_look")
        .select(LOOK_FIELDS)
        .eq("is_active", true)
        .order("display_order");
    return (data || []) as unknown as Look[];
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;
    const looks = await getLooks();
    const look = looks.find((l) => l.id === id);

    if (!look) return { title: "Look Not Found" };

    const name = look.title || look.product?.name || "Shop the look";
    const thumb = lookThumbnail(look);

    return {
        title: `${name} | Shop the Look | Kurtis Boutique India`,
        description:
            look.description ||
            look.product?.description?.slice(0, 155) ||
            `Watch the reel and shop ${name} online at Kurtis Boutique India.`,
        openGraph: thumb ? { images: [{ url: thumb }] } : undefined,
    };
}

export default async function LookPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const looks = await getLooks();
    const index = looks.findIndex((l) => l.id === id);

    if (index === -1) notFound();

    return (
        <div className="min-h-screen font-sans">
            <AnnouncementBar />
            <Navbar />
            <main>
                <LookViewer
                    look={looks[index]}
                    prevId={index > 0 ? looks[index - 1].id : null}
                    nextId={index < looks.length - 1 ? looks[index + 1].id : null}
                />
            </main>
            <Footer />
        </div>
    );
}
