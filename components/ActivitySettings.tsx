"use client";
import {
  hasLegacyActivity,
  type ActivitySettings as Settings,
} from "@/lib/activity-settings";

export default function ActivitySettings({
  value,
  onChange,
}: {
  value: Settings;
  onChange: (next: Settings) => void;
}) {
  if (hasLegacyActivity(value))
    return (
      <div className="p-notice">
        <p>
          Din gemte samlede aktivitetsfaktor er{" "}
          {{ low: 1.4, moderate: 1.6, high: 1.8 }[
            value.activity!
          ].toLocaleString("da-DK")}
          . Den omfatter hverdag og træning og bevares, når du ændrer
          måltidsantal eller træningsplan.
        </p>
        <button
          type="button"
          className="p-secondary"
          onClick={() =>
            onChange({
              activity: "moderate",
              everydayActivity: "moving",
              trainingActivity: "regular",
            })
          }
        >
          Opdatér aktivitetsvurdering
        </button>
        <p className="p-note">
          En ny vurdering ændrer beregningen i forhåndsvisningen. Du bekræfter,
          før den gemmes.
        </p>
      </div>
    );
  return (
    <div className="form-grid">
      <label>
        Hverdagsaktivitet
        <select
          value={value.everydayActivity || "moving"}
          onChange={(e) =>
            onChange({
              activity: "moderate",
              trainingActivity: value.trainingActivity || "regular",
              everydayActivity: e.target.value as Settings["everydayActivity"],
            })
          }
        >
          <option value="seated">Mest siddende</option>
          <option value="moving">En del stående og gående</option>
          <option value="physical">Fysisk arbejde / meget bevægelse</option>
        </select>
      </label>
      <label>
        Samlet træningsaktivitet
        <select
          value={value.trainingActivity || "regular"}
          onChange={(e) =>
            onChange({
              activity: "moderate",
              everydayActivity: value.everydayActivity || "moving",
              trainingActivity: e.target.value as Settings["trainingActivity"],
            })
          }
        >
          <option value="light">Let · typisk under 150 min./uge</option>
          <option value="regular">Regelmæssig · typisk 150–300 min./uge</option>
          <option value="heavy">Høj · typisk over 300 min./uge</option>
        </select>
      </label>
    </div>
  );
}
