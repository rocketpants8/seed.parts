import { FaIconLibrary } from '@fortawesome/angular-fontawesome/icon-library';

import {
  faBitcoin
} from '@fortawesome/free-brands-svg-icons';

import {
  faAngleLeft,
  faAngleRight,
  faCheckCircle,
  faCopy,
  faEye,
  faEyeSlash,
  faFileImport,
  faFileText,
  faKey,
  faTrashCan,
  faTriangleExclamation,
  faWallet
} from '@fortawesome/free-solid-svg-icons';

export function initIconLibrary(library: FaIconLibrary): void {

  const icons = [
    faAngleLeft,
    faAngleRight,
    faBitcoin,
    faCheckCircle,
    faCopy,
    faEye,
    faEyeSlash,
    faFileImport,
    faFileText,
    faKey,
    faTrashCan,
    faTriangleExclamation,
    faWallet
  ];

  library.addIcons(...icons);
}