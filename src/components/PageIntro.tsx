import Icon from "./Icon";

export default function PageIntro({ kicker, title, copy, action, onAction }: { kicker: string; title: string; copy: string; action: string; onAction: () => void }) {
  return (
    <div className="page-intro">
      <div><p className="eyebrow">{kicker}</p><h2>{title}</h2><p>{copy}</p></div>
      <button onClick={onAction}>{action} <Icon name="arrow" size={16} /></button>
    </div>
  );
}
