export function ProfilePage() {
  const data = {
    username: 'demo_user',
    email: 'demo@example.com',
    full_name: 'Demo User',
    is_active: true,
    is_admin: false,
    created_at: new Date(Date.now() - 42 * 864e5).toISOString(),
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <div className="text-sm space-y-1">
        <div><span className="font-medium">Username:</span> {data.username}</div>
        <div><span className="font-medium">Email:</span> {data.email}</div>
        {data.full_name && <div><span className="font-medium">Full name:</span> {data.full_name}</div>}
        <div><span className="font-medium">Active:</span> {data.is_active ? 'Yes' : 'No'}</div>
        {data.is_admin !== undefined && <div><span className="font-medium">Admin:</span> {String(data.is_admin)}</div>}
        <div><span className="font-medium">Joined:</span> {new Date(data.created_at).toLocaleString()}</div>
      </div>
    </div>
  )
}
