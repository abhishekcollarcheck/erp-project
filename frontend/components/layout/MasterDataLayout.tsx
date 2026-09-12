
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

// import {
//   usePermission,
// } from '../../features/auth/hooks/useAuth';

// import {
//   useCompany,
// } from '../../features/company/hooks/useCompany';

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
//    * Personal permission required to see this item.
//    *
//    * Example:
//    *   shifts:view
//    *
//    * null / undefined = no personal permission restriction.
//    */
//   permission?: string | null;

//   /**
//    * Company module required to see this item.
//    *
//    * Example:
//    *   shifts
//    *
//    * The module is checked BEFORE personal permission.
//    *
//    * undefined / null = no company-module restriction.
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
//  * Visibility follows the SAME logic as the main Sidebar:
//  *
//  * 1. Check company module first.
//  * 2. If module is available, check personal permission.
//  *
//  * Example:
//  *
//  *   module: 'shifts'
//  *   permission: 'shifts:view'
//  *
//  * Normal user:
//  *
//  *   Company has shifts
//  *          +
//  *   User has shifts:view
//  *          =
//  *   Visible
//  *
//  * If company does NOT have shifts:
//  *
//  *   Hidden immediately.
//  *
//  * Personal permission is NOT considered in that case.
//  *
//  * Super Admin:
//  *
//  *   Module restriction is bypassed.
//  *
//  * Empty active_modules:
//  *
//  *   Same fallback behavior as Sidebar:
//  *   module filtering is not applied.
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
//         module: null,
//         permission: null,
//       },

//       {
//         label: 'Company',
//         href: '/masterdata/company',
//         icon: Building2,
//         module: null,
//         permission: null,
//       },

//       {
//         label: 'Departments',
//         href: '/masterdata/departments',
//         icon: BriefcaseBusiness,
//         module: 'departments',
//         permission: null,
//       },

//       {
//         label: 'Designations',
//         href: '/masterdata/designations',
//         icon: UserCheck,
//         module: 'designations',
//         permission: null,
//       },

//       {
//         label: 'Locations',
//         href: '/masterdata/locations',
//         icon: MapPin,
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

//   /**
//    * ============================================================
//    * AUTHORIZATION
//    * ============================================================
//    */
//   const { hasPermission } = usePermission();

//   /**
//    * ============================================================
//    * CURRENT COMPANY
//    * ============================================================
//    *
//    * This is the SAME company source used by the Sidebar.
//    */
//   const {
//     company,
//     isSuperAdmin,
//   } = useCompany();

//   /**
//    * ============================================================
//    * ACTIVE COMPANY MODULES
//    * ============================================================
//    *
//    * Same behavior as Sidebar:
//    *
//    * active_modules = [] / missing
//    *     -> do not apply module filtering
//    *
//    * active_modules = ['employees', 'shifts']
//    *     -> only those modules are available
//    */
//   const activeModules: string[] =
//     (company as any)?.active_modules ?? [];

//   /**
//    * ============================================================
//    * ROUTE ACTIVE CHECK
//    * ============================================================
//    */
//   const isActive = (href: string): boolean => {
//     /**
//      * /masterdata should ONLY be active on the exact
//      * Master Data root page.
//      *
//      * Otherwise:
//      *
//      * /masterdata/company
//      *
//      * would also make /masterdata active.
//      */
//     if (href === '/masterdata') {
//       return pathname === '/masterdata';
//     }

//     /**
//      * For nested routes:
//      *
//      * /masterdata/departments
//      * /masterdata/departments/123
//      *
//      * Departments remains active.
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
//    * IMPORTANT:
//    *
//    * This intentionally follows the Sidebar order.
//    *
//    * STEP 1
//    * -------
//    * Check company module.
//    *
//    * STEP 2
//    * -------
//    * If module is available, check personal permission.
//    */
//   const isMenuItemVisible = (
//     item: MenuItem,
//   ): boolean => {
//     /**
//      * ----------------------------------------------------------
//      * STEP 1: SUPER ADMIN
//      * ----------------------------------------------------------
//      *
//      * Same principle as Sidebar:
//      * Super Admin is not restricted by company modules.
//      */
//     if (isSuperAdmin) {
//       /**
//        * Permission is still evaluated only when the item
//        * actually has a permission requirement.
//        *
//        * If permission is null, it is visible.
//        */
//       if (!item.permission) {
//         return true;
//       }

