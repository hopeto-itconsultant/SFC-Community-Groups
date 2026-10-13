import { USER_COOKIE } from "@/lib/user-cookie";

/**
 * Runs before React. Pins the server calendar day for hydration, and copies a
 * legacy sessionStorage demo user into the cookie so the next navigation can
 * render on the server.
 */
export function bootScript(today: string): string {
  const key = JSON.stringify(USER_COOKIE);
  const day = JSON.stringify(today);
  return `window.__SFC_TODAY__=${day};try{var k=${key};var has=document.cookie.split(";").some(function(p){return p.trim().indexOf(k+"=")===0});if(!has){var legacy=sessionStorage.getItem(k);if(legacy){var secure=location.protocol==="https:"?"; Secure":"";document.cookie=k+"="+encodeURIComponent(legacy)+"; Path=/; SameSite=Lax"+secure;sessionStorage.removeItem(k);if(location.pathname==="/"||location.pathname==="/login")location.replace("/home");}}}catch(e){}`;
}
