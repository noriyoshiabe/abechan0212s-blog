import "core-js/stable";
import "regenerator-runtime/runtime";

import { NAViewController, NAView, NAObject } from 'nvc';
import html from './PostView.html';

class PostViewController extends NAViewController {
  constructor() {
    super(new NAView(html));
  }

  async viewWillAppear() {
    this.post = new NAObject(this.siteIndex.posts.byId[this.navVC.pathname.substring(1)]);

    if (!this.mdText) {
      let response = await fetch(this.post.bodyUrl);
      this.mdText = await response.text();
    }

    this.view.content.value = this.mdText;
  }

  async viewDidAppear() {
    this.navVC.metaInfo = this.post;
  }
}

export default PostViewController;
