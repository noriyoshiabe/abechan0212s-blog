const CLIENT_ID_KEY = "GA_CLIENT_ID_ONLY_FOR_THIS_SITE";

if (process.env.GA_TRACKING_ID) {
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  if (window.localStorage) {
    var clientId = window.localStorage.getItem(CLIENT_ID_KEY);
    if (!clientId) {
      clientId = [...Array(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
      window.localStorage.setItem(CLIENT_ID_KEY, clientId);
    }

    window.PageView = function() {
      gtag('config', process.env.GA_TRACKING_ID, {
        client_storage: 'none',
        client_id: clientId,
        page_title: document.title,
        page_location: location.href,
        page_path: location.pathname,
        send_page_view: true,
      });
    };
  } else {
    // ignore legacy browser which does not have localStorage
    window.PageView = function() {};
  }
} else {
  window.PageView = function() { /* console.log("PageView: " + location.pathname) */ };
}
