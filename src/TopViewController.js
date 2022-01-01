import "core-js/stable";
import "regenerator-runtime/runtime";

import { NAViewController, NAView, NAObject } from 'nvc';
import html from './TopView.html';

class TopViewController extends NAViewController {
  constructor() {
    super(new NAView(html));
  }

  set siteIndex(siteIndex) {
    this.top = new NAObject(siteIndex.top);
    this.whoAmI = new NAObject(siteIndex.posts.byUrl['/who-am-i']);
  }

  async viewWillAppear() {
    this.view.bind('fixed_link1', {to: this.whoAmI, keyPath: 'url', adapter: HrefBindAdapter, oneway: true});
    this.view.bind('fixed_link1', {to: this.whoAmI, keyPath: 'title', oneway: true});
  }

  async viewDidAppear() {
    this.navVC.metaInfo = this.top;
  }
}

class HrefBindAdapter {
  static setValueToNode(value, node) {
    node.href = value;
  }
}

export default TopViewController;
