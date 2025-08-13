export default function LockedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center text-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-md max-w-md">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Account Locked</h1>
        <p className="text-gray-700">
          You`&apos;`ve entered incorrect credentials 3 times. For security
          reasons, please contact the <strong>Admin Desk</strong> to reset your
          password.
        </p>
      </div>
    </div>
  );
}
