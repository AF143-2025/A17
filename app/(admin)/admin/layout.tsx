import React from 'react';
import AdminShell from '@/components/AdminShell';
import { requireAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let adminUser;
  try {
    adminUser = await requireAdmin();
  } catch {
    redirect('/admin/login');
  }

  return (
    <AdminShell
      adminUser={{
        id: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        role: adminUser.role,
      }}
    >
      {children}
    </AdminShell>
  );
}
