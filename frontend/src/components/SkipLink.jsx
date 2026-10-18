export default function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only fixed top-2 left-2 z-50 bg-black text-white px-3 py-1 rounded-sm"
    >
      Skip to main content
    </a>
  );
}
