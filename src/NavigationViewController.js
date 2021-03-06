import { NAViewController, NAView } from "nvc";
import html from "./NavigationView.html";

class NavigationViewController extends NAViewController {
  vcs = {};

  constructor(siteIndex) {
    super(new NAView(html));

    this.siteIndex = siteIndex;
    this.view.profile_image.addEventListener("click", this._onClickProfile);
    this.view.profile_image_wrapper.addEventListener("transitionend", this._onTransitionEnd);

    window.addEventListener('resize', this._onWindowResize);
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

    nextVC.viewWillAppear?.(ctx);

    this.view.content.appendChild(nextVC.view.element);
    this.currentVC && this.view.content.removeChild(this.currentVC.view.element);

    nextVC.viewDidAppear?.(ctx);
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

    document.querySelector("link[rel=canonical]").href = meta.url;
  }

  get pathname() {
    return this.ctx.pathname;
  }

  smoothScrollToY(y) {
    document.body.style.transition = "initial";
    document.body.style.marginTop = "-" + (window.pageYOffset - y) + "px";

    window.scrollTo(0, y);

    document.body.style.transition = "margin-top 0.2s";
    document.body.style.marginTop = "0";
  }

  didTransit(currentVC, prevVC) {
    this.view.profile_image_wrapper.classList.add("is-animating");

    if (this.ctx.pathname === "/") {
      this.view.profile_image_wrapper.classList.remove("is-away");
    } else {
      this.view.profile_image_wrapper.classList.add("is-away");
    }

    prevVC?.view.element.classList.remove("is-shown");
    setTimeout(() => currentVC.view.element.classList.add("is-shown"));
    setTimeout(() => window.PageView());
  }

  _onClickProfile = (e) => {
    if (this.ctx.pathname === "/") {
      e.preventDefault();
      this.view.message.classList.remove("is-active");
      setTimeout(() => this.view.message.classList.add("is-active"), 50);
    }
  }

  _onTransitionEnd = () => {
    this.view.profile_image_wrapper.classList.remove("is-animating");
  }

  _onWindowResize = () => {
    this.currentVC?.windowDidResize?.();
  }
}

export default NavigationViewController;
