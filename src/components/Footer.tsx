export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 text-neutral-500 text-sm">
        <div className="flex gap-6">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Instagram
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Twitter
          </a>
          <a
            href="mailto:hello@example.com"
            className="hover:text-white transition-colors"
          >
            Email
          </a>
        </div>
        <p className="tracking-wide">
          &copy; {new Date().getFullYear()} Gallery. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
