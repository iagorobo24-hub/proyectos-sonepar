import { Outlet } from 'react-router-dom';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import styles from './AppShell.module.css';

/* AppShell — contenedor principal que une topbar, sidebar y contenido */
export default function AppShell() {
  return (
    <div className={styles.shell}>
      <div className={styles.topbar}>
        <Topbar />
      </div>
      <div className={styles.sidebar}>
        <Sidebar />
      </div>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
