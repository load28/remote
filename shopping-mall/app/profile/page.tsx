'use client';

import Link from 'next/link';
import { ArrowLeft, User, Package, MapPin, CreditCard, Bell, HelpCircle, LogOut, ChevronRight } from 'lucide-react';
import styles from './page.module.css';

const menuItems = [
  { icon: Package, label: 'My Orders', href: '/orders' },
  { icon: MapPin, label: 'Addresses', href: '/addresses' },
  { icon: CreditCard, label: 'Payment Methods', href: '/payments' },
  { icon: Bell, label: 'Notifications', href: '/notifications' },
  { icon: HelpCircle, label: 'Help & Support', href: '/help' },
];

export default function ProfilePage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.backBtn}>
          <ArrowLeft size={20} />
        </Link>
        <h1 className={styles.title}>Profile</h1>
        <div className={styles.placeholder} />
      </header>

      <div className={styles.userSection}>
        <div className={styles.avatar}>
          <User size={32} />
        </div>
        <div className={styles.userInfo}>
          <h2>Demo User</h2>
          <p>demo@example.com</p>
        </div>
      </div>

      <div className={styles.menu}>
        {menuItems.map(({ icon: Icon, label, href }) => (
          <Link key={href} href={href} className={styles.menuItem}>
            <Icon size={20} />
            <span>{label}</span>
            <ChevronRight size={18} className={styles.arrow} />
          </Link>
        ))}
      </div>

      <div className={styles.logout}>
        <button className={styles.logoutBtn}>
          <LogOut size={20} />
          <span>Log Out</span>
        </button>
      </div>
    </main>
  );
}
