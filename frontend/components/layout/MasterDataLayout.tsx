// 'use client';

// import Link from 'next/link';
// import { usePathname } from 'next/navigation';
// import { ReactNode, ComponentType } from 'react';
// import {
//   Building2,
//   CalendarDays,
//   CircleDollarSign,
//   FileText,
//   Globe2,
//   GraduationCap,
//   Heart,
//   House,
//   MapPin,
//   Users,
//   UserCheck,
//   UserRound,
//   BriefcaseBusiness,
//   Clock3,
//   ShieldCheck,
//   Settings2,
//   Shirt,
//   Ambulance,
//   CircleUserRound,
//   Currency,
//   DollarSign,
//   CurrencyIcon,
// } from 'lucide-react';

// interface MasterDataLayoutProps {
//   children: ReactNode;
// }

// interface MenuItem {
//   label: string;
//   href: string;
//   icon?: ComponentType<{
//     size?: number | string;
//     strokeWidth?: number | string;
//     className?: string;
//   }>;
// }

// interface MenuSection {
//   title: string;
//   items: MenuItem[];
// }

// const MASTER_DATA_SECTIONS: MenuSection[] = [
//   {
//     title: 'ORGANIZATION',
//     items: [
//       {
//         label: 'Group Profile',
//         href: '/masterdata',
//         icon: Building2,
//       },
//       {
//         label: 'Company',
//         href: '/masterdata/company',
//         icon: Building2,
//       },
//       {
//         label: 'Departments',
//         href: '/masterdata/departments',
//         icon: BriefcaseBusiness,
//       },
//       {
//         label: 'Designations',
//         href: '/masterdata/designations',
//         icon: UserCheck,
//       },
//       {
//         label: 'Locations',
//         href: '/masterdata/locations',
//         icon: MapPin,
//       },
//     ],
//   },

//   {
//     title: 'ATTENDANCE & SHIFTS',
//     items: [
//       {
//         label: 'Shifts',
//         href: '/masterdata/shifts',
//         icon: Clock3,
//       },
//       {
//         label: 'Weekly Offs',
//         href: '/masterdata/weekly-offs',
//         icon: CalendarDays,
//       },
//       {
//         label: 'Attendance Rules',
//         href: '/masterdata/attendance-rules',
//         icon: Settings2,
//       },
//     ],
//   },

//   {
//     title: 'EMPLOYMENT',
//     items: [
//       {
//         label: 'Employee Status',
//         href: '/masterdata/employee-status',
//         icon: UserRound,
//       },
//       {
//         label: 'Employee Type',
//         href: '/masterdata/employee-type',
//         icon: Users,
//       },
//       {
//         label: 'Probation',
//         href: '/masterdata/probation',
//         icon: Clock3,
//       },
//       {
//         label: 'Notice Period',
//         href: '/masterdata/notice-period',
//         icon: FileText,
//       },
//       {
//         label: 'Exit Status',
//         href: '/masterdata/exit-status',
//         icon: UserRound,
//       },
//       {
//         label: 'Commitment / Bond',
//         href: '/masterdata/commitment-bond',
//         icon: ShieldCheck,
//       },
//       {
//         label: 'Insured Amount',
//         href: '/masterdata/insured-amount',
//         icon: CircleDollarSign,
//       },
//     ],
//   },

