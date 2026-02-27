'use client';

import { useState } from 'react';
import OwnerMobileHeader from './OwnerMobileHeader';
import OwnerNavDrawer from './OwnerNavDrawer';

export default function OwnerMobileNav({ shopName }: { shopName?: string }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <OwnerMobileHeader onMenuClick={() => setDrawerOpen(true)} shopName={shopName} />
      <OwnerNavDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