//       return hasPermission(item.permission);
//     }

//     /**
//      * ----------------------------------------------------------
//      * STEP 2: COMPANY MODULE CHECK
//      * ----------------------------------------------------------
//      *
//      * This MUST happen before permission.
//      *
//      * Example:
//      *
//      * module = 'shifts'
//      *
//      * activeModules = ['employees']
//      *
//      * => false
//      *
//      * We do NOT call hasPermission('shifts:view').
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
//      * STEP 3: PERSONAL PERMISSION CHECK
//      * ----------------------------------------------------------
//      *
//      * No permission means no personal restriction.
//      */
//     if (!item.permission) {
//       return true;
//     }

//     /**
//      * Company module is available, so now check
//      * the logged-in user's permission.
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
//              * Filter using the exact authorization flow:
//              *
//              * Company module
//              *       ↓
//              * Personal permission
//              */
//             const visibleItems =
//               section.items.filter(isMenuItemVisible);

//             /**
//              * Do not render an empty section.
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

// import {
//   usePermission,
// } from '../../features/auth/hooks/useAuth';

// import {
//   useCompany,
// } from '../../features/company/hooks/useCompany';

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
//    * Personal permission required to see this item.
//    *
//    * Example:
//    *   shifts:view
//    *
//    * null / undefined = no personal permission restriction.
//    */
//   permission?: string | null;

//   /**
//    * Company module required to see this item.
//    *
//    * Example:
//    *   shifts
//    *
//    * The module is checked BEFORE personal permission.
//    *
//    * undefined / null = no company-module restriction.
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
//  * Visibility follows the SAME logic as the main Sidebar:
//  *
//  * 1. Check company module first.
//  * 2. If module is available, check personal permission.
//  *
//  * Example:
//  *
//  *   module: 'shifts'
//  *   permission: 'shifts:view'
//  *
//  * Normal user:
//  *
//  *   Company has shifts
//  *          +
//  *   User has shifts:view
//  *          =
//  *   Visible
//  *
//  * If company does NOT have shifts:
//  *
//  *   Hidden immediately.
//  *
//  * Personal permission is NOT considered in that case.
//  *
//  * Super Admin:
//  *
//  *   Module restriction is bypassed.
//  *
//  * Empty active_modules:
//  *
//  *   Same fallback behavior as Sidebar:
//  *   module filtering is not applied.
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
//         module: null,
//         permission: null,
//       },

//       {
//         label: 'Company',
//         href: '/masterdata/company',
//         icon: Building2,
//         module: null,
//         permission: null,
//       },

//       {
//         label: 'Departments',
//         href: '/masterdata/departments',
//         icon: BriefcaseBusiness,
//         module: 'departments',
//         permission: null,
//       },

//       {
//         label: 'Designations',
//         href: '/masterdata/designations',
//         icon: UserCheck,
//         module: 'designations',
//         permission: null,
//       },

//       {
//         label: 'Locations',
//         href: '/masterdata/locations',
//         icon: MapPin,
//         // Same two-step pattern as Shifts below: company module gate first,
//         // then the user's own permission. 'locations' here is the OLD
//         // company-feature-module string (company.active_modules) — a
//         // different system from the hr_modules/dynamic-field module slug
//         // ('location', singular) used for field-level permissions on the
//         // Locations page itself. Don't conflate the two.
//         module: 'location',
//         permission: 'location:view',
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

//   /**
//    * ============================================================
//    * AUTHORIZATION
//    * ============================================================
//    */
//   const { hasPermission } = usePermission();

//   /**
//    * ============================================================
//    * CURRENT COMPANY
//    * ============================================================
//    *
//    * This is the SAME company source used by the Sidebar.
//    */
//   const {
//     company,
//     isSuperAdmin,
//   } = useCompany();

