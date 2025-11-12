"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Trash2 } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import type { User, Role } from "@/lib/types"

interface UserManagementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  users: User[]
  roles: Role[]
  onSuccess?: () => void
}

export function UserManagementModal({ open, onOpenChange, users, roles, onSuccess }: UserManagementModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRoleId, setSelectedRoleId] = useState<string>("")

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return

    setIsLoading(true)
    try {
      await apiClient.deleteUser(userId)
      onSuccess?.()
    } catch (error) {
      console.error("Failed to delete user:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>User Management</DialogTitle>
          <DialogDescription>Manage system users and their roles</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="w-10">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.role.name}</Badge>
                  </TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteUser(user.id)} disabled={isLoading}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
