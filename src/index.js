import React, { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './assets/css/tailwind.output.css';

import './index.css';
import App from './App';
import { SidebarProvider } from './context/SidebarContext';
import ThemedSuspense from './components/ThemedSuspense';
import { Windmill } from '@windmill/react-ui';
import * as serviceWorker from './serviceWorker';

// if (process.env.NODE_ENV !== 'production') {
//   const axe = require('react-axe')
//   axe(React, ReactDOM, 1000)
// }

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <StrictMode>
    <SidebarProvider>
      <Suspense fallback={<ThemedSuspense />}>
        <Windmill usePreferences>
          <App />
        </Windmill>
      </Suspense>
    </SidebarProvider>
  </StrictMode>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.register();
