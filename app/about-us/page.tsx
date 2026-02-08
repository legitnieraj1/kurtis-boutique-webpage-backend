import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-background/60 backdrop-blur-sm">
            <Navbar />

            <main>
                {/* Banner */}
                <div className="h-[40vh] bg-secondary/30 flex items-center justify-center">
                    <h1 className="text-4xl md:text-6xl font-serif text-foreground">Our Story</h1>
                </div>

                <div className="container mx-auto px-4 py-16 md:py-24 max-w-4xl space-y-16">
                    <section className="text-center space-y-6">
                        <h2 className="text-3xl font-serif">A Legacy of Elegance</h2>
                        <div className="w-24 h-1 bg-primary mx-auto"></div>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            Kurtis Boutique began with a simple belief: fashion should be an extension of one's heritage, seamlessly woven into the modern lifestyle.
                            Established in Bangalore, we set out to redefine Indian ethnic wear by blending traditional craftsmanship with contemporary silhouettes.
                        </p>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="aspect-square bg-muted rounded-lg relative overflow-hidden">
                            <div className="absolute inset-0 bg-stone-200 animate-pulse-slow" />
                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30 text-xl font-serif">
                                Craftsmanship
                            </div>
                        </div>
                        <div className="space-y-6">
                            <h3 className="text-2xl font-serif">Crafted with Care</h3>
                            <p className="text-muted-foreground">
                                Every piece at Kurtis Boutique is a labor of love. We partner with skilled artisans from across India to source the finest fabrics—be it lustrous silks, breezy cottons, or rich linens. Our commitment to quality ensures that you don't just wear our clothes; you experience them.
                            </p>
                            <p className="text-muted-foreground">
                                From intricate embroidery to hand-block prints, our collections celebrate the diverse artistic traditions of India, tailored for the woman of today.
                            </p>
                        </div>
                    </div>

                    <section className="bg-secondary/20 p-8 md:p-12 rounded-xl text-center space-y-6">
                        <h3 className="text-2xl font-serif">Our Philosophy</h3>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            "Minimal luxury" is at the heart of everything we do. We believe in designs that are understated yet impactful, sophisticated yet accessible. We strive to create a wardrobe that empowers you to express your individuality with grace and confidence.
                        </p>
                        <Link href="/shop">
                            <Button size="lg" className="rounded-full px-8">View Our Collections</Button>
                        </Link>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