//   /**
//    * ============================================================
//    * ACTIVE COMPANY MODULES
//    * ============================================================
//    *
//    * Same behavior as Sidebar:
//    *
//    * active_modules = [] / missing
//    *     -> do not apply module filtering
//    *
//    * active_modules = ['employees', 'shifts']
//    *     -> only those modules are available
//    */
//   const activeModules: string[] =
//     (company as any)?.active_modules ?? [];

//   /**
//    * ============================================================
//    * ROUTE ACTIVE CHECK
//    * ============================================================
//    */
//   const isActive = (href: string): boolean => {
//     /**
//      * /masterdata should ONLY be active on the exact
//      * Master Data root page.
//      *
//      * Otherwise:
//      *
//      * /masterdata/company
//      *
//      * would also make /masterdata active.
//      */
//     if (href === '/masterdata') {
//       return pathname === '/masterdata';
//     }

//     /**
//      * For nested routes:
//      *
//      * /masterdata/departments
//      * /masterdata/departments/123
//      *
//      * Departments remains active.
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
//    * IMPORTANT:
//    *
//    * This intentionally follows the Sidebar order.
//    *
//    * STEP 1
//    * -------
//    * Check company module.
//    *
//    * STEP 2
//    * -------
//    * If module is available, check personal permission.
//    */
//   const isMenuItemVisible = (
//     item: MenuItem,
//   ): boolean => {
//     /**
//      * ----------------------------------------------------------
//      * STEP 1: SUPER ADMIN
//      * ----------------------------------------------------------
//      *
//      * Same principle as Sidebar:
//      * Super Admin is not restricted by company modules.
//      */
//     if (isSuperAdmin) {
//       /**
//        * Permission is still evaluated only when the item
//        * actually has a permission requirement.
//        *
//        * If permission is null, it is visible.
//        */
//       if (!item.permission) {
//         return true;
//       }

//       return hasPermission(item.permission);
//     }

//     /**
//      * ----------------------------------------------------------
//      * STEP 2: COMPANY MODULE CHECK
//      * ----------------------------------------------------------
//      *
//      * This MUST happen before permission.
//      *
//      * Example:
//      *
//      * module = 'shifts'
//      *
//      * activeModules = ['employees']
//      *
//      * => false
//      *
//      * We do NOT call hasPermission('shifts:view').
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
//      * STEP 3: PERSONAL PERMISSION CHECK
//      * ----------------------------------------------------------
//      *
//      * No permission means no personal restriction.
//      */
//     if (!item.permission) {
//       return true;
//     }

//     /**
//      * Company module is available, so now check
//      * the logged-in user's permission.
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
//              * Filter using the exact authorization flow:
//              *
//              * Company module
//              *       ↓
//              * Personal permission
//              */
//             const visibleItems =
//               section.items.filter(isMenuItemVisible);

//             /**
//              * Do not render an empty section.
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

// import {
//   usePermission,
// } from '../../features/auth/hooks/useAuth';

// import {
//   useCompany,
// } from '../../features/company/hooks/useCompany';

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
//    * Personal permission required to see this item.
//    *
//    * Example:
//    *   shifts:view
//    *
//    * null / undefined = no personal permission restriction.
//    */
//   permission?: string | null;

//   /**
//    * Company module required to see this item.
//    *
//    * Example:
//    *   shifts
//    *
//    * The module is checked BEFORE personal permission.
//    *
//    * undefined / null = no company-module restriction.
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
//  * Visibility follows the SAME logic as the main Sidebar:
//  *
//  * 1. Check company module first.
//  * 2. If module is available, check personal permission.
//  *
//  * Example:
//  *
//  *   module: 'shifts'
//  *   permission: 'shifts:view'
//  *
//  * Normal user:
//  *
//  *   Company has shifts
//  *          +
//  *   User has shifts:view
//  *          =
//  *   Visible
//  *
//  * If company does NOT have shifts:
//  *
//  *   Hidden immediately.
//  *
//  * Personal permission is NOT considered in that case.
//  *
//  * Super Admin:
//  *
//  *   Module restriction is bypassed.
//  *
//  * Empty active_modules:
//  *
//  *   Same fallback behavior as Sidebar:
//  *   module filtering is not applied.
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
//         module: null,
//         permission: null,
//       },

