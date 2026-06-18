import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <SignUp />
    </main>
  );
}