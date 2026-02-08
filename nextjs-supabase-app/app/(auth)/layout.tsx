export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            {/* Left side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 gradient-bg items-center justify-center p-12">
                <div className="max-w-md text-center">
                    <div className="mx-auto h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-8" />
                    <h1 className="text-4xl font-bold text-white mb-4">ProjectHub</h1>
                    <p className="text-lg text-white/80">
                        Manage your projects efficiently with our powerful platform built on modern technologies.
                    </p>
                </div>
            </div>

            {/* Right side - Auth forms */}
            <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
                <div className="w-full max-w-md">
                    {children}
                </div>
            </div>
        </div>
    );
}
