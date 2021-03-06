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
    this.view.fixed_link1.href = whoAmI.path;
    this.view.fixed_link1.innerText = whoAmI.title;

    let aboutThisSite = siteIndex.posts.byId.about_this_site;
    this.view.fixed_link2.href = aboutThisSite.path;
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

  onNotify(sender, event) {
    switch (event) {
    case Selection.EventChange:
      this.ctx.state.selectionState = this.selection.state;
      setTimeout(() => this.ctx.save());
      break;
    case ListItemTagViewController.EventSelectionChange:
      let toY = this.selectionViewRect.y - 15;
      if (toY < window.scrollY) {
        this.navVC.smoothScrollToY(toY);
      }
      break;
    }
  }
}

class Selection extends NAObject {
  static EventChange = "Selection.EventChange";

  selectedTag = null;

  constructor() {
    super();
    this.addObserver(this);
  }

  set state(state) {
    this.selectedTag = state.selectedTag;
    this.triggerChange();
  }

  get state() {
    return {selectedTag: this.selectedTag};
  }

  reset() {
    this.selectedTag = null;
    this.triggerChange();
  }

  select(tag) {
    this.selectedTag = this.selectedTag == tag ? null : tag;
    this.triggerChange();
  }

  onNotify(sender, event) {
    if (NAObject.EventChange === event) {
      this.notify(Selection.EventChange);
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
  constructor(listItemTpl) {
    super(new NAView(listItemTpl));
  }

  set selection(_selection) {
    this._selection = _selection;
  }

  set post(_post) {
    this._post = _post;

    this.view.title.href = _post.path;
    this.view.title.innerText = _post.title;
    this.view.description.innerText = _post.description;
    this.view.date.innerText = _post.date;

    this.view.bind("element", {to: this._selection, keyPath: 'selectedTag', oneway: true, adapter: {
      setValueToNode: (value, node) => {
        if (value == null || this._post.tags.includes(value)) {
          node.classList.remove("is-hidden");
        } else {
          node.classList.add("is-hidden");
        }
      },
    }});

    this._post.tags.forEach(tag => {
      let tagVC = new ListItemTagViewController(this.view.tag_tpl);
      tagVC.selection = this._selection;
      tagVC.tag = tag;
      tagVC.addObserver(this);
      this.view.tag_list.appendChild(tagVC.view.element);
    });

    if (this._post.thumbnailPath) {
      this.view.thumbnail.src = this._post.thumbnailPath;
      this.view.thumbnail.classList.remove("is-hidden");
    }

    setTimeout(() => this.view.element.style.height = this.view.element.clientHeight + 50 + 'px');
  }

  onNotify(sender, event) {
    this.notify(event);
  }
}

class ListItemTagViewController extends NAViewController {
  static EventSelectionChange = "ListItemTagViewController.EventSelectionChange";

  constructor(tagTpl) {
    super(new NAView(tagTpl));
  }

  set selection(_selection) {
    this._selection = _selection;
  }

  set tag(_tag) {
    this._tag = _tag;
    this.view.element.innerText = _tag;

    this.view.bind("element", {to: this._selection, keyPath: 'selectedTag', oneway: true, adapter: {
      setValueToNode: (value, node) => {
        if (value == this._tag) {
          node.classList.add("is-selected");
        } else {
          node.classList.remove("is-selected");
        }
      },
    }});

    this.view.element.addEventListener("click", this._onClick);
  }

  _onClick = () => {
    this._selection.select(this._tag);
    this.notify(ListItemTagViewController.EventSelectionChange);
  }
}

export default TopViewController;
