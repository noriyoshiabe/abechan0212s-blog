import "core-js/stable";
import "regenerator-runtime/runtime";

import MarkdownIt from "markdown-it";

import { NAViewController, NAView } from "nvc";
import html from "./PostView.html";

const md = new MarkdownIt();

class PostViewController extends NAViewController {
  constructor() {
    super(new NAView(html));
  }

  viewDidAppear() {
    this.post = this.siteIndex.posts.byId[this.navVC.pathname.substring(1).split("/")[0]];

    if (!this.rendered) {
      this.view.title.innerText = this.post.title;
      this.view.date.innerText = this.post.date;

      (async () => {
        let response = await fetch(this.post.bodyUrl);
        let raw = await response.text();
        this.view.body.innerHTML = md.render(raw);
        this.rendered = true;
      })();
    }

    this.navVC.metaInfo = this.post;
  }
}

export default PostViewController;
