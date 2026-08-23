import { DifficultyGroup } from "./DifficultyGroup";
import type { DifficultyGroupView } from "../../presentation/levels";

export type LevelGridProps = {
  groups: readonly DifficultyGroupView[];
  onOpenLevel: (levelId: number) => void;
};

/** หน้าเลือกด่านเต็ม — 5 ช่วงความยากเรียงกัน */
export function LevelGrid({ groups, onOpenLevel }: LevelGridProps) {
  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <DifficultyGroup key={group.difficulty} view={group} onOpenLevel={onOpenLevel} />
      ))}
    </div>
  );
}
