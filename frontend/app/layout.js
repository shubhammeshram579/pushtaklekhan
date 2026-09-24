'use client';
import '../styles/globals.css';
import { Provider } from 'react-redux';
import store from '../store';
import { Toaster } from 'react-hot-toast';
import UpgradeModal from '../components/subscription/UpgradeModal';


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Pushtaklekhan — AI Book Writing Platform</title>
        <meta name="description" content="AI-powered book writing platform for authors" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Provider store={store}>
          {children}
          <UpgradeModal />    
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#1a1612',
                color: '#faf7f2',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px',
              },
            }}
          />
        </Provider>
      </body>
    </html>
  );
}
