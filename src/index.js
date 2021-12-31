import page from 'page';

import './index.scss';

import NavigationViewController from './NavigationViewController';
import TopViewController from './TopViewController';
import PostViewController from './PostViewController';

const nav = new NavigationViewController();
document.body.appendChild(nav.view.element);

page('/', () => nav.show(TopViewController));
page('/:permalink', () => nav.show(PostViewController));
page();
