import { LoadingLink } from "@/components/LoadingLink";

export function Header() {
  return (
    <header className="header shell">
      <LoadingLink className="brand" href="/" loadingLabel="Home…">
        <span className="logo">O</span>
        <span>OmniPay AI</span>
      </LoadingLink>
      <nav className="nav">
        <LoadingLink className="btn" href="/#flow">Flow</LoadingLink>
        <LoadingLink className="btn" href="/dashboard" loadingLabel="Opening…">Dashboard</LoadingLink>
        <LoadingLink className="btn btn-primary" href="/create" loadingLabel="Opening…">Create invoice</LoadingLink>
      </nav>
    </header>
  );
}
