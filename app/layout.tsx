import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'SHAZ — 100 DAY TRANSFORMATION',description:'100 dage. En stærkere version af dig. Træning, kost og struktur til 399 kr. én gang.',icons:{icon:'/favicon.svg'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="da"><body>{children}</body></html>}
