import MarkdownIt from "markdown-it";
import emoji from "markdown-it-emoji";
import defs from "markdown-it-emoji/lib/data/full.json";
import footnote from "markdown-it-footnote";

import { NAViewController, NAView } from "nvc";
import html from "./PostView.html";

const md = new MarkdownIt({
  html: true,
}).use(emoji, {
  defs: Object.assign({}, defs, {
    bow: "🙇🏻‍♂️",
  })
}).use(footnote);

const defaultRender = md.renderer.rules.link_open || function(tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options);
};
md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  if (tokens[idx].attrGet("href")?.startsWith("http")) {
    tokens[idx].attrPush(['target', '_blank']);
    tokens[idx].attrPush(['class', '_blank']);
  }
  return defaultRender(tokens, idx, options, env, self);
};


class PostViewController extends NAViewController {
  constructor() {
    super(new NAView(html));
  }

  set siteIndex(siteIndex) {
    this.post = siteIndex.posts.byId[this.navVC.pathname.substring(1).split("/")[0]];

    this.view.title.innerText = this.post.title;
    this.view.date.innerText = this.post.date;
    this.view.comment.href = `https://twitter.com/share?url=${this.post.url}&text=いてぇよー&via=na0000000000`;

    (async () => {
      let response = await fetch(this.post.bodyPath);
      let raw = await response.text();
      this.view.body.innerHTML = md.render(raw);
      this.view.comment.classList.remove("is-hidden");
      this._initScrollableHint();
      this._checkOverflowing();
    })();
  }

  viewDidAppear() {
    this.navVC.metaInfo = this.post;
    this._checkOverflowing();
  }

  windowDidResize() {
    this._checkOverflowing();
  }

  _initScrollableHint() {
    this.view.body.querySelectorAll('table, pre').forEach(scrollableElement => {
      scrollableElement.parentNode.insertBefore(document.createElement('span'), scrollableElement.nextSibling);
    });
  }

  _checkOverflowing() {
    this.view.body.querySelectorAll('table, pre').forEach(scrollableElement => {
      if (scrollableElement.scrollWidth > scrollableElement.clientWidth) {
        scrollableElement.nextSibling.classList.add("is-scrollable");
      } else {
        scrollableElement.nextSibling.classList.remove("is-scrollable");
      }
    });
  }
}

export default PostViewController;
