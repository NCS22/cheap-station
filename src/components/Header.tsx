export function Header() {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <a className="brand" href="#" aria-label="CheapStation inicio">
          <span className="brand__logo" aria-hidden="true">
            ⛽
          </span>
          <span className="brand__name">
            Cheap<span className="brand__accent">Station</span>
          </span>
        </a>
        <p className="brand__tagline">Gasolineras baratas cerca de ti</p>
      </div>
    </header>
  );
}
