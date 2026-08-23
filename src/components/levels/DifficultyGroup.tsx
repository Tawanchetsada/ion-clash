import { useId } from "react";
import { LevelTile } from "./LevelTile";
import type { DifficultyGroupView } from "../../presentation/levels";

export type DifficultyGroupProps = {
  view: DifficultyGroupView;
  onOpenLevel: (levelId: number) => void;
};

/** หนึ่งช่วงความยาก (10 ด่าน) พร้อมป้ายชื่อช่วง */
export function DifficultyGroup({ view, onOpenLevel }: DifficultyGroupProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="flex items-center gap-3">
      <h3 id={headingId} className="w-20 shrink-0 text-sm font-bold text-navy">
        {view.labelTh}
      </h3>
      <div className="flex flex-wrap gap-2">
        {view.levels.map((tile) => (
          <LevelTile key={tile.levelId} view={tile} onOpen={() => onOpenLevel(tile.levelId)} />
        ))}
      </div>
    </section>
  );
}
