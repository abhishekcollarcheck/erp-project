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
    <div className="flex h-full min-h-0 w-full bg-white">
      {/* Master Data Sidebar */}
      <aside className="flex w-[225px] shrink-0 flex-col border-r border-gray-200 bg-white">
        {/* Search */}
        <div className="border-b border-gray-100 p-3">
          <input
            type="text"
            placeholder="Search catalogs..."
            className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none placeholder:text-gray-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
          />
        </div>

        {/* Navigation */}
        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
          {MASTER_DATA_SECTIONS.map((section) => (
            <div key={section.title} className="mb-5">
              <div className="mb-2 px-2 text-[10px] font-semibold tracking-[0.12em] text-gray-400">
                {section.title}
              </div>

              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={[
                        'group flex h-9 items-center justify-between rounded-md px-2.5 text-[13px] transition-colors',
                        active
                          ? 'bg-blue-600 font-medium text-white'
                          : 'text-gray-700 hover:bg-gray-100',
                      ].join(' ')}
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        {Icon && (
                          <Icon
                            size={14}
                            strokeWidth={active ? 2.2 : 1.8}
                          />
                        )}

                        <span className="truncate">{item.label}</span>
                      </span>

                      {/* Placeholder count */}
                      {active && item.href === '/masterdata' && (
                        <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px]">
                          1
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Master Data Content */}
      <main className="min-w-0 flex-1 overflow-hidden bg-white">
        {children}
      </main>
    </div>
  );
}