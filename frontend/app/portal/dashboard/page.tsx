import { redirect } from 'next/navigation';

// The portal is now a multi-page app under /portal/(shell)/*. This old route is
// kept so existing links, bookmarks and the login redirect still work.
export const dynamic = 'force-dynamic';

export default function PortalDashboardRedirect() {
  redirect('/portal/home');
}
