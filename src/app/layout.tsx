import type { Metadata } from "next";
import { after } from "next/server";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { ensureDeadlineNotificationsForUser } from "@/lib/notifications";
import { AppHeader } from "@/components/AppHeader";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nord Flow — Tasks",
  description: "Nord Flow — система управления задачами и проектами",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  let unread = 0;
  if (user) {
    after(() => ensureDeadlineNotificationsForUser(user.id).catch(() => {}));
    unread = await prisma.notification.count({ where: { userId: user.id, read: false } });
  }
  const theme = user?.theme === "dark" ? "dark" : "light";

  return (
    <html lang="ru" className={theme}>
      <body className={`${inter.variable} ${montserrat.variable} min-h-screen bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100`}>
        {user ? <AppHeader user={{ firstName: user.firstName, lastName: user.lastName, role: user.role }} unread={unread} /> : null}
        <div className="mx-auto max-w-6xl p-4 sm:p-6">{children}</div>
      </body>
    </html>
  );
}
