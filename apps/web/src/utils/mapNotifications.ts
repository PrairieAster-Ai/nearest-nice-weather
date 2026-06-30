/**
 * ========================================================================
 * MAP NOTIFICATIONS
 * ========================================================================
 *
 * Self-contained, imperative DOM notifications shown over the Leaflet map.
 * Extracted from MapContainer so the component keeps only its map lifecycle.
 * These functions touch the DOM directly (Leaflet is imperative); they hold no
 * React state and are safe to call from effects or event handlers.
 */

/**
 * Show a transient "End of Results" toast centered over the viewport, with an OK
 * button and a 5-second auto-dismiss. Used when the user navigates past the last
 * available POI and the search can't expand further.
 *
 * @example
 * ```ts
 * if (isAtFarthest && !canExpand) showEndOfResultsNotification();
 * ```
 */
export function showEndOfResultsNotification(): void {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 20px 30px;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    z-index: 10000;
    text-align: center;
    max-width: 300px;
  `;

  notification.innerHTML = `
    <h3 style="margin: 0 0 10px 0; color: #333;">End of Results</h3>
    <p style="margin: 0 0 15px 0; color: #666;">That's all the results we have for this area!</p>
    <button style="
      background: #4CAF50;
      color: white;
      border: none;
      padding: 8px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    ">OK</button>
  `;

  // Add click handler to OK button
  const okButton = notification.querySelector('button');
  if (okButton) {
    okButton.addEventListener('click', () => {
      notification.remove();
    });
  }

  document.body.appendChild(notification);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 5000);
}
