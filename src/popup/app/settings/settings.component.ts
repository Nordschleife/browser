import * as angular from 'angular';
import * as template from './settings.component.html';

import { BrowserApi } from '../../../browser/browserApi';

import { DeviceType } from 'jslib/enums/deviceType';

import { ConstantsService } from 'jslib/services/constants.service';

import { CryptoService } from 'jslib/abstractions/crypto.service';
import { LockService } from 'jslib/abstractions/lock.service';
import { MessagingService } from 'jslib/abstractions/messaging.service';
import { PlatformUtilsService } from 'jslib/abstractions/platformUtils.service';
import { StorageService } from 'jslib/abstractions/storage.service';

import { PopupUtilsService } from '../services/popupUtils.service';

const RateUrls = {
    [DeviceType.Chrome]:
    'https://chrome.google.com/webstore/detail/bitwarden-free-password-m/nngceckbapebfimnlniiiahkandclblb/reviews',
    [DeviceType.Firefox]:
    'https://addons.mozilla.org/en-US/firefox/addon/bitwarden-password-manager/#reviews',
    [DeviceType.Opera]:
    'https://addons.opera.com/en/extensions/details/bitwarden-free-password-manager/#feedback-container',
    [DeviceType.Edge]:
    'https://www.microsoft.com/store/p/bitwarden-free-password-manager/9p6kxl0svnnl',
    [DeviceType.Vivaldi]:
    'https://chrome.google.com/webstore/detail/bitwarden-free-password-m/nngceckbapebfimnlniiiahkandclblb/reviews',
    [DeviceType.Safari]:
    'https://itunes.apple.com/app/bitwarden-password-manager/id1137397744',
};

export class SettingsController {
    lockOption = '';
    i18n: any;
    showOnLocked: boolean;
    showPopout: boolean = true;

    constructor(private $state: any, private SweetAlert: any,
        private platformUtilsService: PlatformUtilsService, private $analytics: any,
        private i18nService: any, private constantsService: ConstantsService,
        private cryptoService: CryptoService, private lockService: LockService,
        private storageService: StorageService, public messagingService: MessagingService,
        private $timeout: ng.ITimeoutService) {
        this.i18n = i18nService;
        this.showPopout = !platformUtilsService.isSafari();

        $timeout(() => {
            PopupUtilsService.initListSectionItemListeners(document, angular);
        }, 500);

        this.showOnLocked = !platformUtilsService.isFirefox() && !platformUtilsService.isEdge()
            && !platformUtilsService.isSafari();
        this.storageService.get(constantsService.lockOptionKey).then((lockOption: number) => {
            if (lockOption != null) {
                let option = lockOption.toString();
                if (option === '-2' && !this.showOnLocked) {
                    option = '-1';
                }
                this.lockOption = option;
            } else {
                this.lockOption = '';
            }
        });
    }

    changeLockOption() {
        const option = this.lockOption && this.lockOption !== '' ? parseInt(this.lockOption, 10) : null;
        this.storageService.save(this.constantsService.lockOptionKey, option).then(() => {
            return this.cryptoService.getKeyHash();
        }).then((keyHash) => {
            if (keyHash) {
                this.cryptoService.toggleKey();
            } else {
                this.SweetAlert.swal({
                    title: this.i18nService.loggingOut,
                    text: this.i18nService.loggingOutConfirmation,
                    showCancelButton: true,
                    confirmButtonText: this.i18nService.yes,
                    cancelButtonText: this.i18nService.cancel,
                }, (confirmed: boolean) => {
                    if (confirmed) {
                        this.cryptoService.toggleKey();
                        this.messagingService.send('logout');
                    }
                });
            }
        });
    }

    lock() {
        this.$analytics.eventTrack('Lock Now');
        this.lockService.lock().then(() => {
            return this.$state.go('lock', {
                animation: 'in-slide-down',
            });
        });
    }

    logOut() {
        this.SweetAlert.swal({
            title: this.i18nService.logOut,
            text: this.i18nService.logOutConfirmation,
            showCancelButton: true,
            confirmButtonText: this.i18nService.yes,
            cancelButtonText: this.i18nService.cancel,
        }, (confirmed: boolean) => {
            if (confirmed) {
                this.messagingService.send('logout');
            }
        });
    }

    changePassword() {
        this.SweetAlert.swal({
            title: this.i18nService.changeMasterPassword,
            text: this.i18nService.changeMasterPasswordConfirmation,
            showCancelButton: true,
            confirmButtonText: this.i18nService.yes,
            cancelButtonText: this.i18nService.cancel,
        }, (confirmed: boolean) => {
            this.$analytics.eventTrack('Clicked Change Password');
            if (confirmed) {
                BrowserApi.createNewTab('https://help.bitwarden.com/article/change-your-master-password/');
            }
        });
    }

    changeEmail() {
        this.SweetAlert.swal({
            title: this.i18nService.changeEmail,
            text: this.i18nService.changeEmailConfirmation,
            showCancelButton: true,
            confirmButtonText: this.i18nService.yes,
            cancelButtonText: this.i18nService.cancel,
        }, (confirmed: boolean) => {
            this.$analytics.eventTrack('Clicked Change Email');
            if (confirmed) {
                BrowserApi.createNewTab('https://help.bitwarden.com/article/change-your-email/');
            }
        });
    }

    twoStep() {
        this.SweetAlert.swal({
            title: this.i18nService.twoStepLogin,
            text: this.i18nService.twoStepLoginConfirmation,
            showCancelButton: true,
            confirmButtonText: this.i18nService.yes,
            cancelButtonText: this.i18nService.cancel,
        }, (confirmed: boolean) => {
            this.$analytics.eventTrack('Clicked Two-step Login');
            if (confirmed) {
                BrowserApi.createNewTab('https://help.bitwarden.com/article/setup-two-step-login/');
            }
        });
    }

    rate() {
        this.$analytics.eventTrack('Rate Extension');
        BrowserApi.createNewTab((RateUrls as any)[this.platformUtilsService.getDevice()]);
    }
}

SettingsController.$inject = ['$state', 'SweetAlert', 'platformUtilsService', '$analytics', 'i18nService',
    'constantsService', 'cryptoService', 'lockService', 'storageService', 'messagingService', '$timeout'];

export const SettingsComponent = {
    bindings: {},
    controller: SettingsController,
    template: template,
};