//   {
//     title: 'PERSONAL',
//     items: [
//       {
//         label: 'Gender',
//         href: '/masterdata/gender',
//         icon: UserRound,
//       },
//       {
//         label: 'Marital Status',
//         href: '/masterdata/marital-status',
//         icon: Heart,
//       },
//       {
//         label: 'Blood Group',
//         href: '/masterdata/blood-group',
//         icon: ShieldCheck,
//       },
//       {
//         label: 'Religion',
//         href: '/masterdata/religion',
//         icon: Globe2,
//       },
//       {
//         label: 'Nationality',
//         href: '/masterdata/nationality',
//         icon: Globe2,
//       },
//       {
//         label: 'Shirt / T-Shirt Size',
//         href: '/masterdata/shirt-size',
//         icon: Shirt,
//       },
//       {
//         label: 'Qualification',
//         href: '/masterdata/qualification',
//         icon: GraduationCap,
//       },
//       {
//         label: 'Education Mode',
//         href: '/masterdata/education-mode',
//         icon: GraduationCap,
//       },
//       {
//         label: 'House Type',
//         href: '/masterdata/house-type',
//         icon: House,
//       },
//       {
//         label: 'Emergency Relationship',
//         href: '/masterdata/emergency-relationship',
//         icon: Ambulance,
//       },
//       {
//         label: 'Salutation',
//         href: '/masterdata/salutation',
//         icon: CircleUserRound,
//       },
//     ],
//   },
//   {
//     title: 'PAYROLL & BANKING',
//     items: [
//       {
//         label: 'Banks',
//         href: '/masterdata/banks',
//         icon: DollarSign,
//       },
//       {
//         label: 'Mode of Payment ',
//         href: '/masterdata/paymentmode',
//         icon:  CurrencyIcon,
//       },
//     ],
//   },
// ];

// export  function MasterDataLayout({
//   children,
// }: MasterDataLayoutProps) {
//   const pathname = usePathname();

//   const isActive = (href: string) => {
//     // Exact match for the main Master Data page
//     if (href === '/masterdata') {
//       return pathname === '/masterdata';
//     }

//     // Match the current page and its nested routes
//     return pathname === href || pathname.startsWith(`${href}/`);
//   };

//   return (
//     <div className="md-shell">
//       {/* Master Data Sidebar — reuses the app's own .search-bar / .sb-sec / .ni nav-item tokens */}
//       <aside className="md-side">
//         <div className="md-side-search">
//           <div className="search-bar">
//             <span style={{ color: 'var(--ink4)' }}>⌕</span>
//             <input type="text" placeholder="Search catalogs..." />
//           </div>
//         </div>

//         <div className="md-nav">
//           {MASTER_DATA_SECTIONS.map((section) => (
//             <div key={section.title} className="mb16">
//               <div className="sb-sec" style={{ padding: '4px 9px' }}>
//                 {section.title}
//               </div>

//               {section.items.map((item) => {
//                 const active = isActive(item.href);
//                 const Icon = item.icon;

//                 return (
//                   <Link
//                     key={item.href}
//                     href={item.href}
//                     className={`ni${active ? ' on' : ''}`}
//                   >
//                     {Icon && <Icon size={14} strokeWidth={active ? 2.2 : 1.8} className="ni-ic" />}
//                     <span className="ni-lb">{item.label}</span>
//                   </Link>
//                 );
//               })}
//             </div>
//           ))}
//         </div>
//       </aside>

//       {/* Master Data Content */}
//       <main className="md-main">{children}</main>
//     </div>
//   );
// }





























// 'use client';

// import Link from 'next/link';
// import { usePathname } from 'next/navigation';
// import { ReactNode, ComponentType } from 'react';

// import {
//   Building2,
//   CalendarDays,
//   CircleDollarSign,
//   FileText,
//   Globe2,
//   GraduationCap,
//   Heart,
//   House,
//   MapPin,
//   Users,
//   UserCheck,
//   UserRound,
//   BriefcaseBusiness,
//   Clock3,
//   ShieldCheck,
//   Settings2,
//   Shirt,
//   Ambulance,
//   CircleUserRound,
//   DollarSign,
//   CurrencyIcon,
// } from 'lucide-react';

// import { usePermission } from '../../features/auth/hooks/useAuth';
// import { useCompany } from '../../features/company/hooks/useCompany';

// interface MasterDataLayoutProps {
//   children: ReactNode;
// }

// interface MenuItem {
//   label: string;
//   href: string;

//   icon?: ComponentType<{
//     size?: number | string;
//     strokeWidth?: number | string;
//     className?: string;
//   }>;

//   /**
//    * User permission required to see this menu item.
//    *
//    * Example:
//    * shifts:view
//    *
//    * null = no permission restriction.
//    */
//   permission?: string | null;

