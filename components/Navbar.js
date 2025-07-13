import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/router';

const Navbar = () => {
  const { admin, logout, isSuperAdmin } = useAuth();
  const router = useRouter();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Users', href: '/users' },
    { name: 'Applications', href: '/applications' },
    { name: 'Profile', href: '/profile' },
  ];

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">Admin Panel</h1>
            {isSuperAdmin && (
              <span className="ml-2 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                Super Admin
              </span>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  router.pathname.startsWith(item.href)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User Info & Logout */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">
              Welcome, {admin?.full_name || admin?.username}
            </span>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pt-2">
          <nav className="flex space-x-4 pb-3">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  router.pathname.startsWith(item.href)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
