"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSelector from './LanguageSelector';
import { Settings, User, Bell, Shield, Palette } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('general');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t('settings.title')}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">General</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.account')}</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.notifications')}</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.privacy')}</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="general" className="space-y-6 mt-0">
              <div>
                <h3 className="text-lg font-medium mb-4">{t('common.language')}</h3>
                <LanguageSelector />
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">{t('common.theme')}</h3>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Theme settings coming soon
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">{t('settings.learningPreferences')}</h3>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Learning preferences coming soon
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="account" className="space-y-6 mt-0">
              <div>
                <h3 className="text-lg font-medium mb-4">{t('settings.account')}</h3>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Account settings coming soon
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6 mt-0">
              <div>
                <h3 className="text-lg font-medium mb-4">{t('settings.notifications')}</h3>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Notification settings coming soon
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-6 mt-0">
              <div>
                <h3 className="text-lg font-medium mb-4">{t('settings.privacy')}</h3>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Privacy settings coming soon
                  </p>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}