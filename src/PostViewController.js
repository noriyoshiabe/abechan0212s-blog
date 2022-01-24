import MarkdownIt from "markdown-it";
import emoji from "markdown-it-emoji";
import defs from "markdown-it-emoji/lib/data/full.json";

import { NAViewController, NAView } from "nvc";
import html from "./PostView.html";

const md = new MarkdownIt({
  html: true,
  breaks: true,
});

md.use(emoji, {
  defs: Object.assign({}, defs, {
    bow: "🙇🏻‍♂️",
  })
});

const defaultRender = md.renderer.rules.link_open || function(tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options);
};
md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  if (tokens[idx].attrGet("href")?.startsWith("http")) {
    tokens[idx].attrPush(['target', '_blank']);
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
    })();
  }

  viewDidAppear() {
    this.navVC.metaInfo = this.post;
  }
}

export default PostViewController;
