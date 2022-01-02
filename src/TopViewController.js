import "core-js/stable";
import "regenerator-runtime/runtime";

import { NAViewController, NAView, NAObject } from 'nvc';
import html from './TopView.html';

class TopViewController extends NAViewController {
  constructor() {
    super(new NAView(html));
  }

  set siteIndex(siteIndex) {
    this.top = siteIndex.top;

    let whoAmI = siteIndex.posts.byId.who_am_i;
    this.view.fixed_link1.href = whoAmI.url;
    this.view.fixed_link1.innerText = whoAmI.title;

    let aboutThisSite = siteIndex.posts.byId.about_this_site;
    this.view.fixed_link2.href = aboutThisSite.url;
    this.view.fixed_link2.innerText = aboutThisSite.title;

    let selectionVC = new SelectionViewController(this.view.selectionView, siteIndex.tags);

    let posts = siteIndex.posts.ids.map(id => siteIndex.posts.byId[id]);
    posts.forEach(post => {
      let vc = new ListItemViewController(this.view.list_item_tpl);
      vc.post = post;
      vc.selection = selectionVC.selection;
      this.view.list.appendChild(vc.view.element);
    });
  }

  async viewWillAppear() {
  }

  async viewDidAppear() {
    this.navVC.metaInfo = this.top;
  }
}

class Selection extends NAObject {
  static EventChanged = "Selection:EventChanged";

  constructor(tags) {
    super();

    this.tags = tags.reduce((obj, k) => {
      obj[k] = null;
      return obj;
    }, {});

    this.selectedTags = [];

    this.addObserver(this, this._observer);
  }

  _observer(sender, event) {
    if (NAObject.EventChange === event) {
      this.selectedTags = Object.keys(this.tags).map(tag => this.tags[tag] ? tag : false).filter(Boolean);
      this.notify(this, Selection.EventChanged);
    }
  }
}

class SelectionViewController extends NAViewController {
  constructor(selectionView, tags) {
    super(selectionView);

    this.selection = new Selection(tags);

    tags.forEach(tag => {
      let selectionItemView = new NAView(this.view.selection_item_tpl);

      selectionItemView.check.id = tag;
      selectionItemView.label.setAttribute('for', tag);
      selectionItemView.label.innerText = tag;

      selectionItemView.bind('check', {to: this.selection, keyPath: `tags.${tag}`});

      this.view.element.appendChild(selectionItemView.element);
    });
  }
}

class ListItemViewController extends NAViewController {
  constructor(listItemTpl) {
    super(new NAView(listItemTpl));
  }

  set post(_post) {
    this._post = _post;

    this.view.link.href = _post.url;
    this.view.title.innerText = _post.title;
    this.view.description.innerText = _post.description;

    this._post.tags.forEach(tag => {
      let tagView = new NAView(this.view.tag_tpl);
      tagView.element.innerText = tag;
      this.view.tag_list.appendChild(tagView.element);
    });

    if (this._post.thumbnailUrl) {
      this.view.thumbnail.src = this._post.thumbnailUrl;
      this.view.thumbnail.classList.remove('is-hidden');
    }
  }

  set selection(_selection) {
    this._selection = _selection;
    this._selection.addObserver(this, this._observer);
  }

  _observer(sender, event) {
    if (Selection.EventChange === event) {
      let willShow = 0 == this._selection.selectedTags.length
          || this._selection.selectedTags.every(tag => this._post.tags.includes(tag));

      if (willShow) {
        this.view.element.classList.remove('is-hidden');
      } else {
        this.view.element.classList.add('is-hidden');
      }
    }
  }
}

export default TopViewController;
