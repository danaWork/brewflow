'use client';

import { useEffect, useRef, useState } from 'react';
import { Order } from '@/context/OrderContext';

export interface OrderNotification {
  order: Order;
  id: string;
}

export function useOrderNotifications(orders: Order[], isLoading: boolean = false) {
  const previousOrderIdsRef = useRef<Set<string>>(new Set());
  const notificationPermissionRef = useRef<NotificationPermission | null>(null);
  const isInitializedRef = useRef(false);
  const [newOrderNotification, setNewOrderNotification] = useState<OrderNotification | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          notificationPermissionRef.current = permission;
        });
      } else {
        notificationPermissionRef.current = Notification.permission;
      }
    }
  }, []);

  const playNotificationSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('Web Audio API not supported');
      }

      const audioContext = new AudioContextClass();
      
      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {
        });
      }

      const gainNode = audioContext.createGain();
      gainNode.connect(audioContext.destination);

      const oscillator1 = audioContext.createOscillator();
      oscillator1.type = 'sine';
      oscillator1.frequency.value = 800;
      oscillator1.connect(gainNode);

      const oscillator2 = audioContext.createOscillator();
      oscillator2.type = 'sine';
      oscillator2.frequency.value = 1000;
      oscillator2.connect(gainNode);

      const now = audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gainNode.gain.setValueAtTime(0.3, now + 0.1);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.15);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      oscillator1.start(now);
      oscillator1.stop(now + 0.4);
      oscillator2.start(now + 0.1);
      oscillator2.stop(now + 0.4);

      oscillator1.onended = () => {
        try {
          audioContext.close().catch(() => {
          });
        } catch (e) {
        }
      };
    } catch (error) {
      console.warn('Could not play notification sound with Web Audio API:', error);
      try {
        const audio = new Audio();
        const sampleRate = 44100;
        const duration = 0.3;
        const frequency1 = 800;
        const frequency2 = 1000;
        const numSamples = Math.floor(sampleRate * duration);
        const buffer = new ArrayBuffer(44 + numSamples * 2);
        const view = new DataView(buffer);

        const writeString = (offset: number, string: string) => {
          for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
          }
        };
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + numSamples * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, numSamples * 2, true);

        for (let i = 0; i < numSamples; i++) {
          const t = i / sampleRate;
          const freq = t < 0.15 ? frequency1 : frequency2;
          const sample = Math.sin(2 * Math.PI * freq * t) * 0.3;
          const int16 = Math.max(-32768, Math.min(32767, Math.floor(sample * 32768)));
          view.setInt16(44 + i * 2, int16, true);
        }

        const blob = new Blob([buffer], { type: 'audio/wav' });
        audio.src = URL.createObjectURL(blob);
        audio.volume = 0.5;
        
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            setTimeout(() => {
              audio.play().catch(() => {
              });
            }, 100);
          });
        }
        
        audio.onended = () => {
          URL.revokeObjectURL(audio.src);
        };
      } catch (fallbackError) {
        console.warn('Could not play fallback notification sound:', fallbackError);
      }
    }
  };

  const showBrowserNotification = (order: Order) => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    const permission = notificationPermissionRef.current || Notification.permission;
    
    if (permission === 'granted') {
      try {
        const notification = new Notification('New Order Received! 🍽️', {
          body: `Order #${order.orderNumber} from ${order.table}`,
          icon: '/icons/tea-cup-svgrepo-com.svg',
          badge: '/icons/tea-cup-svgrepo-com.svg',
          tag: `order-${order.id}`,
          requireInteraction: false,
          silent: false,
        });

        setTimeout(() => {
          notification.close();
        }, 5000);

        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      } catch (error) {
        console.warn('Could not show browser notification:', error);
      }
    }
  };

  useEffect(() => {
    if (isLoading) return;

    const pendingOrders = orders.filter(order => order.status === 'PENDING');
    const currentPendingIds = new Set(pendingOrders.map(order => order.id));
    
    if (!isInitializedRef.current) {
      previousOrderIdsRef.current = currentPendingIds;
      isInitializedRef.current = true;
      return;
    }

    const newOrders = pendingOrders.filter(
      order => !previousOrderIdsRef.current.has(order.id)
    );

    if (newOrders.length > 0) {
      newOrders.forEach((order) => {
        playNotificationSound();
        
        showBrowserNotification(order);
        
        setNewOrderNotification({
          order,
          id: `${order.id}-${Date.now()}`
        });
        
        setTimeout(() => {
          setNewOrderNotification(null);
        }, 5000);
      });
    }

    previousOrderIdsRef.current = currentPendingIds;
  }, [orders, isLoading]);

  return {
    newOrderNotification,
    dismissNotification: () => setNewOrderNotification(null)
  };
}