//   /**
//    * Company module required to see this menu item.
//    *
//    * Example:
//    * shifts
//    *
//    * If the current company does not have this module
//    * enabled, the menu item will not be visible.
//    *
//    * undefined/null = no company-module restriction.
//    */
//   module?: string | null;
// }

// interface MenuSection {
//   title: string;
//   items: MenuItem[];
// }

// /**
//  * ============================================================
//  * MASTER DATA MENU
//  * ============================================================
//  *
//  * Visibility is controlled by TWO things:
//  *
//  * 1. Company module
//  *    - Does the current company have this module enabled?
//  *
//  * 2. User permission
//  *    - Does the logged-in user have the required permission?
//  *
//  * Example:
//  *
//  *   module: 'shifts'
//  *   permission: 'shifts:view'
//  *
//  * The item is visible only when:
//  *
//  *   Company has "shifts"
//  *              AND
//  *   User has "shifts:view"
//  *
//  * If permission is null:
//  *
//  *   Company has module
//  *              AND
//  *   permission check is skipped
//  *
//  * If module is null/undefined:
//  *
//  *   No company module restriction.
//  */
// const MASTER_DATA_SECTIONS: MenuSection[] = [
//   // ==========================================================
//   // ORGANIZATION
//   // ==========================================================
//   {
//     title: 'ORGANIZATION',

//     items: [
//       {
//         label: 'Group Profile',
//         href: '/masterdata',
//         icon: Building2,

//         // Group profile is not tied to a specific module.
//         module: null,
//         permission: null,
//       },

//       {
//         label: 'Company',
//         href: '/masterdata/company',
//         icon: Building2,

//         // Company management is not tied to a specific module.
//         module: null,
//         permission: null,
//       },

//       {
//         label: 'Departments',
//         href: '/masterdata/departments',
//         icon: BriefcaseBusiness,

//         // Company must have the departments module.
//         module: 'departments',
//         permission: null,
//       },

//       {
//         label: 'Designations',
//         href: '/masterdata/designations',
//         icon: UserCheck,

//         // Company must have the designations module.
//         module: 'designations',
//         permission: null,
//       },

//       {
//         label: 'Locations',
//         href: '/masterdata/locations',
//         icon: MapPin,

//         // Company must have the locations module.
//         module: 'locations',
//         permission: null,
//       },
//     ],
//   },

//   // ==========================================================
//   // ATTENDANCE & SHIFTS
//   // ==========================================================
//   {
//     title: 'ATTENDANCE & SHIFTS',

//     items: [
//       {
//         label: 'Shifts',
//         href: '/masterdata/shifts',
//         icon: Clock3,

//         module: 'shifts',
//         permission: 'shifts:view',
//       },

//       {
//         label: 'Weekly Offs',
//         href: '/masterdata/weekly-offs',
//         icon: CalendarDays,

//         module: 'attendance',
//         permission: null,
//       },

//       {
//         label: 'Attendance Rules',
//         href: '/masterdata/attendance-rules',
//         icon: Settings2,

//         module: 'attendance',
//         permission: null,
//       },
//     ],
//   },

//   // ==========================================================
//   // EMPLOYMENT
//   // ==========================================================
//   {
//     title: 'EMPLOYMENT',

//     items: [
//       {
//         label: 'Employee Status',
//         href: '/masterdata/employee-status',
//         icon: UserRound,

//         module: 'employees',
//         permission: null,
//       },

//       {
//         label: 'Employee Type',
//         href: '/masterdata/employee-type',
//         icon: Users,

//         module: 'employees',
//         permission: null,
//       },

//       {
//         label: 'Probation',
//         href: '/masterdata/probation',
//         icon: Clock3,

//         module: 'employees',
//         permission: null,
//       },

//       {
//         label: 'Notice Period',
//         href: '/masterdata/notice-period',
//         icon: FileText,

//         module: 'employees',
//         permission: null,
//       },

//       {
//         label: 'Exit Status',
//         href: '/masterdata/exit-status',
//         icon: UserRound,

