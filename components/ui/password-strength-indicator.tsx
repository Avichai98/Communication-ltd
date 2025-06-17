"use client"

import { useState, useEffect } from "react"
import { Check, X } from "lucide-react"

interface PasswordStrengthIndicatorProps {
  password: string
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const [checks, setChecks] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  })

  useEffect(() => {
    setChecks({
      length: password.length >= 10,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    })
  }, [password])

  const renderCheck = (label: string, passed: boolean) => (
    <div className="flex items-center gap-2 text-sm">
      {passed ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-gray-400" />}
      <span className={passed ? "text-green-600" : "text-gray-600"}>{label}</span>
    </div>
  )

  return (
    <div className="mt-2 space-y-1">
      {renderCheck("At least 10 characters long", checks.length)}
      {renderCheck("Contains uppercase letter", checks.uppercase)}
      {renderCheck("Contains lowercase letter", checks.lowercase)}
      {renderCheck("Contains number", checks.number)}
      {renderCheck("Contains special character", checks.special)}
    </div>
  )
}
