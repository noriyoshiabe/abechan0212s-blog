import "core-js/stable";
import "regenerator-runtime/runtime";

import { NAViewController, NAView } from "nvc";
import html from "./NavigationView.html";

class NavigationViewController extends NAViewController {
  vcs = {};

  constructor(siteIndex) {
    super(new NAView(html));
    this.siteIndex = siteIndex;
    this.view.profile_image.addEventListener("click", this._onClickProfile.bind(this));
  }

  show(ViewController, ctx) {
    this.ctx = ctx;

    let nextVC = this.vcs[ctx.pathname];
    if (!nextVC) {
      nextVC = new ViewController();
      nextVC.navVC = this;
      nextVC.siteIndex = this.siteIndex;
      this.vcs[ctx.pathname] = nextVC;
    }

    if (this.currentVC === nextVC) {
      return;
    }

    this.view.content.appendChild(nextVC.view.element);
    this.currentVC && this.view.content.removeChild(this.currentVC.view.element);

    nextVC.viewDidAppear?.();
    this.didTransit(nextVC, this.currentVC);

    this.currentVC = nextVC;

    if (!ctx.state.pageShown) {
      setTimeout(() => window.scroll(0, 0));
    }
    ctx.state.pageShown = true;
    setTimeout(() => ctx.save());
  }

  set metaInfo(meta) {
    document.title = meta.htmlTitle;

    document.querySelector("meta[name=title]").content = meta.title;
    document.querySelector("meta[name=description]").content = meta.description;

    document.querySelector('meta[property="og:url"]').content = meta.url;
    document.querySelector('meta[property="og:title"]').content = meta.title;
    document.querySelector('meta[property="og:description"]').content = meta.description;
    document.querySelector('meta[property="og:image"]').content = meta.imgUrl;

    document.querySelector('meta[name="twitter:title"]').content = meta.title;
    document.querySelector('meta[name="twitter:description"]').content = meta.description;
    document.querySelector('meta[name="twitter:image"]').content = meta.imgUrl;

    document.querySelector("link[rel=canonical]").href = meta.url;
  }

  get pathname() {
    return this.ctx.pathname;
  }

  didTransit(currentVC, prevVC) {
    if (this.ctx.pathname === "/") {
      this.view.profile_image_wrapper.classList.remove("is-away");
      this.view.profile_image_wrapper.classList.add("is-ready");
    } else {
      this.view.profile_image_wrapper.classList.add("is-away");
    }

    prevVC?.view.element.classList.remove("is-shown");
    setTimeout(() => currentVC.view.element.classList.add("is-shown"));
  }

  _onClickProfile(e) {
    if (this.ctx.pathname === "/") {
      this.view.message.classList.remove("is-active");
      setTimeout(() => this.view.message.classList.add("is-active"), 50);
    }
  }
}

export default NavigationViewController;