//         module: 'employees',
//         permission: null,
//       },

//       {
//         label: 'Commitment / Bond',
//         href: '/masterdata/commitment-bond',
//         icon: ShieldCheck,

//         module: 'employees',
//         permission: null,
//       },

//       {
//         label: 'Insured Amount',
//         href: '/masterdata/insured-amount',
//         icon: CircleDollarSign,

//         module: 'employees',
//         permission: null,
//       },
//     ],
//   },

//   // ==========================================================
//   // PERSONAL
//   // ==========================================================
//   {
//     title: 'PERSONAL',

//     items: [
//       {
//         label: 'Gender',
//         href: '/masterdata/gender',
//         icon: UserRound,

//         module: 'employees',
//         permission: null,
//       },

//       {
//         label: 'Marital Status',
//         href: '/masterdata/marital-status',
//         icon: Heart,

//         module: 'employees',
//         permission: null,
//       },

//       {
//         label: 'Blood Group',
//         href: '/masterdata/blood-group',
//         icon: ShieldCheck,

//         module: 'employees',
//         permission: null,
//       },

//       {
//         label: 'Religion',
//         href: '/masterdata/religion',
//         icon: Globe2,

//         module: 'employees',
//         permission: null,
//       },

//       {
//         label: 'Nationality',
//         href: '/masterdata/nationality',
//         icon: Globe2,

//         module: 'employees',
//         permission: null,
//       },

//       {
//         label: 'Shirt / T-Shirt Size',
//         href: '/masterdata/shirt-size',
//         icon: Shirt,

//         module: 'employees',
//         permission: null,
//       },

//       {
//         label: 'Qualification',
//         href: '/masterdata/qualification',
//         icon: GraduationCap,

//         module: 'employees',
//         permission: null,
//       },

//       {
//         label: 'Education Mode',
//         href: '/masterdata/education-mode',
//         icon: GraduationCap,

//         module: 'employees',
//         permission: null,
//       },

//       {
//         label: 'House Type',
//         href: '/masterdata/house-type',
//         icon: House,

//         module: 'employees',
//         permission: null,
//       },

//       {
//         label: 'Emergency Relationship',
//         href: '/masterdata/emergency-relationship',
//         icon: Ambulance,

//         module: 'employees',
//         permission: null,
//       },

//       {
//         label: 'Salutation',
//         href: '/masterdata/salutation',
//         icon: CircleUserRound,

//         module: 'employees',
//         permission: null,
//       },
//     ],
//   },

//   // ==========================================================
//   // PAYROLL & BANKING
//   // ==========================================================
//   {
//     title: 'PAYROLL & BANKING',

//     items: [
//       {
//         label: 'Banks',
//         href: '/masterdata/banks',
//         icon: DollarSign,

//         module: 'payroll',
//         permission: null,
//       },

//       {
//         label: 'Mode of Payment',
//         href: '/masterdata/paymentmode',
//         icon: CurrencyIcon,

//         module: 'payroll',
//         permission: null,
//       },
//     ],
//   },
// ];

// export function MasterDataLayout({
//   children,
// }: MasterDataLayoutProps) {
//   const pathname = usePathname();

//   const { hasPermission } = usePermission();

//   /**
//    * ============================================================
//    * CURRENT COMPANY
//    * ============================================================
//    *
//    * useCompany() gives us the currently selected company.
//    *
//    * We use active_modules from that company to determine
//    * which Master Data modules should be visible.
//    */
//   const { company } = useCompany();

//   /**
//    * active_modules is expected to look something like:
//    *
//    * [
//    *   'employees',
//    *   'departments',
//    *   'designations',
//    *   'locations',
//    *   'shifts',
//    *   'attendance',
//    *   'payroll'
//    * ]
//    *
//    * If active_modules is empty, we keep the same fallback
//    * behavior as your main Sidebar:
//    *
//    *     empty array = module information not available
//    *
//    * Therefore we do NOT hide anything only because the array
//    * is empty.
//    */
//   const activeModules: string[] =
//     (company as any)?.active_modules ?? [];

