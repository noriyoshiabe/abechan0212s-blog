import "./ga-cookieless";
import page from "page";

import NavigationViewController from "./NavigationViewController";
import TopViewController from "./TopViewController";
import PostViewController from "./PostViewController";

let siteIndexUrl = document.querySelector("meta[name=site-index]").content;

(async () => {
  let response = await fetch(siteIndexUrl);
  const siteIndex = await response.json();

  const nav = new NavigationViewController(siteIndex);
  document.body.appendChild(nav.view.element);

  page("/", (ctx) => nav.show(TopViewController, ctx));
  page("/:id", (ctx) => nav.show(PostViewController, ctx));
  page();
})();
