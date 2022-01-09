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

    this.selection = new Selection();
    this.selection.addObserver(this);

    let selectionVC = new SelectionViewController(this.view.selectionView);
    selectionVC.selection = this.selection;
    selectionVC.tags = siteIndex.tags;

    let posts = siteIndex.posts.ids.map((id) => siteIndex.posts.byId[id]);
    posts.forEach((post) => {
      let vc = new ListItemViewController(this.view.list_item_tpl);
      vc.addObserver(this);
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

  onNotifyEvent(sender, event) {
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

  selectedTag = null;

  constructor() {
    super();
    this.addObserver(this);
  }

  set state(state) {
    this.selectedTag = state.selectedTag;
    this.triggerChange(this);
  }

  get state() {
    return {selectedTag: this.selectedTag};
  }

  reset() {
    this.selectedTag = null;
    this.triggerChange(this);
  }

  select(tag) {
    this.selectedTag = this.selectedTag == tag ? null : tag;
    this.triggerChange(this);
  }

  onNotifyEvent(sender, event) {
    if (NAObject.EventChange === event) {
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
  }

  set tags(_tags) {
    _tags.forEach(tag => {
      let selectionItemView = new NAView(this.view.selection_item_tpl);

      selectionItemView.check.id = tag;
      selectionItemView.check.value = tag;
      selectionItemView.label.setAttribute("for", tag);
      selectionItemView.label.innerText = tag;

      selectionItemView.bind("check", {to: this._selection, keyPath: 'selectedTag'});

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
    this._selection.addObserver(this);
  }

  set post(_post) {
    this._post = _post;

    this.view.title.href = _post.url;
    this.view.title.innerText = _post.title;
    this.view.description.innerText = _post.description;
    this.view.date.innerText = _post.date;

    this._post.tags.forEach(tag => {
      let tagVC = new ListItemTagViewController(this.view.tag_tpl);
      tagVC.selection = this._selection;
      tagVC.tag = tag;
      tagVC.addObserver(this);
      this.view.tag_list.appendChild(tagVC.view.element);
    });

    if (this._post.thumbnailUrl) {
      this.view.thumbnail.src = this._post.thumbnailUrl;
      this.view.thumbnail.classList.remove("is-hidden");
    }

    setTimeout(() => this.view.element.style.height = this.view.element.clientHeight + 50 + 'px');
  }

  onNotifyEvent(sender, event) {
    switch (event) {
    case Selection.EventChange:
      let willShow = this._selection.selectedTag == null || this._post.tags.includes(this._selection.selectedTag);

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

  constructor(tagTpl) {
    super(new NAView(tagTpl));
  }

  set selection(_selection) {
    this._selection = _selection;
    this._selection.addObserver(this);
  }

  set tag(_tag) {
    this._tag = _tag;
    this.view.element.innerText = _tag;
    this.view.element.addEventListener("click", this._onClick.bind(this));
  }

  _updateSelectedClass() {
    if (this._selection.selectedTag == this._tag) {
      this.view.element.classList.add("is-selected");
    } else {
      this.view.element.classList.remove("is-selected");
    }
  }

  onNotifyEvent(sender, event) {
    if (Selection.EventChange === event) {
      this._updateSelectedClass();
    }
  }

  _onClick() {
    this._selection.select(this._tag);
    this.notify(ListItemTagViewController.EventSelectionChange);
  }
}

export default TopViewController;
