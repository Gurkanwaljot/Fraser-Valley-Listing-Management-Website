// src/App.js
import React, { lazy, useEffect, useMemo, useState, createContext, useContext } from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import AccessibleNavigationAnnouncer from './components/AccessibleNavigationAnnouncer';

const Layout = lazy(() => import('./containers/Layout'));
const Login = lazy(() => import('./pages/Login'));
const CreateAccount = lazy(() => import('./pages/CreateAccount'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Preview = lazy(() => import('./pages/Listings/Preview/Preview'));

const API_BASE = process.env.REACT_APP_API_BASE;

/* ---------------- Auth context ---------------- */
const AuthCtx = createContext({ checked: false, authed: false });

function AuthProvider({ children }) {
  const [state, setState] = useState({ checked: false, authed: false });

  useEffect(() => {
    let mounted = true;
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          credentials: 'include',
          signal: ac.signal,
        });
        if (!mounted) return;
        setState({ checked: true, authed: res.ok });
      } catch {
        if (mounted) setState({ checked: true, authed: false });
      }
    })();
    return () => { mounted = false; ac.abort(); };
  }, []);

  const value = useMemo(() => state, [state]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

function useAuth() {
  return useContext(AuthCtx);
}

/* --------------- Route guards ----------------- */
function FullscreenGate() {
  return (
    <div className="min-h-screen grid place-content-center text-gray-600">
      Checking session…
    </div>
  );
}

function PrivateRoute({ component: Component, ...rest }) {
  const { checked, authed } = useAuth();
  return (
    <Route
      {...rest}
      render={(props) =>
        !checked ? (
          <FullscreenGate />
        ) : authed ? (
          <Component {...props} />
        ) : (
          <Redirect to={{ pathname: '/login', state: { from: props.location } }} />
        )
      }
    />
  );
}

function App() {
  return (
    <Router>
      <AccessibleNavigationAnnouncer />
      <Switch>
        {/* Public routes */}
        <Route exact path="/login" component={Login} />
        <Route exact path="/create-account" component={CreateAccount} />
        <Route exact path="/forgot-password" component={ForgotPassword} />

        {/* Admin preview-by-id (you can still pass allowAdmin here if you want) */}
        <Route exact path="/listings/:id/preview" render={(p) => <Preview {...p} allowAdmin={true} />} />

        {/* Public slug page */}
        <Route exact path="/:slug" render={(p) => <Preview {...p} allowAdmin={false} />} />

        {/* Admin app; AuthProvider only wraps this subtree */}
        <Route
          path="/app"
          render={() => (
            <AuthProvider>
              <PrivateRoute path="/app" component={Layout} />
            </AuthProvider>
          )}
        />

        <Redirect exact from="/" to="/login" />
      </Switch>
    </Router>
  );
}


export default App;
