interface Props {
  onStart: () => void;
}

export function TitleScreen({ onStart }: Props) {
  return (
    <div className="title-screen">
      <div className="title-ascii">
        <pre>{`
 █████╗ ██████╗ ██╗  ██╗██████╗     ███████╗██╗  ██╗███████╗
██╔══██╗██╔══██╗██║  ██║██╔══██╗    ██╔════╝╚██╗██╔╝██╔════╝
███████║██║  ██║███████║██║  ██║    █████╗   ╚███╔╝ █████╗
██╔══██║██║  ██║██╔══██║██║  ██║    ██╔══╝   ██╔██╗ ██╔══╝
██║  ██║██████╔╝██║  ██║██████╔╝    ███████╗██╔╝ ██╗███████╗
╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝╚═════╝    ╚══════╝╚═╝  ╚═╝╚══════╝`}</pre>
      </div>
      <div className="title-subtitle">A Text Adventure About Getting Through The Day</div>
      <div className="title-meta">
        <p>Version 1.0.0 — Running on: <span className="blink">_</span></p>
        <p>Resources: FOCUS · TIME · CHAOS</p>
        <p>Rooms: 15 · Endings: 8 · Coffee: 1</p>
      </div>
      <div className="title-warning">
        <p>NOTE: Some distractions are intentionally tempting.</p>
        <p>NOTE: The game is aware of this.</p>
        <p>NOTE: So are you. This will not help.</p>
      </div>
      <button className="start-btn" onClick={onStart}>
        &gt; BEGIN DAY
      </button>
      <div className="title-footer">
        Press BEGIN DAY to start. Do not close this tab.
        <br />You will close this tab.
      </div>
    </div>
  );
}
