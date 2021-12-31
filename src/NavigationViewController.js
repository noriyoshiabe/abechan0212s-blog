import { NAViewController, NAView } from 'nvc';
import html from './NavigationView.html';

class NavigationViewController extends NAViewController {
  vcs = {}

  constructor() {
    super(new NAView(html));
  }

  show(ViewController) {
    setTimeout(() => this._show(ViewController));
  }

  _show(ViewController) {
    this.vcs[location.pathname] = this.vcs[location.pathname] || new ViewController(location.pathname);

    let prevVC = this.currentVC;
    let currentVC = this.vcs[location.pathname];

    if (prevVC === currentVC) {
      return;
    }

    this.view.content.appendChild(currentVC.view.element);
    prevVC && this.view.content.removeChild(prevVC.view.element);

    this.currentVC = currentVC;
  }
}

export default NavigationViewController;