//   /**
//    * ============================================================
//    * ROUTE ACTIVE CHECK
//    * ============================================================
//    */
//   const isActive = (href: string) => {
//     /**
//      * Main Master Data page should only be active when the
//      * pathname is exactly /masterdata.
//      *
//      * Otherwise /masterdata/company would also make
//      * /masterdata appear active.
//      */
//     if (href === '/masterdata') {
//       return pathname === '/masterdata';
//     }

//     /**
//      * For child pages and nested routes:
//      *
//      * /masterdata/departments
//      * /masterdata/departments/123
//      *
//      * both keep Departments active.
//      */
//     return (
//       pathname === href ||
//       pathname.startsWith(`${href}/`)
//     );
//   };

//   /**
//    * ============================================================
//    * MENU VISIBILITY
//    * ============================================================
//    *
//    * An item is visible when:
//    *
//    * 1. It has no module restriction
//    *    OR
//    *    the current company has that module enabled.
//    *
//    * AND
//    *
//    * 2. It has no permission restriction
//    *    OR
//    *    the user has the required permission.
//    */
//   const isMenuItemVisible = (item: MenuItem): boolean => {
//     /**
//      * ----------------------------------------------------------
//      * COMPANY MODULE CHECK
//      * ----------------------------------------------------------
//      *
//      * If a module is specified and the company has loaded
//      * active_modules, then the module must exist in that list.
//      *
//      * Example:
//      *
//      * item.module = 'shifts'
//      *
//      * company.active_modules = ['employees', 'shifts']
//      *
//      * => visible
//      *
//      * Example:
//      *
//      * item.module = 'payroll'
//      *
//      * company.active_modules = ['employees', 'shifts']
//      *
//      * => hidden
//      */
//     if (
//       item.module &&
//       activeModules.length > 0 &&
//       !activeModules.includes(item.module)
//     ) {
//       return false;
//     }

//     /**
//      * ----------------------------------------------------------
//      * USER PERMISSION CHECK
//      * ----------------------------------------------------------
//      *
//      * null / undefined / empty permission means:
//      *
//      *     no permission restriction
//      */
//     if (!item.permission) {
//       return true;
//     }

//     /**
//      * Otherwise the logged-in user must have the permission.
//      */
//     return hasPermission(item.permission);
//   };

//   return (
//     <div className="md-shell">
//       {/* ======================================================
//           MASTER DATA SIDEBAR
//           ====================================================== */}
//       <aside className="md-side">
//         {/* ====================================================
//             SEARCH
//             ==================================================== */}
//         <div className="md-side-search">
//           <div className="search-bar">
//             <span
//               style={{
//                 color: 'var(--ink4)',
//               }}
//             >
//               ⌕
//             </span>

//             <input
//               type="text"
//               placeholder="Search catalogs..."
//             />
//           </div>
//         </div>

//         {/* ====================================================
//             NAVIGATION
//             ==================================================== */}
//         <div className="md-nav">
//           {MASTER_DATA_SECTIONS.map((section) => {
//             /**
//              * First filter the items using:
//              *
//              *     Company Module
//              *          +
//              *     User Permission
//              */
//             const visibleItems =
//               section.items.filter(isMenuItemVisible);

//             /**
//              * If nothing from this section is available,
//              * don't render the section heading either.
//              */
//             if (visibleItems.length === 0) {
//               return null;
//             }

//             return (
//               <div
//                 key={section.title}
//                 className="mb16"
//               >
//                 {/* Section heading */}
//                 <div
//                   className="sb-sec"
//                   style={{
//                     padding: '4px 9px',
//                   }}
//                 >
//                   {section.title}
//                 </div>

//                 {/* Section items */}
//                 {visibleItems.map((item) => {
//                   const active = isActive(item.href);
//                   const Icon = item.icon;

