"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Mail, MapPin, Phone } from "lucide-react";

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-background/60 backdrop-blur-sm">
            <Navbar />

            <main className="container mx-auto px-4 py-12 md:py-20">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl md:text-5xl font-serif text-center mb-4">Get in Touch</h1>
                    <p className="text-muted-foreground text-center mb-12 max-w-lg mx-auto">
                        We'd love to hear from you. Whether you have a question about our collections, need assistance with an order, or just want to say hello.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Contact Info */}
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-xl font-serif font-medium mb-4">Contact Information</h3>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <MapPin className="w-5 h-5 text-primary mt-1" />
                                        <p className="text-muted-foreground">
                                            123 Fashion Street, <br />
                                            Indiranagar, Bangalore - 560038 <br />
                                            India
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Phone className="w-5 h-5 text-primary" />
                                        <p className="text-muted-foreground">+91 9787635982</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Mail className="w-5 h-5 text-primary" />
                                        <p className="text-muted-foreground">hello@kurtisboutique.com</p>
                                    </div>

                                    {/* Socials */}
                                    <div className="flex gap-4 pt-2">
                                        <a href="https://www.instagram.com/kurtis.boutique/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-pink-600 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
                                            <span className="text-sm">Instagram</span>
                                        </a>
                                        <a href="https://wa.me/919787635982" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-green-500 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                            <span className="text-sm">WhatsApp</span>
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-secondary/20 p-6 rounded-lg">
                                <h4 className="font-medium mb-2">Store Hours</h4>
                                <div className="space-y-1 text-sm text-muted-foreground">
                                    <div className="flex justify-between"><span>Monday - Saturday</span> <span>10:30 AM - 8:30 PM</span></div>
                                    <div className="flex justify-between"><span>Sunday</span> <span>11:00 AM - 7:00 PM</span></div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <form className="space-y-4 bg-background border border-border p-6 rounded-lg shadow-sm" onSubmit={(e) => e.preventDefault()}>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">First Name</label>
                                    <input type="text" className="w-full px-3 py-2 border rounded-md" placeholder="Enter your first name" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Last Name</label>
                                    <input type="text" className="w-full px-3 py-2 border rounded-md" placeholder="Enter your last name" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <input type="email" className="w-full px-3 py-2 border rounded-md" placeholder="Enter your email address" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Subject</label>
                                <select className="w-full px-3 py-2 border rounded-md bg-background">
                                    <option>Order Inquiry</option>
                                    <option>Product Information</option>
                                    <option>Returns & Exchanges</option>
                                    <option>Other</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Message</label>
                                <textarea className="w-full px-3 py-2 border rounded-md min-h-[120px]" placeholder="Enter your message" />
                            </div>

                            <Button type="submit" className="w-full">Send Message</Button>
                        </form>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
