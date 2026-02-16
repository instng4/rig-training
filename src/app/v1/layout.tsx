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
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --vsc-domain: "";
        }
        .v1-auth-root {
          font-family: 'Inter', sans-serif;
        }
        .v1-auth-root .font-geist { font-family: 'Geist', sans-serif !important; }
        .v1-auth-root .font-space-grotesk { font-family: 'Space Grotesk', sans-serif !important; }
        
        @keyframes fadeUp {
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideRight {
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes blurIn {
          to { filter: blur(0px); opacity: 1; }
        }
        @keyframes scaleUp {
          to { opacity: 1; transform: scale(1); }
        }
        
        .v1-auth-root .animate-fade-up {
          animation: fadeUp 0.6s ease-out forwards;
          opacity: 0;
          transform: translateY(20px);
        }
        .v1-auth-root .animate-slide-right {
          animation: slideRight 0.8s ease-out forwards;
          opacity: 0;
          transform: translateX(-30px);
        }
        .v1-auth-root .animate-blur-in {
          animation: blurIn 1s ease-out forwards;
          filter: blur(10px);
          opacity: 0;
        }
        .v1-auth-root .animate-scale-up {
          animation: scaleUp 0.5s ease-out forwards;
          opacity: 0;
          transform: scale(0.95);
        }
        
        .v1-auth-root .delay-100 { animation-delay: 0.1s; }
        .v1-auth-root .delay-200 { animation-delay: 0.2s; }
        .v1-auth-root .delay-300 { animation-delay: 0.3s; }
        .v1-auth-root .delay-400 { animation-delay: 0.4s; }
        .v1-auth-root .delay-500 { animation-delay: 0.5s; }
        .v1-auth-root .delay-600 { animation-delay: 0.6s; }
        .v1-auth-root .delay-700 { animation-delay: 0.7s; }
        .v1-auth-root .delay-800 { animation-delay: 0.8s; }
        .v1-auth-root .delay-900 { animation-delay: 0.9s; }
        .v1-auth-root .delay-1000 { animation-delay: 1s; }
        
        .v1-auth-root .glass-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        /* Explicitly define v1-card behavior */
        .v1-auth-root .v1-card {
          width: 100%;
          max-width: 72rem;
          display: flex;
          flex-direction: column;
        }
        
        @media (min-width: 1024px) {
          .v1-auth-root .v1-card {
            flex-direction: row !important;
          }
        }
        
        /* Override body/html for this view if possible via specific selector */
        body:has(.v1-auth-root) {
          overflow: hidden;
        }
        
        /* Ensure sr-only works even if Tailwind is slow to load */
        .v1-auth-root .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }
      `}} />
      
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
