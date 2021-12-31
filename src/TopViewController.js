import { NAViewController, NAView } from 'nvc';
import html from './TopView.html';

class TopViewController extends NAViewController {
  constructor() {
    super(new NAView(html));
  }
}

export default TopViewController;
