<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="app-name" content="{{ config('app.name') }}" />
    <title>{{ config('app.name') }}</title>
    <!-- Scripts -->
    @viteReactRefresh
    @vite(['frontend/main.tsx'])
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
