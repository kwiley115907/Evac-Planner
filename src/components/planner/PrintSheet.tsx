"use client";

import { MarkerIcon } from "@/components/MarkerIcon";
import { EMERGENCY_NOTES_EN, EMERGENCY_NOTES_ES, MARKER_DEFS, MARKER_TYPE_ORDER } from "@/lib/planner-config";
import type { PlacedMarker } from "@/lib/plannerTypes";

interface PrintSheetProps {
  plannerTitle: string;
  facilityName: string;
  floorName: string;
  preparedBy: string;
  approvedBy: string;
  logoUrl: string;
  items: PlacedMarker[];
  routeCount: number;
  printPreviewImage: string | null;
}

export function PrintSheet({ plannerTitle, facilityName, floorName, preparedBy, approvedBy, logoUrl, items, routeCount, printPreviewImage }: PrintSheetProps) {
  return (
    <div className="print-sheet">
      <div className="print-sheet__header">
        <div className="print-sheet__brand">
          <img src={logoUrl} alt="Company Logo" />
        </div>
        <div className="print-sheet__title">
          <h1>{plannerTitle}</h1>
          <div>{facilityName}</div>
          <div>{floorName}</div>
        </div>
        <div className="print-sheet__revision">
          <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
          <div><strong>Revision:</strong> 01</div>
          <div><strong>Prepared By:</strong> {preparedBy || "________________"}</div>
          <div><strong>Markers:</strong> {items.length}</div>
          <div><strong>Routes:</strong> {routeCount}</div>
        </div>
      </div>

      <div className="print-sheet__body">
        <section className="print-sheet__map-panel">
          {printPreviewImage ? (
            <img src={printPreviewImage} alt="Printable evacuation map" />
          ) : (
            <div className="print-sheet__placeholder">Select Print / Save PDF to generate the map preview.</div>
          )}
        </section>
        <aside className="print-sheet__side-panel">
          <div className="print-sheet__card print-sheet__sign-card">
            <h3>Revision / Approval</h3>
            <div className="print-sheet__sign-row"><span>Revision</span><strong>01</strong></div>
            <div className="print-sheet__sign-row"><span>Prepared By</span><strong>{preparedBy || "________________"}</strong></div>
            <div className="print-sheet__sign-row"><span>Approved By</span><strong>{approvedBy || "________________"}</strong></div>
            <div className="print-sheet__sign-row"><span>Signature</span><span className="sign-line" /></div>
          </div>
          <div className="print-sheet__card">
            <h3>Legend</h3>
            <div className="print-sheet__legend-list">
              {MARKER_TYPE_ORDER.map((type) => {
                const def = MARKER_DEFS[type];
                return (
                  <div className="print-sheet__legend-item" key={type}>
                    <span className="print-sheet__legend-icon">
                      <MarkerIcon type={type} scale={0.72} variant="tool" />
                    </span>
                    <span className="print-sheet__legend-text">
                      <strong>{def.label}</strong>
                      <span>{def.description}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      <div className="print-sheet__notes-row">
        <div className="print-sheet__card">
          <h3>Emergency Notes / English</h3>
          <ul>{EMERGENCY_NOTES_EN.map((line) => <li key={line}>{line}</li>)}</ul>
        </div>
        <div className="print-sheet__card">
          <h3>Notas de Emergencia / Español</h3>
          <ul>{EMERGENCY_NOTES_ES.map((line) => <li key={line}>{line}</li>)}</ul>
        </div>
      </div>

      <div className="print-sheet__footer">
        Copyright 2026 - All Rights Reserved - Prepared by: {preparedBy || "________________"} -
      </div>
    </div>
  );
}
