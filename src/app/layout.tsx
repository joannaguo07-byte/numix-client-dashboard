import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/providers/auth-provider";
import { RouteProvider } from "@/providers/router-provider";
import { Theme } from "@/providers/theme";
import "@/styles/globals.css";
import { cx } from "@/utils/cx";

const inter = Inter({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-inter",
});

export const metadata: Metadata = {
    title: "Numix",
    description: "Numix Client Dashboard",
};

export const viewport: Viewport = {
    themeColor: "#2B53FE",
    colorScheme: "light",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={cx(inter.variable, "bg-primary antialiased")}>
                <AuthProvider>
                    <RouteProvider>
                        <Theme>{children}</Theme>
                    </RouteProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
