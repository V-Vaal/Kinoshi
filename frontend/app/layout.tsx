import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import RainbowKitAndWagmiProvider from '@/components/RainbowKitAndWagmiProvider'
import Layout from '@/components/shared/Layout'
import { Toaster } from '@/components/ui/sonner'
import { ContextProvider } from '@/context/ContextProvider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Kinoshi',
  description:
    'Investissez simplement : des actifs réels et choisis pour un placement réfléchi.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
        suppressHydrationWarning={true}
      >
        <RainbowKitAndWagmiProvider>
          <ContextProvider>
            <Layout>{children}</Layout>
          </ContextProvider>
        </RainbowKitAndWagmiProvider>
        <Toaster />
      </body>
    </html>
  )
}
