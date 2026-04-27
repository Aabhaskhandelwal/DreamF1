"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export default function Login() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Login expects form-encoded data (OAuth2PasswordRequestForm)
    const formData = new URLSearchParams()
    formData.append("username", username)
    formData.append("password", password)

    try {
      const response = await fetch("http://localhost:8080/api/login", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.detail || "Login failed")
        return
      }

      localStorage.setItem("token", data.access_token)
      router.push("/dashboard")
    } catch (err) {
      setError("Could not connect to the server")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center flex flex-col items-center gap-3">
          <Image src="/logo.svg" alt="DreamF1" width={96} height={32} priority />
          <CardDescription>Sign in to lock your predictions</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full">Sign In</Button>
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register" className="text-primary underline">Register</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
