"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, LogOut, UserPlus, Key, ShieldAlert, ShieldCheck } from "lucide-react"

export default function InsecureDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ username: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [customers, setCustomers] = useState<any[]>([])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check")
        if (!response.ok) {
          router.push("/insecure/login")
          return
        }

        const data = await response.json()
        setUser(data.user)

        // Fetch customers using insecure endpoint
        fetchCustomers()
      } catch (err) {
        console.error(err)
        router.push("/insecure/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const fetchCustomers = async () => {
    try {
      // Use insecure endpoint
      const response = await fetch("/api/customers")
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/insecure/login")
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    try {
      // Use insecure endpoint
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(`Customer ${customerName} added successfully!`)
        setCustomerName("")
        setCustomerEmail("")
        setCustomerPhone("")
        fetchCustomers()
      } else {
        setError(data.message || "Failed to add customer")
      }
    } catch (err) {
      setError("An error occurred")
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">Communication_LTD</h1>
            <div className="ml-4 flex items-center">
              <ShieldAlert className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-sm font-medium text-red-500">Vulnerable Mode</span>
            </div>
          </div>
          {user && (
            <div className="flex items-center gap-4">
              <p>Welcome, {user.username}</p>
              <Button variant="secondary" size="sm" asChild>
                <Link href="/insecure/change-password">
                  <Key className="h-4 w-4 mr-2" />
                  Change Password
                </Link>
              </Button>
              <Button variant="secondary" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Customer Management</h2>
          <Button asChild variant="outline" className="text-green-500">
            <Link href="/secure/dashboard">
              <ShieldCheck className="h-4 w-4 mr-2" />
              Switch to Secure Mode
            </Link>
          </Button>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Add New Customer</CardTitle>
              <CardDescription>Enter customer details</CardDescription>
            </CardHeader>
            <form onSubmit={handleAddCustomer}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {success && (
                  <Alert className="bg-green-50 text-green-800 border-green-200">
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Enter customer email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Phone</Label>
                  <Input
                    id="customerPhone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Enter customer phone"
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Customer
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer List</CardTitle>
              <CardDescription>Recently added customers</CardDescription>
            </CardHeader>
            <CardContent>
              {customers.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No customers added yet</p>
              ) : (
                <div className="space-y-4">
                  {customers.map((customer, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      {/* Vulnerable rendering - demonstrates XSS */}
                      <div
                        className="font-medium"
                        dangerouslySetInnerHTML={{ __html: customer.name }}
                        style={{ overflow: "hidden" }}
                      />
                      <p className="text-sm text-muted-foreground">Email: {customer.email}</p>
                      <p className="text-sm text-muted-foreground">Phone: {customer.phone}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