//                   return (
//                     <Link
//                       key={item.href}
//                       href={item.href}
//                       className={`ni${active ? ' on' : ''}`}
//                     >
//                       {/* Icon */}
//                       {Icon && (
//                         <Icon
//                           size={14}
//                           strokeWidth={
//                             active ? 2.2 : 1.8
//                           }
//                           className="ni-ic"
//                         />
//                       )}

//                       {/* Label */}
//                       <span className="ni-lb">
//                         {item.label}
//                       </span>
//                     </Link>
//                   );
//                 })}
//               </div>
//             );
//           })}
//         </div>
//       </aside>

//       {/* ======================================================
//           MASTER DATA CONTENT
//           ====================================================== */}
//       <main className="md-main">
//         {children}
//       </main>
//     </div>
//   );
// }




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
  DollarSign,
  CurrencyIcon,
} from 'lucide-react';

import {
  usePermission,
} from '../../features/auth/hooks/useAuth';

import {
  useCompany,
} from '../../features/company/hooks/useCompany';

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

  /**
   * Personal permission required to see this item.
   *
   * Example:
   *   shifts:view
   *
   * null / undefined = no personal permission restriction.
   */
  permission?: string | null;

  /**
   * Company module required to see this item.
   *
   * Example:
   *   shifts
   *
   * The module is checked BEFORE personal permission.
   *
   * undefined / null = no company-module restriction.
   */
  module?: string | null;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

/**
 * ============================================================
 * MASTER DATA MENU
 * ============================================================
 *
 * Visibility follows the SAME logic as the main Sidebar:
 *
 * 1. Check company module first.
 * 2. If module is available, check personal permission.
 *
 * Example:
 *
 *   module: 'shifts'
 *   permission: 'shifts:view'
 *
 * Normal user:
 *
 *   Company has shifts
 *          +
 *   User has shifts:view
 *          =
 *   Visible
 *
 * If company does NOT have shifts:
 *
 *   Hidden immediately.
 *
 * Personal permission is NOT considered in that case.
 *
 * Super Admin:
 *
 *   Module restriction is bypassed.
 *
 * Empty active_modules:
 *
 *   Same fallback behavior as Sidebar:
 *   module filtering is not applied.
 */
