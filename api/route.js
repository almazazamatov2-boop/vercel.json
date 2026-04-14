export function middleware(request) {
  const url = new URL(request.url);
  
  if (url.pathname === '/roz') {
    return new Response(null, {
      status: 302,
      headers: { 'Location': '/roz.html' }
    });
  }
  if (url.pathname === '/check') {
    return new Response(null, {
      status: 302,
      headers: { 'Location': '/check.html' }
    });
  }
  if (url.pathname === '/kino') {
    return new Response(null, {
      status: 302,
      headers: { 'Location': '/kino.html' }
    });
  }
}

export const config = {
  matcher: '/:path*'
};