import "core-js/stable";
import "regenerator-runtime/runtime";

import { NAViewController, NAView } from 'nvc';
import html from './NavigationView.html';

class NavigationViewController extends NAViewController {
  vcs = {}

  constructor(siteIndex) {
    super(new NAView(html));
    this.siteIndex = siteIndex;
  }

  show(ViewController, ctx) {
    setTimeout(async () => await this._show(ViewController, ctx));
  }

  async _show(ViewController, ctx) {
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

    await Promise.all([
      nextVC.viewWillAppear?.(),
      this.currentVC?.viewWillDisappear?.(),
    ].filter(Boolean));

    this.view.content.appendChild(nextVC.view.element);
    this.currentVC && this.view.content.removeChild(this.currentVC.view.element);

    await Promise.all([
      nextVC.viewDidAppear?.(),
      this.currentVC?.viewDidDisappear?.(),
    ].filter(Boolean));

    this.currentVC = nextVC;
  }

  set metaInfo(meta) {
    document.title = meta.htmlTitle;

    document.querySelector('meta[name=title]').content = meta.title;
    document.querySelector('meta[name=description]').content = meta.description;

    document.querySelector('meta[property="og:url"]').content = meta.url;
    document.querySelector('meta[property="og:title"]').content = meta.title;
    document.querySelector('meta[property="og:description"]').content = meta.description;
    document.querySelector('meta[property="og:image"]').content = meta.imgUrl;

    document.querySelector('meta[name="twitter:title"]').content = meta.title;
    document.querySelector('meta[name="twitter:description"]').content = meta.description;
    document.querySelector('meta[name="twitter:image"]').content = meta.imgUrl;

    document.querySelector('link[rel=canonical]').href = meta.url;
  }

  get pathname() {
    return this.ctx.pathname;
  }
}

export default NavigationViewController;
