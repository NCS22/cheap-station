import logoUrl from '../assets/cheap-station-header-128.svg';

export function Header() {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <a className="brand" href="#" aria-label="CheapStation inicio">
          <img
            className="brand__logo"
            src={logoUrl}
            alt="Logotipo de CheapStation"
            width={40}
            height={40}
          />
          <span className="brand__name">
            Cheap<span className="brand__accent">Station</span>
          </span>
        </a>
        <p className="brand__tagline">Gasolineras baratas cerca de ti</p>
      </div>
    </header>
  );
}