const MASTER_DATA_SECTIONS: MenuSection[] = [
  // ==========================================================
  // ORGANIZATION
  // ==========================================================
  {
    title: 'ORGANIZATION',

    items: [
      {
        label: 'Group Profile',
        href: '/masterdata',
        icon: Building2,
        module: null,
        permission: null,
      },

      {
        label: 'Company',
        href: '/masterdata/company',
        icon: Building2,
        module: null,
        permission: null,
      },

      {
        label: 'Departments',
        href: '/masterdata/departments',
        icon: BriefcaseBusiness,
        module: 'departments',
        permission: null,
      },

      {
        label: 'Designations',
        href: '/masterdata/designations',
        icon: UserCheck,
        module: 'designations',
        permission: null,
      },

      {
        label: 'Locations',
        href: '/masterdata/locations',
        icon: MapPin,
        module: 'locations',
        permission: null,
      },
    ],
  },

  // ==========================================================
  // ATTENDANCE & SHIFTS
  // ==========================================================
  {
    title: 'ATTENDANCE & SHIFTS',

    items: [
      {
        label: 'Shifts',
        href: '/masterdata/shifts',
        icon: Clock3,
        module: 'shifts',
        permission: 'shifts:view',
      },

      {
        label: 'Weekly Offs',
        href: '/masterdata/weekly-offs',
        icon: CalendarDays,
        module: 'attendance',
        permission: null,
      },

      {
        label: 'Attendance Rules',
        href: '/masterdata/attendance-rules',
        icon: Settings2,
        module: 'attendance',
        permission: null,
      },
    ],
  },

  // ==========================================================
  // EMPLOYMENT
  // ==========================================================
  {
    title: 'EMPLOYMENT',

    items: [
      {
        label: 'Employee Status',
        href: '/masterdata/employee-status',
        icon: UserRound,
        module: 'employees',
        permission: null,
      },

      {
        label: 'Employee Type',
        href: '/masterdata/employee-type',
        icon: Users,
        module: 'employees',
        permission: null,
      },

      {
        label: 'Probation',
        href: '/masterdata/probation',
        icon: Clock3,
        module: 'employees',
        permission: null,
      },

      {
        label: 'Notice Period',
        href: '/masterdata/notice-period',
        icon: FileText,
        module: 'employees',
        permission: null,
      },

      {
        label: 'Exit Status',
        href: '/masterdata/exit-status',
        icon: UserRound,
        module: 'employees',
        permission: null,
      },

      {
        label: 'Commitment / Bond',
        href: '/masterdata/commitment-bond',
        icon: ShieldCheck,
        module: 'employees',
        permission: null,
      },

      {
        label: 'Insured Amount',
        href: '/masterdata/insured-amount',
        icon: CircleDollarSign,
        module: 'employees',
        permission: null,
      },
    ],
  },

  // ==========================================================
  // PERSONAL
  // ==========================================================
  {
    title: 'PERSONAL',

    items: [
      {
        label: 'Gender',
        href: '/masterdata/gender',
        icon: UserRound,
        module: 'employees',
        permission: null,
      },

      {
        label: 'Marital Status',
        href: '/masterdata/marital-status',
        icon: Heart,
        module: 'employees',
        permission: null,
      },

      {
        label: 'Blood Group',
        href: '/masterdata/blood-group',
        icon: ShieldCheck,
        module: 'employees',
        permission: null,
      },

      {
        label: 'Religion',
        href: '/masterdata/religion',
        icon: Globe2,
        module: 'employees',
        permission: null,
      },

      {
        label: 'Nationality',
        href: '/masterdata/nationality',
        icon: Globe2,
        module: 'employees',
        permission: null,
      },

      {
        label: 'Shirt / T-Shirt Size',
        href: '/masterdata/shirt-size',
        icon: Shirt,
        module: 'employees',
        permission: null,
      },

      {
        label: 'Qualification',
        href: '/masterdata/qualification',
        icon: GraduationCap,
        module: 'employees',
        permission: null,
      },

      {
        label: 'Education Mode',
        href: '/masterdata/education-mode',
        icon: GraduationCap,
        module: 'employees',
        permission: null,
      },

      {
        label: 'House Type',
        href: '/masterdata/house-type',
        icon: House,
        module: 'employees',
        permission: null,
      },

      {
        label: 'Emergency Relationship',
        href: '/masterdata/emergency-relationship',
        icon: Ambulance,
        module: 'employees',
        permission: null,
      },

      {
        label: 'Salutation',
        href: '/masterdata/salutation',
        icon: CircleUserRound,
        module: 'employees',
        permission: null,
      },
    ],
  },

  // ==========================================================
  // PAYROLL & BANKING
  // ==========================================================
  {
    title: 'PAYROLL & BANKING',

    items: [
      {
        label: 'Banks',
        href: '/masterdata/banks',
        icon: DollarSign,
        module: 'payroll',
        permission: null,
      },

      {
        label: 'Mode of Payment',
        href: '/masterdata/paymentmode',
        icon: CurrencyIcon,
        module: 'payroll',
        permission: null,
      },
    ],
  },
];

