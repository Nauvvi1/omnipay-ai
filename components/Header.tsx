import Link from "next/link";

export function Header() {
  return (
    <header className="header shell">
      <Link className="brand" href="/">
        <span className="logo">O</span>
        <span>OmniPay AI</span>
      </Link>
      <nav className="nav">
        <Link className="btn" href="/#flow">Flow</Link>
        <Link className="btn" href="/pay/demo">Live demo</Link>
        <Link className="btn btn-primary" href="/create">Create invoice</Link>
      </nav>
    </header>
  );
}
