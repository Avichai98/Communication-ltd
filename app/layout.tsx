import type React from "react"
import ClientLayout from "./ClientLayout"
import { DbInitializer } from "./db-init"

export const metadata = {
  title: "Communication_LTD",
  description: "Internet Service Provider",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      {/* This will run only on the server */}
      <DbInitializer />
      <ClientLayout>{children}</ClientLayout>
    </>
  )
}


import './globals.css'