//       {
//         label: 'Company',
//         href: '/masterdata/company',
//         icon: Building2,
//         // Same pattern as Locations/Shifts: module string matches the
//         // hr_modules.slug ('company', singular) used for field-level
//         // permissions on CompanyPage itself, and the permission slug
//         // matches what's actually granted in system_permissions.
//         module: 'company',
//         permission: 'company:view',
//       },

//       {
//         label: 'Departments',
//         href: '/masterdata/departments',
//         icon: BriefcaseBusiness,
//         module: 'departments',
//         permission: null,
//       },

//       {
//         label: 'Designations',
//         href: '/masterdata/designations',
//         icon: UserCheck,
//         module: 'designations',
//         permission: null,
//       },

//       {
//         label: 'Locations',
//         href: '/masterdata/locations',
//         icon: MapPin,
//         // Backend sends the module string AND permission slugs as 'location'
//         // (singular) — matches hr_modules.slug and system_permissions.
//         // Both module and permission were 'locations' (plural) before,
//         // which silently failed every check (module gate in this sidebar,
//         // and canCreate/canEdit/canDelete('locations') on the page itself)
//         // regardless of what was actually granted.
//         module: 'location',
//         permission: 'location:view',
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

//   /**
//    * ============================================================
//    * AUTHORIZATION
//    * ============================================================
//    */
//   const { hasPermission } = usePermission();

//   /**
//    * ============================================================
//    * CURRENT COMPANY
//    * ============================================================
//    *
//    * This is the SAME company source used by the Sidebar.
//    */
//   const {
//     company,
//     isSuperAdmin,
//   } = useCompany();

//   /**
//    * ============================================================
//    * ACTIVE COMPANY MODULES
//    * ============================================================
//    *
//    * Same behavior as Sidebar:
//    *
//    * active_modules = [] / missing
//    *     -> do not apply module filtering
//    *
//    * active_modules = ['employees', 'shifts']
//    *     -> only those modules are available
//    */
//   const activeModules: string[] =
//     (company as any)?.active_modules ?? [];

//   /**
//    * ============================================================
//    * ROUTE ACTIVE CHECK
//    * ============================================================
//    */
//   const isActive = (href: string): boolean => {
//     /**
//      * /masterdata should ONLY be active on the exact
//      * Master Data root page.
//      *
//      * Otherwise:
//      *
//      * /masterdata/company
//      *
//      * would also make /masterdata active.
//      */
//     if (href === '/masterdata') {
//       return pathname === '/masterdata';
//     }

//     /**
//      * For nested routes:
//      *
//      * /masterdata/departments
//      * /masterdata/departments/123
//      *
//      * Departments remains active.
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
//    * IMPORTANT:
//    *
//    * This intentionally follows the Sidebar order.
//    *
//    * STEP 1
//    * -------
//    * Check company module.
//    *
//    * STEP 2
//    * -------
//    * If module is available, check personal permission.
//    */
//   const isMenuItemVisible = (
//     item: MenuItem,
//   ): boolean => {
//     /**
//      * ----------------------------------------------------------
//      * STEP 1: SUPER ADMIN
//      * ----------------------------------------------------------
//      *
//      * Same principle as Sidebar:
//      * Super Admin is not restricted by company modules.
//      */
//     if (isSuperAdmin) {
//       /**
//        * Permission is still evaluated only when the item
//        * actually has a permission requirement.
//        *
//        * If permission is null, it is visible.
//        */
//       if (!item.permission) {
//         return true;
//       }

//       return hasPermission(item.permission);
//     }

//     /**
//      * ----------------------------------------------------------
//      * STEP 2: COMPANY MODULE CHECK
//      * ----------------------------------------------------------
//      *
//      * This MUST happen before permission.
//      *
//      * Example:
//      *
//      * module = 'shifts'
//      *
//      * activeModules = ['employees']
//      *
//      * => false
//      *
//      * We do NOT call hasPermission('shifts:view').
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
//      * STEP 3: PERSONAL PERMISSION CHECK
//      * ----------------------------------------------------------
//      *
//      * No permission means no personal restriction.
//      */
//     if (!item.permission) {
//       return true;
//     }

