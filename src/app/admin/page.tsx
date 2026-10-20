import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Administrator dashboard</h1>
      <Link
        href="/admin/accounts"
        className="inline-flex rounded-md bg-black px-4 py-2 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Manage accounts
      </Link>
    </div>
  );
}