export function MasterDataLayout({
  children,
}: MasterDataLayoutProps) {
  const pathname = usePathname();

  /**
   * ============================================================
   * AUTHORIZATION
   * ============================================================
   */
  const { hasPermission } = usePermission();

  /**
   * ============================================================
   * CURRENT COMPANY
   * ============================================================
   *
   * This is the SAME company source used by the Sidebar.
   */
  const {
    company,
    isSuperAdmin,
  } = useCompany();

  /**
   * ============================================================
   * ACTIVE COMPANY MODULES
   * ============================================================
   *
   * Same behavior as Sidebar:
   *
   * active_modules = [] / missing
   *     -> do not apply module filtering
   *
   * active_modules = ['employees', 'shifts']
   *     -> only those modules are available
   */
  const activeModules: string[] =
    (company as any)?.active_modules ?? [];

  /**
   * ============================================================
   * ROUTE ACTIVE CHECK
   * ============================================================
   */
  const isActive = (href: string): boolean => {
    /**
     * /masterdata should ONLY be active on the exact
     * Master Data root page.
     *
     * Otherwise:
     *
     * /masterdata/company
     *
     * would also make /masterdata active.
     */
    if (href === '/masterdata') {
      return pathname === '/masterdata';
    }

    /**
     * For nested routes:
     *
     * /masterdata/departments
     * /masterdata/departments/123
     *
     * Departments remains active.
     */
    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  };

  /**
   * ============================================================
   * MENU VISIBILITY
   * ============================================================
   *
   * IMPORTANT:
   *
   * This intentionally follows the Sidebar order.
   *
   * STEP 1
   * -------
   * Check company module.
   *
   * STEP 2
   * -------
   * If module is available, check personal permission.
   */
  const isMenuItemVisible = (
    item: MenuItem,
  ): boolean => {
    /**
     * ----------------------------------------------------------
     * STEP 1: SUPER ADMIN
     * ----------------------------------------------------------
     *
     * Same principle as Sidebar:
     * Super Admin is not restricted by company modules.
     */
    if (isSuperAdmin) {
      /**
       * Permission is still evaluated only when the item
       * actually has a permission requirement.
       *
       * If permission is null, it is visible.
       */
      if (!item.permission) {
        return true;
      }

      return hasPermission(item.permission);
    }

    /**
     * ----------------------------------------------------------
     * STEP 2: COMPANY MODULE CHECK
     * ----------------------------------------------------------
     *
     * This MUST happen before permission.
     *
     * Example:
     *
     * module = 'shifts'
     *
     * activeModules = ['employees']
     *
     * => false
     *
     * We do NOT call hasPermission('shifts:view').
     */
    if (
      item.module &&
      activeModules.length > 0 &&
      !activeModules.includes(item.module)
    ) {
      return false;
    }

    /**
     * ----------------------------------------------------------
     * STEP 3: PERSONAL PERMISSION CHECK
     * ----------------------------------------------------------
     *
     * No permission means no personal restriction.
     */
    if (!item.permission) {
      return true;
    }

    /**
     * Company module is available, so now check
     * the logged-in user's permission.
     */
    return hasPermission(item.permission);
  };

  return (
    <div className="md-shell">
      {/* ======================================================
          MASTER DATA SIDEBAR
          ====================================================== */}
      <aside className="md-side">
        {/* ====================================================
            SEARCH
            ==================================================== */}
        <div className="md-side-search">
          <div className="search-bar">
            <span
              style={{
                color: 'var(--ink4)',
              }}
            >
              ⌕
            </span>

            <input
              type="text"
              placeholder="Search catalogs..."
            />
          </div>
        </div>

        {/* ====================================================
            NAVIGATION
            ==================================================== */}
        <div className="md-nav">
          {MASTER_DATA_SECTIONS.map((section) => {
            /**
             * Filter using the exact authorization flow:
             *
             * Company module
             *       ↓
             * Personal permission
             */
            const visibleItems =
              section.items.filter(isMenuItemVisible);

            /**
             * Do not render an empty section.
             */
            if (visibleItems.length === 0) {
              return null;
            }

            return (
              <div
                key={section.title}
                className="mb16"
              >
                {/* Section heading */}
                <div
                  className="sb-sec"
                  style={{
                    padding: '4px 9px',
                  }}
                >
                  {section.title}
                </div>

                {/* Section items */}
                {visibleItems.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`ni${active ? ' on' : ''}`}
                    >
                      {/* Icon */}
                      {Icon && (
                        <Icon
                          size={14}
                          strokeWidth={
                            active ? 2.2 : 1.8
                          }
                          className="ni-ic"
                        />
                      )}

                      {/* Label */}
                      <span className="ni-lb">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </aside>

      {/* ======================================================
          MASTER DATA CONTENT
          ====================================================== */}
      <main className="md-main">
        {children}
      </main>
    </div>
  );
}