// Fills every .phone .screen[data-status] with a status bar, island and home indicator.
// Signal and wifi glyphs are shown on purpose: transcription needs a connection.
const SIGNAL = '<svg viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>';
const WIFI = '<svg viewBox="0 0 16 12"><path d="M8 2.6c2.4 0 4.6.9 6.2 2.5l1.3-1.3A10.7 10.7 0 0 0 8 .8 10.7 10.7 0 0 0 .5 3.8l1.3 1.3A8.7 8.7 0 0 1 8 2.6Zm0 3.6c1.4 0 2.7.5 3.6 1.4L13 6.3A7.3 7.3 0 0 0 8 4.3a7.3 7.3 0 0 0-5 2l1.4 1.3c.9-.9 2.2-1.4 3.6-1.4Zm0 3.5c.5 0 1 .2 1.3.5L8 11.6 6.7 10.2c.3-.3.8-.5 1.3-.5Z"/></svg>';
const BATTERY = '<svg viewBox="0 0 27 12"><rect x=".6" y=".6" width="22.8" height="10.8" rx="3.2" fill="none" stroke="currentColor" stroke-opacity=".45" stroke-width="1.1"/><rect x="2.2" y="2.2" width="17" height="7.6" rx="1.9"/><path d="M25 4v4c.8-.3 1.4-1.1 1.4-2S25.8 4.3 25 4Z" fill-opacity=".45"/></svg>';

export function decoratePhones(root = document) {
  for (const screen of root.querySelectorAll('.phone .screen[data-status]')) {
    screen.insertAdjacentHTML('afterbegin',
      `<div class="status"><span class="time">9:41</span><span class="icons">${SIGNAL}${WIFI}${BATTERY}</span></div><div class="island"></div>`);
    screen.insertAdjacentHTML('beforeend', '<div class="home"></div>');
  }
}
