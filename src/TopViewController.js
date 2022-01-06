import "core-js/stable";
import "regenerator-runtime/runtime";

import { NAViewController, NAView, NAObject } from "nvc";
import html from "./TopView.html";

class TopViewController extends NAViewController {
  constructor() {
    super(new NAView(html));
  }

  set siteIndex(siteIndex) {
    this.top = siteIndex.top;

    this.view.site_name.innerText = siteIndex.top.title;

    let whoAmI = siteIndex.posts.byId.who_am_i;
    this.view.fixed_link1.href = whoAmI.url;
    this.view.fixed_link1.innerText = whoAmI.title;

    let aboutThisSite = siteIndex.posts.byId.about_this_site;
    this.view.fixed_link2.href = aboutThisSite.url;
    this.view.fixed_link2.innerText = aboutThisSite.title;

    this.selection = new Selection(siteIndex.tags);
    this.selection.addObserver(this, this._observer);

    this.selectionVC = new SelectionViewController(this.view.selectionView);
    this.selectionVC.selection = this.selection;

    let posts = siteIndex.posts.ids.map((id) => siteIndex.posts.byId[id]);
    posts.forEach((post) => {
      let vc = new ListItemViewController(this.view.list_item_tpl);
      vc.addObserver(this, this._observer);
      vc.selection = this.selection;
      vc.post = post;
      this.view.list.appendChild(vc.view.element);
    });
  }

  viewWillAppear(ctx) {
    this.ctx = ctx;

    if (!ctx.state.pageShown) {
      this.selection.reset();
    } else {
      if (ctx.state.selectionState) {
        this.selection.state = ctx.state.selectionState;
      }
    }
  }

  viewDidAppear(ctx) {
    this.navVC.metaInfo = this.top;
    this.selectionViewRect = this.view.selectionView.element.getBoundingClientRect();
  }

  _observer(sender, event) {
    switch (event) {
    case Selection.EventChange:
      this.ctx.state.selectionState = this.selection.state;
      setTimeout(() => this.ctx.save());
      break;
    case ListItemViewController.EventSelectionChange:
      let toY = this.selectionViewRect.y - 15;
      if (toY < window.scrollY) {
        this.navVC.smoothScrollToY(toY);
      }
      break;
    }
  }
}

class Selection extends NAObject {
  static EventChanged = "Selection.EventChanged";

  selectedTags = [];

  constructor(tags) {
    super();

    this.tags = tags.reduce((obj, k) => {
      obj[k] = null;
      return obj;
    }, {});

    this.addObserver(this, this._observer);
  }

  set state(state) {
    this.tags = state.tags;
    this.triggerChange(this);
  }

  get state() {
    return {tags: this.tags};
  }

  reset() {
    Object.keys(this.tags).forEach(tag => this.tags[tag] = null);
    this.triggerChange(this);
  }

  toggle(tag) {
    this.tags[tag] = this.tags[tag] ? null : "on";
    this.triggerChange(this);
  }

  _observer(sender, event) {
    if (NAObject.EventChange === event) {
      this.selectedTags = Object.keys(this.tags).map(tag => this.tags[tag] ? tag : false).filter(Boolean);
      this.notify(this, Selection.EventChanged);
    }
  }
}

class SelectionViewController extends NAViewController {
  constructor(selectionView) {
    super(selectionView);
  }

  set selection(_selection) {
    this._selection = _selection;

    Object.keys(_selection.tags).forEach(tag => {
      let selectionItemView = new NAView(this.view.selection_item_tpl);

      selectionItemView.check.id = tag;
      selectionItemView.label.setAttribute("for", tag);
      selectionItemView.label.innerText = tag;

      selectionItemView.bind("check", {to: this._selection, keyPath: `tags.${tag}`});

      this.view.element.appendChild(selectionItemView.element);
    });
  }
}

class ListItemViewController extends NAViewController {
  static EventSelectionChange = "ListItemViewController.EventSelectionChange";

  constructor(listItemTpl) {
    super(new NAView(listItemTpl));
  }

  set selection(_selection) {
    this._selection = _selection;
    this._selection.addObserver(this, this._observer);
  }

  set post(_post) {
    this._post = _post;

    this.view.title.href = _post.url;
    this.view.title.innerText = _post.title;
    this.view.description.innerText = _post.description;
    this.view.date.innerText = _post.date;

    this._post.tags.forEach(tag => {
      let tagVC = new ListItemTagViewController(this.view.tag_tpl, tag);
      tagVC.addObserver(this, this._observer);
      tagVC.selection = this._selection;
      this.view.tag_list.appendChild(tagVC.view.element);
    });

    if (this._post.thumbnailUrl) {
      this.view.thumbnail.src = this._post.thumbnailUrl;
      this.view.thumbnail.classList.remove("is-hidden");
    }

    setTimeout(() => this.view.element.style.height = this.view.element.clientHeight + 50 + 'px');
  }

  _observer(sender, event) {
    switch (event) {
    case Selection.EventChange:
      let willShow = 0 == this._selection.selectedTags.length
          || this._selection.selectedTags.every(tag => this._post.tags.includes(tag));

      if (willShow) {
        this.view.element.classList.remove("is-hidden");
      } else {
        this.view.element.classList.add("is-hidden");
      }
      break;
    case ListItemTagViewController.EventSelectionChange:
      this.notify(ListItemViewController.EventSelectionChange);
      break;
    }
  }
}

class ListItemTagViewController extends NAViewController {
  static EventSelectionChange = "ListItemTagViewController.EventSelectionChange";

  constructor(tagTpl, tag) {
    super(new NAView(tagTpl));
    this.tag = tag;
    this.view.element.innerText = tag;
    this.view.element.addEventListener("click", this._onClick.bind(this));
  }

  set selection(_selection) {
    this._selection = _selection;
    this._selection.addObserver(this, this._observer);
    this._updateSelectedClass();
  }

  _updateSelectedClass() {
    if (this._selection.selectedTags.includes(this.tag)) {
      this.view.element.classList.add("is-selected");
    } else {
      this.view.element.classList.remove("is-selected");
    }
  }

  _observer(sender, event) {
    if (Selection.EventChange === event) {
      this._updateSelectedClass();
    }
  }

  _onClick() {
    this._selection.toggle(this.tag);
    this.notify(ListItemTagViewController.EventSelectionChange);
  }
}

export default TopViewController;
