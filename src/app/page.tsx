import styles from "./page.module.css";

export default function HomePage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Welcome to Mini Notion</h1>
      <p className={styles.subtext}>
        Create a page from the sidebar to get started.
      </p>
    </div>
  );
}