//     /**
//      * Company module is available, so now check
//      * the logged-in user's permission.
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
//              * Filter using the exact authorization flow:
//              *
//              * Company module
//              *       ↓
//              * Personal permission
//              */
//             const visibleItems =
//               section.items.filter(isMenuItemVisible);

//             /**
//              * Do not render an empty section.
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

// import {
//   usePermission,
// } from '../../features/auth/hooks/useAuth';

// import {
//   useCompany,
// } from '../../features/company/hooks/useCompany';

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
//    * Personal permission required to see this item.
//    *
//    * Example:
//    *   shifts:view
//    *
//    * null / undefined = no personal permission restriction.
//    */
//   permission?: string | null;

//   /**
//    * Company module required to see this item.
//    *
//    * Example:
//    *   shifts
//    *
//    * The module is checked BEFORE personal permission.
//    *
//    * undefined / null = no company-module restriction.
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
//  * Visibility follows the SAME logic as the main Sidebar:
//  *
//  * 1. Check company module first.
//  * 2. If module is available, check personal permission.
//  *
//  * Example:
//  *
//  *   module: 'shifts'
//  *   permission: 'shifts:view'
//  *
//  * Normal user:
//  *
//  *   Company has shifts
//  *          +
//  *   User has shifts:view
//  *          =
//  *   Visible
//  *
//  * If company does NOT have shifts:
//  *
//  *   Hidden immediately.
//  *
//  * Personal permission is NOT considered in that case.
//  *
//  * Super Admin:
//  *
//  *   Module restriction is bypassed.
//  *
//  * Empty active_modules:
//  *
//  *   Same fallback behavior as Sidebar:
//  *   module filtering is not applied.
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
//         module: null,
//         permission: null,
//       },

//       {
//         label: 'Company',
//         href: '/masterdata/company',
//         icon: Building2,
//         // Same pattern as Locations/Shifts: module string matches the
//         // hr_modules.slug ('company', singular) used for field-level
//         // permissions on CompanyPage itself, and the permission slug
//         // matches what's actually granted in system_permissions.
//         module: 'company',
//         permission: 'company:view',
//       },

//       {
//         label: 'Departments',
//         href: '/masterdata/departments',
//         icon: BriefcaseBusiness,
//         // Singular 'department' — matches hr_modules.slug and the
//         // department:view/create/edit/delete/download slugs seeded in
//         // system_permissions (same lesson as Location: plural silently
//         // fails every check regardless of what's actually granted).
//         module: 'department',
//         permission: 'department:view',
//       },

//       {
//         label: 'Designations',
//         href: '/masterdata/designations',
//         icon: UserCheck,
//         module: 'designations',
//         permission: null,
//       },

//       {
//         label: 'Locations',
//         href: '/masterdata/locations',
//         icon: MapPin,
//         // Backend sends the module string AND permission slugs as 'location'
//         // (singular) — matches hr_modules.slug and system_permissions.
//         // Both module and permission were 'locations' (plural) before,
//         // which silently failed every check (module gate in this sidebar,
//         // and canCreate/canEdit/canDelete('locations') on the page itself)
//         // regardless of what was actually granted.
//         module: 'location',
//         permission: 'location:view',
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
//         // module stays 'employees' — matches every sibling entry in this
//         // section (Gender, Blood Group, Notice Period, ...) and the coarse
//         // CompanyModule/active_modules toggle list, which only has broad
//         // entries (employees, department, attendance, ...), not one per
//         // lookup table. permission is the separate, fine-grained personal-
//         // permission slug tied to the new hr_modules/field-permission catalog.
//         module: 'employees',
//         permission: 'employee_status:view',
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

//   /**
//    * ============================================================
//    * AUTHORIZATION
//    * ============================================================
//    */
//   const { hasPermission } = usePermission();

