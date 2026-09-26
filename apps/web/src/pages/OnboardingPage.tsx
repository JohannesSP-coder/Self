import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { ArrowUpIcon, BatteryIcon, DumbbellIcon, MoonIcon, RingsIcon } from "../components/Icons";

interface Scene {
  zone: "red" | "black";
  icon: ReactNode;
  eyebrow: string;
  title: string;
  body: ReactNode;
  callout?: ReactNode;
}

const SCENES: Scene[] = [
  {
    zone: "red",
    icon: <RingsIcon size={42} />,
    eyebrow: "Willkommen bei Meglio",
    title: "Bevor's losgeht: 3 Dinge, die wirklich zählen",
    body: (
      <>
        Meglio dreht sich nicht nur ums Häkchen-Setzen. Drei Bereiche entscheiden mehr als alles andere
        darüber, wie du dich fühlst und was du leistest: <strong>Fitness</strong>, <strong>Erholung</strong>{" "}
        und <strong>Schlaf</strong>. In 2-3 Minuten zeigen wir dir, warum.
      </>
    ),
  },
  {
    zone: "black",
    icon: <DumbbellIcon size={40} />,
    eyebrow: "Bereich 1 · Fitness",
    title: "Fitness ist dein Fundament",
    body: (
      <>
        Regelmäßige Bewegung wirkt sich nachweislich auf Stimmung, Energielevel und sogar dein Gedächtnis aus –
        unabhängig davon, mit welchem Fitnesslevel du startest. Es zählt nicht die perfekte Einheit, sondern die
        Konstanz über Wochen und Monate.
      </>
    ),
    callout: "Bewegung wirkt nachweislich stimmungsaufhellend – oft schon nach wenigen Minuten.",
  },
  {
    zone: "red",
    icon: <BatteryIcon size={40} />,
    eyebrow: "Bereich 2 · Erholung",
    title: "Erholung ist kein Nice-to-have",
    body: (
      <>
        Dein Körper und dein Kopf brauchen bewusste Pausen, um Trainingsreize, Stress und neue Eindrücke zu
        verarbeiten. Ohne Erholung bringt selbst das beste Training langfristig wenig – Übertraining und Erschöpfung
        sind die Folge.
      </>
    ),
    callout: "Fortschritt entsteht in der Erholung nach der Belastung – nicht nur während des Trainings.",
  },
  {
    zone: "black",
    icon: <MoonIcon size={40} />,
    eyebrow: "Bereich 3 · Schlaf",
    title: "Schlaf ist dein größter Hebel",
    body: (
      <>
        Kaum ein Faktor beeinflusst Fitness, Mindset und Selbstkontrolle so stark wie guter Schlaf. In der
        Schlafforschung herrscht Einigkeit: Tiefschlafphasen sind zentral für Gedächtniskonsolidierung,
        Zellreparatur und emotionale Regulation.
      </>
    ),
    callout: "Tiefschlaf ist zentral für Gedächtnis, Zellreparatur und emotionale Balance.",
  },
  {
    zone: "red",
    icon: <MoonIcon size={40} />,
    eyebrow: "Bereich 3 · Schlaf",
    title: "Deshalb hat Schlaf bei dir Priorität",
    body: (
      <>
        Schlechter Schlaf schwächt nachweislich die Impulskontrolle – etwa beim Umgang mit Süchten oder schlechten
        Gewohnheiten. Deshalb hast du in Meglio von Anfang an einen eigenen Schlaf-Bereich, nicht als Extra, sondern
        als Basis.
      </>
    ),
    callout: (
      <span className="callout-with-icon">
        <span className="callout-icon"><MoonIcon size={18} /></span>
        Dein Schlaf-Bereich wartet schon: kleine Routinen wie ein fester Bildschirm-aus-Zeitpunkt machen oft mehr
        Unterschied als jede zusätzliche Trainingseinheit.
      </span>
    ),
  },
  {
    zone: "black",
    icon: <ArrowUpIcon size={40} />,
    eyebrow: "Bereit?",
    title: "Bereit, ein bisschen besser zu werden?",
    body: (
      <>
        Fitness, Erholung und Schlaf sind ab jetzt Teil deines Alltags in Meglio. Leg direkt los – dein
        Schlaf-Bereich wartet schon auf dich.
      </>
    ),
  },
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const { finishOnboarding } = useAuth();
  const [index, setIndex] = useState(0);
  const scene = SCENES[index];
  const isLast = index === SCENES.length - 1;

  function next() {
    if (!isLast) {
      setIndex(index + 1);
      return;
    }
    finishOnboarding();
    navigate("/", { replace: true });
  }

  return (
    <div className="onboarding">
      <div className={`onboarding-zone zone-${scene.zone}`}>
        <div className="story-progress" aria-label={`Schritt ${index + 1} von ${SCENES.length}`}>
          {SCENES.map((_, i) => (
            <div key={i} className="story-track">
              {i < index && <div className="story-fill full" />}
              {i === index && <div key={index} className="story-fill playing" />}
            </div>
          ))}
        </div>
        {!isLast && (
          <Link to="/" replace className="story-skip" onClick={finishOnboarding}>
            Überspringen
          </Link>
        )}
        <div className="zone-ring">
          <div className={isLast ? "zone-core solid" : "zone-core"}>{scene.icon}</div>
        </div>
      </div>

      <div className="onboarding-sheet">
        <div className="eyebrow">{scene.eyebrow}</div>
        <h1 className="onboarding-title">{scene.title}</h1>
        <p className="onboarding-body">{scene.body}</p>
        {scene.callout && <div className="callout">{scene.callout}</div>}
        <div className="grow" />
        <button type="button" className={isLast ? "btn btn-primary btn-glow" : "btn btn-primary"} onClick={next}>
          {isLast ? "Los geht's" : "Weiter"}
        </button>
      </div>
    </div>
  );
}
