import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full py-6 bg-gradient-to-t from-[#7f7fd5]/30 to-white/0 flex flex-col items-center mt-auto">
      <div className="flex gap-6 text-gray-600 text-sm">
        <Link href="/privacy-policy" className="hover:underline">Privacy Policy</Link>
        <span>|</span>
        <Link href="/terms-of-service" className="hover:underline">Terms of Service</Link>
      </div>
      <div className="mt-2 text-xs text-gray-400">&copy; {new Date().getFullYear()} Jules Labs. All rights reserved.</div>
    </footer>
  );
}
