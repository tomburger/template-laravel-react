// App name is injected server-side via a meta tag from Laravel's APP_NAME env var
export const APP_NAME =
  document.querySelector('meta[name="app-name"]')?.getAttribute('content') || 'App';