//   /**
//    * ============================================================
//    * CURRENT COMPANY
//    * ============================================================
//    *
//    * This is the SAME company source used by the Sidebar.
//    */
//   const {
//     company,
//     isSuperAdmin,
//   } = useCompany();

//   /**
//    * ============================================================
//    * ACTIVE COMPANY MODULES
//    * ============================================================
//    *
//    * Same behavior as Sidebar:
//    *
//    * active_modules = [] / missing
//    *     -> do not apply module filtering
//    *
//    * active_modules = ['employees', 'shifts']
//    *     -> only those modules are available
//    */
//   const activeModules: string[] =
//     (company as any)?.active_modules ?? [];

//   /**
//    * ============================================================
//    * ROUTE ACTIVE CHECK
//    * ============================================================
//    */
//   const isActive = (href: string): boolean => {
//     /**
//      * /masterdata should ONLY be active on the exact
//      * Master Data root page.
//      *
//      * Otherwise:
//      *
//      * /masterdata/company
//      *
//      * would also make /masterdata active.
//      */
//     if (href === '/masterdata') {
//       return pathname === '/masterdata';
//     }

//     /**
//      * For nested routes:
//      *
//      * /masterdata/departments
//      * /masterdata/departments/123
//      *
//      * Departments remains active.
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
//    * IMPORTANT:
//    *
//    * This intentionally follows the Sidebar order.
//    *
//    * STEP 1
//    * -------
//    * Check company module.
//    *
//    * STEP 2
//    * -------
//    * If module is available, check personal permission.
//    */
//   const isMenuItemVisible = (
//     item: MenuItem,
//   ): boolean => {
//     /**
//      * ----------------------------------------------------------
//      * STEP 1: SUPER ADMIN
//      * ----------------------------------------------------------
//      *
//      * Same principle as Sidebar:
//      * Super Admin is not restricted by company modules.
//      */
//     if (isSuperAdmin) {
//       /**
//        * Permission is still evaluated only when the item
//        * actually has a permission requirement.
//        *
//        * If permission is null, it is visible.
//        */
//       if (!item.permission) {
//         return true;
//       }

//       return hasPermission(item.permission);
//     }

//     /**
//      * ----------------------------------------------------------
//      * STEP 2: COMPANY MODULE CHECK
//      * ----------------------------------------------------------
//      *
//      * This MUST happen before permission.
//      *
//      * Example:
//      *
//      * module = 'shifts'
//      *
//      * activeModules = ['employees']
//      *
//      * => false
//      *
//      * We do NOT call hasPermission('shifts:view').
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
//      * STEP 3: PERSONAL PERMISSION CHECK
//      * ----------------------------------------------------------
//      *
//      * No permission means no personal restriction.
//      */
//     if (!item.permission) {
//       return true;
//     }

//     /**
//      * Company module is available, so now check
//      * the logged-in user's permission.
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
//              * Filter using the exact authorization flow:
//              *
//              * Company module
//              *       ↓
//              * Personal permission
//              */
//             const visibleItems =
//               section.items.filter(isMenuItemVisible);

