// src/components/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, FolderIcon, UsersIcon, PencilIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

export default function Sidebar() {
  const pathname = usePathname();
  
  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Projects', href: '/projects', icon: FolderIcon },
    { name: 'Personas', href: '/personas', icon: UsersIcon },
    { name: 'Annotation', href: '/annotation', icon: PencilIcon },
    { name: 'Settings', href: '/settings', icon: AdjustmentsHorizontalIcon },
  ];
  
  return (
    <div className="w-64 bg-gray-800 text-white">
      <div className="p-4">
        <h1 className="text-xl font-bold">Annotation Platform</h1>
      </div>
      <nav className="mt-8">
        <ul>
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name} className="mb-2">
                <Link
                  href={item.href}
                  className={`flex items-center px-4 py-2 ${
                    isActive ? 'bg-gray-700' : 'hover:bg-gray-700'
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
