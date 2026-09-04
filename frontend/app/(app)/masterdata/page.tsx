// import { MasterDataLayout } from '@/components/layout/MasterDataLayout'
// import { AppShell } from '@/layouts/AppLayout'
// import React from 'react'

// const page = () => {
//     return (
//         <AppShell>
//             <MasterDataLayout>

//                 <div>page</div>
//             </MasterDataLayout>
//         </AppShell>
//     )
// }

// export default page


import React from 'react';
import { AppShell } from '@/layouts/AppLayout';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import {
  Building2,
  MapPin,
  Pencil,
  ExternalLink,
} from 'lucide-react';

const Page = () => {
  return (
    <AppShell>
      <MasterDataLayout>
        <div className="flex h-full min-h-0 flex-col bg-white">
          {/* Page Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3">
            <div>
              <h1 className="text-[16px] font-semibold text-gray-900">
                Group Profile
              </h1>

              <p className="mt-0.5 text-[12px] text-gray-400">
                Parent group shown on Candidate Portal · Company & team
              </p>
            </div>

            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[9px] font-semibold tracking-wide text-gray-400">
              AUTO-SAVE ON
            </span>
          </div>

          {/* Content */}
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {/* Group Profile Card */}
            <div className="relative">
              {/* Edit Button */}
              <button
                type="button"
                className="absolute right-0 top-0 flex h-7 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 text-[11px] font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                <Pencil size={12} strokeWidth={1.8} />
                Edit
              </button>

              {/* Group Identity */}
              <div className="flex items-start gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50">
                  <Building2
                    size={20}
                    strokeWidth={1.6}
                    className="text-blue-600"
                  />
                </div>

                <div className="pt-0.5">
                  <h2 className="text-[17px] font-semibold text-gray-900">
                    UNG Group
                  </h2>

                  <p className="mt-1 max-w-3xl text-[12px] leading-5 text-gray-400">
                    A multi-company group building products and services across
                    trade, healthcare, sustainability, and workforce compliance.
                  </p>
                </div>
              </div>

              {/* About */}
              <div className="mt-5 max-w-2xl">
                <div className="mb-2 text-[10px] font-semibold tracking-[0.08em] text-gray-400">
                  ABOUT
                </div>

                <p className="text-[13px] leading-5 text-gray-600">
                  UNG Group brings together Narula Exports, Med Freshe,
                  Greenvac Solutions, and Collar Check under one leadership
                  umbrella. Our companies share a common HQ campus in Punjab
                  Bagh, New Delhi, and collaborate on talent, operations, and
                  growth.
                </p>
              </div>

              {/* Details */}
              <div className="mt-6 grid max-w-4xl grid-cols-2 gap-x-16 gap-y-5">
                {/* Established */}
                <div>
                  <div className="mb-1 text-[10px] font-semibold tracking-[0.08em] text-gray-400">
                    ESTABLISHED
                  </div>

                  <div className="text-[13px] font-medium text-gray-900">
                    1998
                  </div>
                </div>

                {/* Active Companies */}
                <div>
                  <div className="mb-1 text-[10px] font-semibold tracking-[0.08em] text-gray-400">
                    ACTIVE COMPANIES
                  </div>

                  <div className="text-[13px] font-medium text-gray-900">
                    4
                  </div>
                </div>

                {/* Email */}
                <div>
                  <div className="mb-1 text-[10px] font-semibold tracking-[0.08em] text-gray-400">
                    EMAIL
                  </div>

                  <a
                    href="mailto:info@ungg​roup.com"
                    className="text-[13px] font-medium text-gray-900 hover:text-blue-600"
                  >
                    info@unggroup.com
                  </a>
                </div>

                {/* Website */}
                <div>
                  <div className="mb-1 text-[10px] font-semibold tracking-[0.08em] text-gray-400">
                    WEBSITE
                  </div>

                  <a
                    href="https://www.unggroup.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[13px] font-medium text-blue-600 hover:text-blue-700"
                  >
                    https://www.unggroup.com
                    <ExternalLink size={11} />
                  </a>
                </div>

                {/* HQ Address */}
                <div className="col-span-2">
                  <div className="mb-1 text-[10px] font-semibold tracking-[0.08em] text-gray-400">
                    HQ ADDRESS
                  </div>

                  <div className="text-[13px] font-medium text-gray-900">
                    UNG Tower, Building No. 2&3, Central Market, Punjabi Bagh
                    West, New Delhi-110026, INDIA
                  </div>
                </div>

                {/* Google Maps */}
                <div className="col-span-2">
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.08em] text-gray-400">
                    <MapPin size={11} />
                    GOOGLE MAPS
                  </div>

                  <a
                    href="#"
                    className="text-[13px] font-medium text-blue-600 hover:text-blue-700"
                  >
                    Open map
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MasterDataLayout>
    </AppShell>
  );
};

export default Page;