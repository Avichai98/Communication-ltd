import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShieldCheck, ShieldAlert } from "lucide-react"
import { getAppUrl } from "@/lib/config"

export default function Home() {
  // Get the app URL
  const appUrl = getAppUrl()

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-primary text-primary-foreground py-4">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold">Communication_LTD</h1>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">Welcome to Communication_LTD</h2>
          <p className="text-muted-foreground">Your trusted provider of internet browsing packages</p>

          <div className="mt-8 p-6 border rounded-lg bg-card">
            <h3 className="text-xl font-semibold mb-4">Choose Security Mode</h3>
            <p className="mb-6 text-muted-foreground">
              This demonstration shows the difference between secure and vulnerable implementations.
            </p>

            <div className="grid gap-4">
              <Button asChild size="lg" variant="default" className="bg-red-600 hover:bg-red-700">
                <Link href="/insecure/login" className="flex items-center justify-center">
                  <ShieldAlert className="mr-2 h-5 w-5" />
                  Vulnerable Mode
                </Link>
              </Button>

              <Button asChild size="lg" variant="default" className="bg-green-600 hover:bg-green-700">
                <Link href="/secure/login" className="flex items-center justify-center">
                  <ShieldCheck className="mr-2 h-5 w-5" />
                  Secure Mode
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-muted py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Communication_LTD. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
