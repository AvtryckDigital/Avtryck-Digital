"use client";

import styles from "./HomeProcess.module.css";

const steps = [
  {
    step: "01",
    label: "Prata med oss",
    headline: "Berätta om ditt företag.",
    body: "Vi tar ett kort strategisamtal för att förstå vad du gör, vilka du riktar dig till och hur vi kan hjälpa er att synas bättre.",
    accent: "#a5f3b0",
  },
  {
    step: "02",
    label: "Vi designar & bygger",
    headline: "Du får en sajt på dagar, inte månader.",
    body: "Vi designar, bygger och testar allt. Du kan ge feedback när som helst. De flesta sajter är klara att lansera inom 1–2 veckor.",
    accent: "#93c5fd",
  },
  {
    step: "03",
    label: "Lansering & support",
    headline: "Dags att köra — vi finns kvar.",
    body: "Vi sköter lanseringen, sätter upp hosting och finns tillgängliga för uppdateringar och frågor. Vi är med från lansering och lyssnar på era krav.",
    accent: "#F2A7B5",
  },
];

export default function HomeProcess() {
  return (
    <section className={styles.section}>
      <div className={`${styles.header} ${styles.fadeIn}`}>
        <span className={styles.eyebrow}>Så fungerar det</span>
        <h2 className={styles.title}>Enkelt från start till lansering.</h2>
        <p className={styles.subtitle}>
          Ingen krånglig process. Du pratar direkt med dem som faktiskt gör jobbet.
        </p>
      </div>
      <div className={styles.grid}>
        {steps.map((s, i) => (
          <div
            key={s.step}
              className={`${styles.card} ${styles.fadeIn}`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={styles.cardTop}>
               
              </div>
              <div>
                <span className={styles.cardLabel}>{s.label}</span>
                <h3 className={styles.cardTitle}>{s.headline}</h3>
              </div>
              <p className={styles.cardBody}>{s.body}</p>
            </div>
          ))}
      </div>
    </section>
  );
}
