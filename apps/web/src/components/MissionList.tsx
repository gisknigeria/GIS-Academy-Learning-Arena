import type { Mission } from "../data/dashboardData";

type MissionListProps = {
  missions: Mission[];
};

export function MissionList({ missions }: MissionListProps) {
  return (
    <div className="mission-list">
      {missions.map((mission) => {
        const Icon = mission.icon;
        return (
          <article className={`mission ${mission.tone}`} key={mission.title}>
            <div className="mission-icon">
              <Icon size={20} />
            </div>
            <div>
              <h3>{mission.title}</h3>
              <p>{mission.meta}</p>
            </div>
            <button>{mission.action}</button>
          </article>
        );
      })}
    </div>
  );
}