//             /**
//              * Do not render an empty section.
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
        // Same pattern as Locations/Shifts: module string matches the
        // hr_modules.slug ('company', singular) used for field-level
        // permissions on CompanyPage itself, and the permission slug
        // matches what's actually granted in system_permissions.
        module: 'company',
        permission: 'company:view',
      },

      {
        label: 'Departments',
        href: '/masterdata/departments',
        icon: BriefcaseBusiness,
        // Singular 'department' — matches hr_modules.slug and the
        // department:view/create/edit/delete/download slugs seeded in
        // system_permissions (same lesson as Location: plural silently
        // fails every check regardless of what's actually granted).
        module: 'department',
        permission: 'department:view',
      },

      {
        label: 'Designations',
        href: '/masterdata/designations',
        icon: UserCheck,
        // Singular 'designation' — matches hr_modules.slug and the
        // designation:view/create/edit/delete/download slugs seeded in
        // system_permissions.
        module: 'designation',
        permission: 'designation:view',
      },

      {
        label: 'Locations',
        href: '/masterdata/locations',
        icon: MapPin,
        // Backend sends the module string AND permission slugs as 'location'
        // (singular) — matches hr_modules.slug and system_permissions.
        // Both module and permission were 'locations' (plural) before,
        // which silently failed every check (module gate in this sidebar,
        // and canCreate/canEdit/canDelete('locations') on the page itself)
        // regardless of what was actually granted.
        module: 'location',
        permission: 'location:view',
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
        permission: 'weekly_off:view',
      },

      {
        label: 'Attendance Rules',
        href: '/masterdata/attendance-rules',
        icon: Settings2,
        module: 'attendance',
        permission: 'attendance_rule:view',
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
        // module stays 'employees' — matches every sibling entry in this
        // section (Gender, Blood Group, Notice Period, ...) and the coarse
        // CompanyModule/active_modules toggle list, which only has broad
        // entries (employees, department, attendance, ...), not one per
        // lookup table. permission is the separate, fine-grained personal-
        // permission slug tied to the new hr_modules/field-permission catalog.
        module: 'employees',
        permission: 'employee_status:view',
      },

      {
        label: 'Employee Type',
        href: '/masterdata/employee-type',
        icon: Users,
        module: 'employees',
        permission: 'employee_type:view',
      },

      {
        label: 'Probation',
        href: '/masterdata/probation',
        icon: Clock3,
        module: 'employees',
        permission: 'probation:view',
      },

      {
        label: 'Notice Period',
        href: '/masterdata/notice-period',
        icon: FileText,
        module: 'employees',
        permission: 'notice_period:view',
      },

      {
        label: 'Exit Status',
        href: '/masterdata/exit-status',
        icon: UserRound,
        module: 'employees',
        permission: 'exit_status:view',
      },

      {
        label: 'Commitment / Bond',
        href: '/masterdata/commitment-bond',
        icon: ShieldCheck,
        module: 'employees',
        permission: 'bond:view',
      },

      {
        label: 'Insured Amount',
        href: '/masterdata/insured-amount',
        icon: CircleDollarSign,
        module: 'employees',
        permission: 'insured_amount:view',
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
        permission: 'gender:view',
      },

      {
        label: 'Marital Status',
        href: '/masterdata/marital-status',
        icon: Heart,
        module: 'employees',
        permission: 'marital_status:view',
      },

      {
        label: 'Blood Group',
        href: '/masterdata/blood-group',
        icon: ShieldCheck,
        module: 'employees',
        permission: 'blood_group:view',
      },

      {
        label: 'Religion',
        href: '/masterdata/religion',
        icon: Globe2,
        module: 'employees',
        permission: 'religion:view',
      },

      {
        label: 'Nationality',
        href: '/masterdata/nationality',
        icon: Globe2,
        module: 'employees',
        permission: 'nationality:view',
      },

      {
        label: 'Shirt / T-Shirt Size',
        href: '/masterdata/shirt-size',
        icon: Shirt,
        module: 'employees',
        permission: 'shirt_size:view',
      },

      {
        label: 'Qualification',
        href: '/masterdata/qualification',
        icon: GraduationCap,
        module: 'employees',
        permission: 'qualification:view',
      },

      {
        label: 'Education Mode',
        href: '/masterdata/education-mode',
        icon: GraduationCap,
        module: 'employees',
        permission: 'education_mode:view',
      },

      {
        label: 'House Type',
        href: '/masterdata/house-type',
        icon: House,
        module: 'employees',
        permission: 'house_type:view',
      },

      {
        label: 'Emergency Relationship',
        href: '/masterdata/emergency-relationship',
        icon: Ambulance,
        module: 'employees',
        permission: 'emergency_relationship:view',
      },

      {
        label: 'Salutation',
        href: '/masterdata/salutation',
        icon: CircleUserRound,
        module: 'employees',
        permission: 'salutation:view',
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
        permission: 'bank:view',
      },

      {
        label: 'Mode of Payment',
        href: '/masterdata/paymentmode',
        icon: CurrencyIcon,
        module: 'payroll',
        permission: 'mode_of_payment:view',
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