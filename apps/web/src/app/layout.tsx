import type { Metadata, Viewport } from "next";
import {
  AdminDataProvider,
  AuthProvider,
  BusTrackProvider,
  EnrollmentProvider,
  LeavesProvider,
  SchoolDataProvider,
  StudentEngageProvider,
  TeacherClassProvider,
} from "@/lib/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "SchoolConnect AI — WhatsApp-first School Communication",
  description:
    "Stay connected to your child's school. Teachers, parents and students in one app.",
};

export const viewport: Viewport = {
  themeColor: "#7C5CFC",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Nunito+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <SchoolDataProvider>
            <TeacherClassProvider>
              <StudentEngageProvider>
                <LeavesProvider>
                  <EnrollmentProvider>
                    <BusTrackProvider>
                      <AdminDataProvider>{children}</AdminDataProvider>
                    </BusTrackProvider>
                  </EnrollmentProvider>
                </LeavesProvider>
              </StudentEngageProvider>
            </TeacherClassProvider>
          </SchoolDataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
