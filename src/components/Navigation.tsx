'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex gap-6">
        <Link 
          href="/"
          className={`hover:text-blue-400 ${isActive('/') ? 'text-blue-400' : ''}`}
        >
          Home
        </Link>
        <Link 
          href="/stocks"
          className={`hover:text-blue-400 ${isActive('/stocks') ? 'text-blue-400' : ''}`}
        >
          Stocks
        </Link>
      </div>
    </nav>
  );
} 