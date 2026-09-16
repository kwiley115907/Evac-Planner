import Link from "next/link";

export default function Home() {
  return (
    <main className="landing-shell landing-shell--premium">
      <section className="landing-hero landing-hero--premium">
        <div className="landing-hero__ambient landing-hero__ambient--one" />
        <div className="landing-hero__ambient landing-hero__ambient--two" />
        <div className="landing-hero__ambient landing-hero__ambient--three" />
        <div className="landing-hero__grid" />

        <div className="landing-nav">
          <div className="landing-brand">
            <img src="/Logo1.png" alt="Evacuate.Today logo" className="landing-brand__logo" />
            <div className="landing-brand__text">
              <strong>Evacuate.Today</strong>
              <span>Professional Evacuation Planner</span>
            </div>
          </div>
          <div className="landing-nav__actions">
            <a href="#sample-plan" className="landing-btn landing-btn--ghost">View Sample</a>
            <Link href="/planner" className="landing-btn landing-btn--primary">Open Planner</Link>
          </div>
        </div>

        <div className="landing-hero__content landing-hero__content--premium">
          <div className="landing-hero__copy">
            <div className="landing-badge">Premium &bull; Branded &bull; Wall-Ready</div>
            <h1>Build Official Evacuation Plans for you Company.</h1>
            <p>
              Upload a real floorplan, place life-safety symbols, generate realistic routes, and export a Customized
              one-page evacuation sheet for your Business.
            </p>
            <div className="landing-hero__cta">
              <Link href="/planner" className="landing-btn landing-btn--primary">Start Building</Link>
              <a href="#sample-plan" className="landing-btn landing-btn--secondary">View Sample Plan</a>
            </div>
            <div className="landing-stat-row">
              <div className="landing-stat-card">
                <strong>1 Page</strong>
                <span>print-ready output</span>
              </div>
              <div className="landing-stat-card">
                <strong>Real Routes</strong>
                <span>walkable path planning</span>
              </div>
              <div className="landing-stat-card">
                <strong>Mobile + Desktop</strong>
                <span>usable anywhere</span>
              </div>
            </div>
          </div>

          <div className="landing-hero__visual landing-hero__visual--premium">
            <div className="hero-orbit hero-orbit--one" />
            <div className="hero-orbit hero-orbit--two" />
            <div className="hero-screen">
              <div className="hero-screen__topbar">
                <span /><span /><span />
              </div>
              <div className="hero-screen__body">
                <div className="hero-screen__sidebar">
                  <div className="hero-screen__sidebar-block" />
                  <div className="hero-screen__sidebar-block" />
                  <div className="hero-screen__sidebar-block" />
                  <div className="hero-screen__sidebar-block" />
                </div>
                <div className="hero-map hero-map--premium">
                  <div className="hero-map__logo">LOGO</div>
                  <div className="hero-map__legend">
                    <strong>Legend</strong>
                    <span>EXIT</span>
                    <span>{"\u{1F9EF}"} Extinguisher</span>
                    <span>{"\u{1F4CD}"} Assembly</span>
                    <span>L1 Elevator</span>
                  </div>
                  <div className="hero-map__room">YOU<br />ARE<br />HERE</div>
                  <div className="hero-map__exit hero-map__exit--one">EXIT</div>
                  <div className="hero-map__exit hero-map__exit--two">EXIT</div>
                  <div className="hero-map__symbol hero-map__symbol--red">{"\u{1F9EF}"}</div>
                  <div className="hero-map__symbol hero-map__symbol--blue">{"\u{1F4CD}"}</div>
                  <div className="hero-map__symbol hero-map__symbol--purple">L1</div>
                  <svg className="hero-map__routes" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <polyline points="18,62 32,62 32,40 56,40 56,22 82,22" />
                    <polyline points="18,62 28,62 28,80 74,80" />
                  </svg>
                  <div className="hero-map__info hero-map__info--top">
                    <strong>Plan Status</strong>
                    <span>Routes active</span>
                    <span>Legend ready</span>
                  </div>
                  <div className="hero-map__info hero-map__info--bottom">
                    <strong>Print Sheet</strong>
                    <span>Revision + Approval</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="hero-floating hero-floating--premium hero-floating--one">
              <strong>Professional Print Layout</strong>
              <span>One-page PDF with map, legend, notes, revision, and sign-off.</span>
            </div>
            <div className="hero-floating hero-floating--premium hero-floating--two">
              <strong>Route-Aware Planning</strong>
              <span>Paint walkable corridors so routes follow real travel paths.</span>
            </div>
          </div>
        </div>
      </section>

      <section id="sample-plan" className="landing-section">
        <div className="landing-section__header">
          <span className="landing-kicker">Sample plan</span>
          <h2>Show a real-looking evacuation sheet before users even enter the planner</h2>
          <p>Put a polished sample front and center so the site immediately feels credible, visual, and worth exploring.</p>
        </div>
        <div className="sample-plan">
          <div className="sample-plan__frame">
            <div className="sample-plan__browser"><span /><span /><span /></div>
            <div className="sample-plan__sheet">
              <div className="sample-plan__sheet-header">
                <div>
                  <strong>EVACUATION PLAN</strong>
                  <span>Main Office / Ground Floor</span>
                </div>
                <div className="sample-plan__sheet-meta">
                  <span>Revision 01</span>
                  <span>Prepared By</span>
                </div>
              </div>
              <div className="sample-plan__sheet-body">
                <div className="sample-plan__map">
                  <div className="sample-plan__map-chip sample-plan__map-chip--top">LOGO</div>
                  <div className="sample-plan__you">YOU ARE HERE</div>
                  <div className="sample-plan__exit sample-plan__exit--one">EXIT</div>
                  <div className="sample-plan__exit sample-plan__exit--two">EXIT</div>
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                    <polyline points="18,58 36,58 36,42 58,42 58,24 82,24" />
                    <polyline points="18,58 24,58 24,78 72,78" />
                  </svg>
                </div>
                <div className="sample-plan__side">
                  <div className="sample-plan__card">
                    <strong>Legend</strong>
                    <span>EXIT</span>
                    <span>{"\u{1F9EF}"} Fire Extinguisher</span>
                    <span>{"\u{1F4CD}"} Assembly Point</span>
                    <span>L1 Elevator</span>
                  </div>
                  <div className="sample-plan__card">
                    <strong>Revision / Approval</strong>
                    <span>Prepared By</span>
                    <span>Approved By</span>
                    <span>Signature</span>
                  </div>
                </div>
              </div>
              <div className="sample-plan__notes">
                <div className="sample-plan__card">
                  <strong>Emergency Notes</strong>
                  <span>Use nearest safe exit.</span>
                  <span>Proceed to assembly point.</span>
                  <span>Re-enter only after all-clear.</span>
                </div>
                <div className="sample-plan__card">
                  <strong>Notas de Emergencia</strong>
                  <span>Use la salida segura m&aacute;s cercana.</span>
                  <span>Dir&iacute;jase al punto de reuni&oacute;n.</span>
                  <span>No vuelva a entrar sin autorizaci&oacute;n.</span>
                </div>
              </div>
            </div>
          </div>
          <div className="sample-plan__content">
            <div className="sample-plan__feature-list">
              <div className="sample-plan__feature">
                <strong>Looks like a real posted plan</strong>
                <span>It feels like a final safety document, not just a blank web app.</span>
              </div>
              <div className="sample-plan__feature">
                <strong>Immediate product clarity</strong>
                <span>Visitors understand what the tool produces before they click anything.</span>
              </div>
              <div className="sample-plan__feature">
                <strong>Stronger first impression</strong>
                <span>Clean framing, branded layout, and visible route lines make it stand out.</span>
              </div>
            </div>
            <div className="sample-plan__actions">
              <Link href="/planner" className="landing-btn landing-btn--primary">Build Your Own Plan</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section__header">
          <span className="landing-kicker">Workflow</span>
          <h2>Fast enough for revisions. Clean enough for final posting.</h2>
          <p>The experience stays simple, but the output feels like a finished document your building can actually use.</p>
        </div>
        <div className="landing-steps">
          <article className="landing-step-card">
            <div className="landing-step-card__number">01</div>
            <h3>Upload the floorplan</h3>
            <p>Start from the actual layout using PNG, JPG, WEBP, or PDF.</p>
          </article>
          <article className="landing-step-card">
            <div className="landing-step-card__number">02</div>
            <h3>Place critical symbols</h3>
            <p>Mark exits, you-are-here, extinguishers, alarms, elevators, and stairwells.</p>
          </article>
          <article className="landing-step-card">
            <div className="landing-step-card__number">03</div>
            <h3>Export the final sheet</h3>
            <p>Generate a clean evacuation document with a map, legend, notes, and approvals.</p>
          </article>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section__header">
          <span className="landing-kicker">Why it stands out</span>
          <h2>Not another plain utility page</h2>
          <p>The homepage should feel like a product with presence, not just a tool hidden behind a form.</p>
        </div>
        <div className="landing-value-grid">
          <article className="landing-value-card">
            <h3>Command-center look</h3>
            <p>A first impression that feels premium, sharp, and different from plain web tools.</p>
          </article>
          <article className="landing-value-card">
            <h3>Facility-ready output</h3>
            <p>Designed for documents that can actually be posted, reviewed, and revised.</p>
          </article>
          <article className="landing-value-card">
            <h3>Custom branding</h3>
            <p>Use your own logo, labels, notes, and signature fields to match the property.</p>
          </article>
          <article className="landing-value-card">
            <h3>Fast revisions</h3>
            <p>Update plans quickly without rebuilding the entire evacuation sheet from scratch.</p>
          </article>
        </div>
      </section>

      <section className="landing-cta-panel">
        <div>
          <span className="landing-kicker">Launch the planner</span>
          <h2>Create a polished evacuation sheet with your own floorplan and branding.</h2>
          <p>Start from the real layout, place your symbols, and export something that feels finished and professional.</p>
        </div>
        <div className="landing-cta-panel__actions">
          <Link href="/planner" className="landing-btn landing-btn--primary">Open Planner</Link>
        </div>
        <footer className="site-footer">
          <div className="site-footer__inner">
            <div className="site-footer__brand">
              <span>&copy; 2026 Evacuate.Today - All rights reserved. - Prepared by: K.A. Wiley</span>
            </div>
          </div>
        </footer>
      </section>
    </main>
  );
}
