import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Join RTMS',
  description: 'Sign in or create an account for RTMS',
};

export default function V1Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="v1-auth-root font-sans antialiased">
      {/* 
         Using fixed positioning to break out of any parent constraints (like page containers).
         z-index 50 ensures it sits on top.
      */}
      <div className="fixed inset-0 w-screen h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100 p-4 overflow-y-auto z-50">
        <div className="fixed top-0 left-0 w-full h-screen -z-10 hue-rotate-90 pointer-events-none">
          <iframe src="https://my.spline.design/twistcopy-CPActtgUfoQoOToZfH4Pt18Q" frameBorder="0" width="100%" height="100%" style={{ width: '100%', height: '100%' }}></iframe>
        </div>
        {children}
      </div>
    </div>
  );
}
