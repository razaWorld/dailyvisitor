export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center text-center px-4">
      <div>
        <h1 className="text-3xl font-bold mb-2">403 — Not Authorized</h1>
        <p className="text-zinc-500">You don&apos;t have access to this section.</p>
        <a href="/" className="text-blue-600 hover:underline mt-4 inline-block">Go home</a>
      </div>
    </div>
  );
}
