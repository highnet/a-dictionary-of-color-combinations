/**
 * Inline scripts that run in <head> before first paint, so stored choices
 * never flash. Kept out of "use client" modules: a string exported from one
 * reaches the server as a client reference, not as the string.
 */
export const SIDEBAR_KEY = "dcc:sidebar";
export const THEME_KEY = "dcc:theme";

export const bootScript =
  `try{if(localStorage.getItem("${SIDEBAR_KEY}")==="collapsed")document.documentElement.dataset.sidebar="collapsed"}catch(e){}` +
  `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}`;
