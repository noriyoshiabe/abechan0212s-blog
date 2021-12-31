import { NAViewController, NAView } from 'nvc';
import html from './PostView.html';

class PostViewController extends NAViewController {
  constructor() {
    super(new NAView(html));
  }
}

export default PostViewController;
