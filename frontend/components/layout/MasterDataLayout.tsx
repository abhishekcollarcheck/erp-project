'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, ComponentType } from 'react';
import {
  Building2,
  CalendarDays,
  CircleDollarSign,
  FileText,
  Globe2,
  GraduationCap,
  Heart,
  House,
  MapPin,
  Users,
  UserCheck,
  UserRound,
  BriefcaseBusiness,
  Clock3,
  ShieldCheck,
  Settings2,
  Shirt,
  Ambulance,
  CircleUserRound,
  Currency,
  DollarSign,
  CurrencyIcon,
} from 'lucide-react';

interface MasterDataLayoutProps {
  children: ReactNode;
}

interface MenuItem {
  label: string;
  href: string;
  icon?: ComponentType<{
    size?: number | string;
    strokeWidth?: number | string;
    className?: string;
  }>;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const MASTER_DATA_SECTIONS: MenuSection[] = [
  {
    title: 'ORGANIZATION',
    items: [
      {
        label: 'Group Profile',
        href: '/masterdata',
        icon: Building2,
      },
      {
        label: 'Company',
        href: '/masterdata/company',
        icon: Building2,
      },
      {
        label: 'Departments',
        href: '/masterdata/departments',
        icon: BriefcaseBusiness,
      },
      {
        label: 'Designations',
        href: '/masterdata/designations',
        icon: UserCheck,
      },
      {
        label: 'Locations',
        href: '/masterdata/locations',
        icon: MapPin,
      },
    ],
  },

  {
    title: 'ATTENDANCE & SHIFTS',
    items: [
      {
        label: 'Shifts',
        href: '/masterdata/shifts',
        icon: Clock3,
      },
      {
        label: 'Weekly Offs',
        href: '/masterdata/weekly-offs',
        icon: CalendarDays,
      },
      {
        label: 'Attendance Rules',
        href: '/masterdata/attendance-rules',
        icon: Settings2,
      },
    ],
  },

  {
    title: 'EMPLOYMENT',
    items: [
      {
        label: 'Employee Status',
        href: '/masterdata/employee-status',
        icon: UserRound,
      },
      {
        label: 'Employee Type',
        href: '/masterdata/employee-type',
        icon: Users,
      },
      {
        label: 'Probation',
        href: '/masterdata/probation',
        icon: Clock3,
      },
      {
        label: 'Notice Period',
        href: '/masterdata/notice-period',
        icon: FileText,
      },
      {
        label: 'Exit Status',
        href: '/masterdata/exit-status',
        icon: UserRound,
      },
      {
        label: 'Commitment / Bond',
        href: '/masterdata/commitment-bond',
        icon: ShieldCheck,
      },
      {
        label: 'Insured Amount',
        href: '/masterdata/insured-amount',
        icon: CircleDollarSign,
      },
    ],
  },

  {
    title: 'PERSONAL',
    items: [
      {
        label: 'Gender',
        href: '/masterdata/gender',
        icon: UserRound,
      },
      {
        label: 'Marital Status',
        href: '/masterdata/marital-status',
        icon: Heart,
      },
      {
        label: 'Blood Group',
        href: '/masterdata/blood-group',
        icon: ShieldCheck,
      },
      {
        label: 'Religion',
        href: '/masterdata/religion',
        icon: Globe2,
      },
      {
        label: 'Nationality',
        href: '/masterdata/nationality',
        icon: Globe2,
      },
      {
        label: 'Shirt / T-Shirt Size',
        href: '/masterdata/shirt-size',
        icon: Shirt,
      },
      {
        label: 'Qualification',
        href: '/masterdata/qualification',
        icon: GraduationCap,
      },
      {
        label: 'Education Mode',
        href: '/masterdata/education-mode',
        icon: GraduationCap,
      },
      {
        label: 'House Type',
        href: '/masterdata/house-type',
        icon: House,
      },
      {
        label: 'Emergency Relationship',
        href: '/masterdata/emergency-relationship',
        icon: Ambulance,
      },
      {
        label: 'Salutation',
        href: '/masterdata/salutation',
        icon: CircleUserRound,
      },
    ],
  },
  {
    title: 'PAYROLL & BANKING',
    items: [
      {
        label: 'Banks',
        href: '/masterdata/banks',
        icon: DollarSign,
      },
      {
        label: 'Mode of Payment ',
        href: '/masterdata/paymentmode',
        icon:  CurrencyIcon,
      },
    ],
  },
];

export  function MasterDataLayout({
  children,
}: MasterDataLayoutProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    // Exact match for the main Master Data page
    if (href === '/masterdata') {
      return pathname === '/masterdata';
    }

    // Match the current page and its nested routes
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="md-shell">
      {/* Master Data Sidebar — reuses the app's own .search-bar / .sb-sec / .ni nav-item tokens */}
      <aside className="md-side">
        <div className="md-side-search">
          <div className="search-bar">
            <span style={{ color: 'var(--ink4)' }}>⌕</span>
            <input type="text" placeholder="Search catalogs..." />
          </div>
        </div>

        <div className="md-nav">
          {MASTER_DATA_SECTIONS.map((section) => (
            <div key={section.title} className="mb16">
              <div className="sb-sec" style={{ padding: '4px 9px' }}>
                {section.title}
              </div>

              {section.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`ni${active ? ' on' : ''}`}
                  >
                    {Icon && <Icon size={14} strokeWidth={active ? 2.2 : 1.8} className="ni-ic" />}
                    <span className="ni-lb">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </aside>

      {/* Master Data Content */}
      <main className="md-main">{children}</main>
    </div>
  );
}