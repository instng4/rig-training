import { SignIn } from '@clerk/nextjs';

// Force dynamic rendering to handle SSO callbacks
export const dynamic = 'force-dynamic';

export default function SignInPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--primary-50) 0%, var(--background) 100%)',
      padding: '2rem',
    }}>
      <SignIn 
        appearance={{
          elements: {
            rootBox: {
              boxShadow: 'var(--shadow-lg)',
              borderRadius: 'var(--radius-xl)',
            },
          },
        }}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
      />
    </div>
  );
}
