import { redirect } from "next/navigation"
import { isSuperAdmin } from "@/lib/auth"
import { listUsersAction } from "@/app/user-actions"
import { UsersManagement } from "@/components/users-management"

export default async function UsersPage() {
  const isSuper = await isSuperAdmin()

  if (!isSuper) {
    redirect("/admin")
  }

  const result = await listUsersAction()

  return <UsersManagement users={result.users} />
}
