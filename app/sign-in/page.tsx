import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <SignIn />
    </main>
  );
}