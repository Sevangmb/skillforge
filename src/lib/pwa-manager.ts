/**
 * PWA Manager - Gestionnaire des fonctionnalités Progressive Web App
 * Handles: Service Worker, notifications, installation, offline detection
 */

export interface PWAInstallPrompt {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  data?: any;
}

class PWAManager {
  private static instance: PWAManager;
  private installPrompt: PWAInstallPrompt | null = null;
  private swRegistration: ServiceWorkerRegistration | null = null;
  private isOnline = navigator.onLine;
  private onlineStatusCallbacks: Array<(online: boolean) => void> = [];

  static getInstance(): PWAManager {
    if (!PWAManager.instance) {
      PWAManager.instance = new PWAManager();
    }
    return PWAManager.instance;
  }

  private constructor() {
    this.initializePWA();
  }

  /**
   * Initialise toutes les fonctionnalités PWA
   */
  private async initializePWA() {
    try {
      await this.registerServiceWorker();
      this.setupInstallPrompt();
      this.setupOnlineStatusDetection();
      this.setupKeyboardShortcuts();
      this.setupAppBadging();
      
      console.log('✅ PWA Manager: Fully initialized');
    } catch (error) {
      console.error('❌ PWA Manager: Initialization failed', error);
    }
  }

  /**
   * Enregistre le Service Worker
   */
  private async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported');
    }

    try {
      this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'imports'
      });

      console.log('✅ Service Worker registered:', this.swRegistration.scope);

      // Écouter les mises à jour
      this.swRegistration.addEventListener('updatefound', () => {
        console.log('🔄 Service Worker update found');
        this.handleServiceWorkerUpdate();
      });

      // Vérifier les mises à jour périodiquement
      setInterval(() => {
        this.swRegistration?.update();
      }, 60000); // Chaque minute

    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      throw error;
    }
  }

  /**
   * Gère les mises à jour du Service Worker
   */
  private handleServiceWorkerUpdate() {
    const newWorker = this.swRegistration?.installing;
    
    if (newWorker) {
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // Nouvelle version disponible
          this.showUpdateNotification();
        }
      });
    }
  }

  /**
   * Affiche une notification de mise à jour
   */
  private showUpdateNotification() {
    // Créer un event personnalisé pour notifier l'app
    window.dispatchEvent(new CustomEvent('pwa-update-available', {
      detail: {
        message: 'Une nouvelle version de SkillForge est disponible !',
        action: () => this.applyUpdate()
      }
    }));
  }

  /**
   * Applique la mise à jour du Service Worker
   */
  public async applyUpdate(): Promise<void> {
    if (!this.swRegistration?.waiting) return;

    this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    
    // Recharger la page après activation
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }

  /**
   * Configure le prompt d'installation
   */
  private setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.installPrompt = event as any;
      
      // Notifier l'app que l'installation est possible
      window.dispatchEvent(new CustomEvent('pwa-installable', {
        detail: { canInstall: true }
      }));
      
      console.log('📱 PWA installation prompt ready');
    });

    // Détecter quand l'app est installée
    window.addEventListener('appinstalled', () => {
      this.installPrompt = null;
      
      window.dispatchEvent(new CustomEvent('pwa-installed'));
      
      // Analytics
      this.trackEvent('pwa_installed');
      
      console.log('✅ PWA installed successfully');
    });
  }

  /**
   * Prompt d'installation manuelle
   */
  public async showInstallPrompt(): Promise<boolean> {
    if (!this.installPrompt) {
      console.warn('⚠️ Install prompt not available');
      return false;
    }

    try {
      await this.installPrompt.prompt();
      const choiceResult = await this.installPrompt.userChoice;
      
      const accepted = choiceResult.outcome === 'accepted';
      
      this.trackEvent('pwa_install_prompt', { 
        outcome: choiceResult.outcome 
      });
      
      if (!accepted) {
        this.installPrompt = null;
      }
      
      return accepted;
    } catch (error) {
      console.error('❌ Install prompt failed:', error);
      return false;
    }
  }

  /**
   * Vérifie si l'app peut être installée
   */
  public canInstall(): boolean {
    return this.installPrompt !== null;
  }

  /**
   * Vérifie si l'app est installée
   */
  public isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.matchMedia('(display-mode: fullscreen)').matches ||
           (window.navigator as any).standalone === true;
  }

  /**
   * Configuration de la détection du statut en ligne/hors ligne
   */
  private setupOnlineStatusDetection() {
    const updateOnlineStatus = () => {
      const wasOnline = this.isOnline;
      this.isOnline = navigator.onLine;
      
      if (wasOnline !== this.isOnline) {
        // Notifier les callbacks
        this.onlineStatusCallbacks.forEach(callback => 
          callback(this.isOnline)
        );
        
        // Event global
        window.dispatchEvent(new CustomEvent('pwa-online-status-changed', {
          detail: { online: this.isOnline }
        }));
        
        console.log(`🌐 Network status changed: ${this.isOnline ? 'Online' : 'Offline'}`);
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Test de connectivité plus robuste
    setInterval(async () => {
      try {
        await fetch('/api/health-check', { 
          method: 'HEAD',
          cache: 'no-cache'
        });
        
        if (!this.isOnline) {
          this.isOnline = true;
          updateOnlineStatus();
        }
      } catch {
        if (this.isOnline) {
          this.isOnline = false;
          updateOnlineStatus();
        }
      }
    }, 30000); // Check toutes les 30 secondes
  }

  /**
   * Ajoute un callback pour les changements de statut réseau
   */
  public onOnlineStatusChange(callback: (online: boolean) => void): () => void {
    this.onlineStatusCallbacks.push(callback);
    
    // Retourne une fonction de nettoyage
    return () => {
      const index = this.onlineStatusCallbacks.indexOf(callback);
      if (index > -1) {
        this.onlineStatusCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Obtient le statut réseau actuel
   */
  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Configuration des raccourcis clavier PWA
   */
  private setupKeyboardShortcuts() {
    if (!this.isInstalled()) return;

    document.addEventListener('keydown', (event) => {
      // Ctrl/Cmd + K : Recherche rapide
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('pwa-open-search'));
      }
      
      // Ctrl/Cmd + D : Défi quotidien
      if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('pwa-open-daily-challenge'));
      }
      
      // Ctrl/Cmd + S : Compétences
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('pwa-open-skills'));
      }
    });
  }

  /**
   * Configuration des badges d'application
   */
  private setupAppBadging() {
    if (!('setAppBadge' in navigator)) return;

    // Écouter les événements de badge
    window.addEventListener('pwa-update-badge', (event: any) => {
      const count = event.detail?.count || 0;
      this.setAppBadge(count);
    });
  }

  /**
   * Met à jour le badge de l'application
   */
  public async setAppBadge(count: number = 0): Promise<void> {
    if (!('setAppBadge' in navigator)) return;

    try {
      if (count > 0) {
        await (navigator as any).setAppBadge(count);
      } else {
        await (navigator as any).clearAppBadge();
      }
    } catch (error) {
      console.warn('⚠️ App badge update failed:', error);
    }
  }

  /**
   * Gestion des notifications push
   */
  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    let permission = Notification.permission;
    
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }
    
    console.log(`🔔 Notification permission: ${permission}`);
    
    return permission;
  }

  /**
   * Affiche une notification locale
   */
  public async showNotification(options: NotificationOptions): Promise<void> {
    const permission = await this.requestNotificationPermission();
    
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }

    if (this.swRegistration) {
      // Notification via Service Worker (recommandé)
      await this.swRegistration.showNotification(options.title, {
        body: options.body,
        icon: options.icon || '/icons/icon-192x192.png',
        badge: options.badge || '/icons/badge-72x72.png',
        image: options.image,
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        actions: options.actions || [],
        data: options.data || {},
        vibrate: [100, 50, 100],
        timestamp: Date.now()
      });
    } else {
      // Fallback notification directe
      new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icons/icon-192x192.png',
        tag: options.tag,
        data: options.data
      });
    }
  }

  /**
   * Programme une notification de rappel d'apprentissage
   */
  public async schedulelearningReminder(delay: number = 86400000): Promise<void> {
    if (!this.swRegistration) return;

    // Utiliser l'API Notification Timer si disponible
    setTimeout(() => {
      this.showNotification({
        title: '🎯 Temps d\'apprendre !',
        body: 'Votre défi quotidien vous attend. Continuez votre progression !',
        tag: 'daily-reminder',
        requireInteraction: true,
        actions: [
          { action: 'start-learning', title: 'Commencer', icon: '/icons/start-24x24.png' },
          { action: 'remind-later', title: 'Plus tard', icon: '/icons/later-24x24.png' }
        ],
        data: { type: 'daily-reminder', url: '/daily-challenge' }
      });
    }, delay);
  }

  /**
   * Analytics et tracking d'événements
   */
  private trackEvent(eventName: string, data?: any) {
    // Intégration avec votre service d'analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, {
        event_category: 'PWA',
        event_label: 'SkillForge',
        custom_data: data
      });
    }
    
    // Custom analytics
    fetch('/api/analytics/pwa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: eventName,
        data,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        isInstalled: this.isInstalled(),
        isOnline: this.isOnline
      })
    }).catch(() => {}); // Ignore analytics errors
  }

  /**
   * Obtient des informations sur l'état PWA
   */
  public getPWAInfo() {
    return {
      isInstalled: this.isInstalled(),
      canInstall: this.canInstall(),
      isOnline: this.isOnline,
      hasServiceWorker: !!this.swRegistration,
      supportsNotifications: 'Notification' in window,
      supportsAppBadging: 'setAppBadge' in navigator,
      isStandalone: window.matchMedia('(display-mode: standalone)').matches,
      hasInstallPrompt: !!this.installPrompt
    };
  }

  /**
   * Met à jour les raccourcis dynamiques de l'app
   */
  public async updateAppShortcuts(shortcuts: Array<{
    name: string;
    shortName: string;
    description: string;
    url: string;
    iconUrl: string;
  }>): Promise<void> {
    // Cette fonctionnalité nécessite une implémentation côté serveur
    // pour mettre à jour le manifest.json dynamiquement
    
    try {
      await fetch('/api/pwa/shortcuts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shortcuts })
      });
      
      console.log('✅ App shortcuts updated');
    } catch (error) {
      console.warn('⚠️ Failed to update app shortcuts:', error);
    }
  }
}

// Export de l'instance singleton
export const pwaManager = PWAManager.getInstance();

// Types utilitaires
export type PWAInfo = ReturnType<PWAManager['getPWAInfo']>;
export type OnlineStatusCallback = (online: boolean) => void;